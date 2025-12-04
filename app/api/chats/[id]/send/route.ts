import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { content } = await req.json()
        const { id } = await params
        console.log(`📤 Sending message to chat ${id}: ${content}`)

        const conversation = await prisma.conversation.findUnique({
            where: { id },
        })

        if (!conversation) {
            console.error(`❌ Conversation ${id} not found`)
            return new NextResponse('Conversation not found', { status: 404 })
        }

        // 1. Store message
        await prisma.message.create({
            data: {
                conversationId: id,
                content,
                sender: 'agent',
            },
        })

        // 2. Send to WhatsApp
        console.log(`👉 Calling WhatsApp API for ${conversation.contactPhone}...`)
        await sendWhatsAppMessage(conversation.contactPhone, content)
        console.log(`✅ Message sent to WhatsApp!`)

        return new NextResponse('Message sent', { status: 200 })
    } catch (error) {
        console.error('❌ Send API Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
