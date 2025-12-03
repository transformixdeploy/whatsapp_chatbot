async function main() {
    const response = await fetch('http://localhost:3000/api/webhook/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            entry: [{
                changes: [{
                    value: {
                        messages: [{
                            from: '1234567890',
                            text: { body: 'Hello from test script!' }
                        }],
                        contacts: [{
                            profile: { name: 'Test User' }
                        }]
                    }
                }]
            }]
        })
    })
    console.log('Status:', response.status)
    console.log('Body:', await response.text())
}

main()
