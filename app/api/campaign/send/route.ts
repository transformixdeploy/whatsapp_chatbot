import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
    try {
        const { cards, numbers, templateName, language } = await req.json()

        if (!cards || !numbers || !Array.isArray(numbers)) {
            return new NextResponse('Invalid request body', { status: 400 })
        }

        // Construct the Template Payload
        const components = [
            {
                type: 'carousel',
                cards: cards.map((card: any) => ({
                    card_index: 0,
                    components: [
                        {
                            type: 'header',
                            parameters: [
                                {
                                    type: 'image',
                                    image: {
                                        link: card.headerUrl
                                    }
                                }
                            ]
                        },
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: card.bodyText
                                }
                            ]
                        },
                        // Dynamic buttons would go here if supported by the template
                    ]
                }))
            }
        ]

        const results = await Promise.all(numbers.map(async (number: string) => {
            try {
                const cleanNumber = number.replace(/\D/g, '')

                // 1. Try to send as Template
                if (templateName) {
                    const token = process.env.WHATSAPP_TOKEN
                    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
                    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`

                    const body = {
                        messaging_product: 'whatsapp',
                        to: cleanNumber,
                        type: 'template',
                        template: {
                            name: templateName,
                            language: { code: language || 'en_US' },
                            components: components
                        }
                    }

                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(body)
                    })

                    if (res.ok) {
                        return { number, status: 'sent_template' }
                    }

                    console.error('Template send failed, falling back to text:', await res.text())
                }

                // 2. Fallback to Text Summary
                // If template failed or no template name provided
                const summary = cards.map((c: any, i: number) =>
                    `*Card ${i + 1}*\n${c.bodyText}\nImage: ${c.headerUrl}\nButton: ${c.buttonText} (${c.buttonUrl})`
                ).join('\n\n')

                await sendWhatsAppMessage(cleanNumber, summary)
                return { number, status: 'sent_text_fallback' }

            } catch (error) {
                console.error(`Failed to send to ${number}:`, error)
                return { number, status: 'failed', error }
            }
        }))

        return NextResponse.json({
            success: true,
            results
        })

    } catch (error) {
        console.error('Campaign send error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
