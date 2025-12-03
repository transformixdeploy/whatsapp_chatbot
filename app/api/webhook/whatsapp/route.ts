import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 })
    }
    return new NextResponse('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        console.log('📥 Webhook Received:', JSON.stringify(body, null, 2))

        const entry = body.entry?.[0]
        const changes = entry?.changes?.[0]
        const value = changes?.value
        const message = value?.messages?.[0]

        if (message) {
            const from = message.from
            const text = message.text?.body
            const name = value.contacts?.[0]?.profile?.name

            if (text) {
                // 1. Find or create conversation & Store User Message (Must wait for this)
                let conversation = await prisma.conversation.findUnique({
                    where: { contactPhone: from },
                })

                if (!conversation) {
                    conversation = await prisma.conversation.create({
                        data: {
                            contactPhone: from,
                            contactName: name,
                        },
                    })
                }

                await prisma.message.create({
                    data: {
                        conversationId: conversation.id,
                        content: text,
                        sender: 'user',
                    },
                })

                await prisma.conversation.update({
                    where: { id: conversation.id },
                    data: {
                        lastMessageAt: new Date(),
                        unreadCount: { increment: 1 },
                    },
                })

                // 2. Trigger AI Response in Background (Fire-and-Forget) 🚀
                // We do NOT await this, so we can return 200 OK immediately.
                processAIResponse(conversation.id, from, text).catch(err => {
                    console.error('❌ Background AI Error:', err)
                })
            }
        }

        // 3. Return 200 OK Immediately
        return new NextResponse('EVENT_RECEIVED', { status: 200 })
    } catch (error) {
        console.error('Webhook error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

// Separate function for background processing
async function processAIResponse(conversationId: string, userPhone: string, userText: string) {
    console.log(`🤖 Starting AI generation for ${userPhone}...`)
    let aiResponseText = ''

    try {
        const history = await prisma.message.findMany({
            where: { conversationId: conversationId },
            orderBy: { createdAt: 'desc' },
            take: 5,
        })

        const formattedHistory = history.reverse().map(msg => ({
            role: msg.sender,
            content: msg.content
        }))

        // Call Python Service
        const ragUrl = process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000'
        const pythonRes = await fetch(`${ragUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userText,
                history: formattedHistory
            })
        })

        if (!pythonRes.ok) {
            throw new Error('Python service error')
        }

        const pythonData = await pythonRes.json()
        aiResponseText = pythonData.response

    } catch (error) {
        console.error('AI Generation Error:', error)
        aiResponseText = "I'm having trouble connecting to my brain right now. Please try again later."
    }

    if (aiResponseText) {
        // Store AI message
        await prisma.message.create({
            data: {
                conversationId: conversationId,
                content: aiResponseText,
                sender: 'bot',
            },
        })

        // Send to WhatsApp
        await sendWhatsAppMessage(userPhone, aiResponseText)
        console.log(`✅ AI Reply sent to ${userPhone}`)
    }
}
