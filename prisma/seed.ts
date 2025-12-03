import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const chat1 = await prisma.conversation.create({
        data: {
            contactPhone: '1234567890',
            contactName: 'Alice Wonderland',
            messages: {
                create: [
                    { content: 'Hello, I need help with my order.', sender: 'user' },
                    { content: 'Hi Alice! I can help with that. What is your order number?', sender: 'bot' },
                    { content: 'It is #12345.', sender: 'user' },
                ],
            },
            unreadCount: 1,
        },
    })

    const chat2 = await prisma.conversation.create({
        data: {
            contactPhone: '0987654321',
            contactName: 'Bob Builder',
            messages: {
                create: [
                    { content: 'Can you build a chatbot?', sender: 'user' },
                ],
            },
            unreadCount: 1,
        },
    })

    console.log({ chat1, chat2 })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
