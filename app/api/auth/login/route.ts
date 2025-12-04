import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

export async function POST(req: NextRequest) {
    try {
        const { username, password } = await req.json()

        const user = await prisma.user.findUnique({
            where: { username },
        })

        if (!user) {
            return new NextResponse('Invalid credentials', { status: 401 })
        }

        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) {
            return new NextResponse('Invalid credentials', { status: 401 })
        }

        // Create JWT
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
        const token = await new SignJWT({ userId: user.id, username: user.username })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret)

        // Set Cookie
        const response = new NextResponse('Logged in', { status: 200 })
        response.cookies.set('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        })

        return response
    } catch (error) {
        console.error('Login error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
