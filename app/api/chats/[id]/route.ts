import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    // Get conversation details
    const conversation = await prisma.conversation.findUnique({
        where: { id },
        select: {
            contactName: true,
            contactPhone: true,
        },
    })

    // Get messages
    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
        conversation,
        messages,
    })
}
