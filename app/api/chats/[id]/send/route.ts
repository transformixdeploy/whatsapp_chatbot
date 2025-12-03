import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { content } = await req.json()
    const { id } = await params

    const conversation = await prisma.conversation.findUnique({
        where: { id },
    })

    if (!conversation) {
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
    await sendWhatsAppMessage(conversation.contactPhone, content)

    return new NextResponse('Message sent', { status: 200 })
}
