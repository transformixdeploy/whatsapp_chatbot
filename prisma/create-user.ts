import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const username = process.argv[2]
    const password = process.argv[3]

    if (!username || !password) {
        console.error('Usage: npx tsx prisma/create-user.ts <username> <password>')
        process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        })
        console.log(`✅ User created: ${user.username}`)
    } catch (e) {
        console.error('❌ Error creating user (username might exist):', e)
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
