import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(req: NextRequest) {
    const token = req.cookies.get('auth_token')?.value

    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')
        const { payload } = await jwtVerify(token, secret)
        return NextResponse.json({ user: payload })
    } catch (error) {
        return new NextResponse('Invalid token', { status: 401 })
    }
}
