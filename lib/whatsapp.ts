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

    if (!response.ok) {
        console.error('Failed to send WhatsApp message', await response.text())
    }
}
