import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const chat = await prisma.conversation.create({
            data: {
                contactPhone: '01207227165',
                contactName: 'Ahmed',
                messages: {
                    create: [
                        { content: 'Hello, is this the testing bot?', sender: 'user' },
                        { content: 'Yes Ahmed, I am ready!', sender: 'bot' },
                    ],
                },
                unreadCount: 1,
            },
        })
        console.log('Created:', chat)
    } catch (e) {
        console.error('Error creating chat (maybe already exists):', e)
    }
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
