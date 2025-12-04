export async function sendWhatsAppMessage(to: string, body: string) {
    const token = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: to,
            text: { body: body },
        }),
    })

    const responseBody = await response.json()

    if (!response.ok) {
        console.error('❌ WhatsApp API Error:', JSON.stringify(responseBody, null, 2))
        throw new Error('Failed to send WhatsApp message')
    } else {
        console.log('✅ WhatsApp API Response:', JSON.stringify(responseBody, null, 2))
    }
}
