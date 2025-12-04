'use client'

import { useState } from 'react'
import { Plus, Trash, Send, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Card {
    id: string
    headerUrl: string
    bodyText: string
    buttonText: string
    buttonUrl: string
}

export function CampaignBuilder() {
    const [cards, setCards] = useState<Card[]>([
        { id: '1', headerUrl: '', bodyText: '', buttonText: 'Shop Now', buttonUrl: '' }
    ])
    const [recipients, setRecipients] = useState('')
    const [templateName, setTemplateName] = useState('marketing_carousel')
    const [language, setLanguage] = useState('en_US')
    const [sending, setSending] = useState(false)

    const addCard = () => {
        if (cards.length >= 10) return
        setCards([...cards, {
            id: Math.random().toString(36).substr(2, 9),
            headerUrl: '',
            bodyText: '',
            buttonText: 'Shop Now',
            buttonUrl: ''
        }])
    }

    const removeCard = (id: string) => {
        if (cards.length <= 1) return
        setCards(cards.filter(c => c.id !== id))
    }

    const updateCard = (id: string, field: keyof Card, value: any) => {
        setCards(cards.map(c => c.id === id ? { ...c, [field]: value } : c))
    }

    const handleSend = async () => {
        setSending(true)
        try {
            const numbers = recipients.split(/[\n,]+/).map(n => n.trim()).filter(n => n)
            const res = await fetch('/api/campaign/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cards, numbers, templateName, language })
            })
            if (res.ok) alert('Campaign sent!')
            else alert('Failed to send campaign')
        } catch (e) {
            alert('Error sending campaign')
        }
        setSending(false)
    }

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden pb-16 md:pb-0">
            {/* Editor */}
            <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-border p-6 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6 text-accent">Campaign Designer</h2>

                <div className="space-y-6">
                    {cards.map((card, index) => (
                        <div key={card.id} className="p-4 border border-border rounded-lg bg-card">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium">Card {index + 1}</h3>
                                {cards.length > 1 && (
                                    <button onClick={() => removeCard(card.id)} className="text-destructive hover:opacity-80">
                                        <Trash className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1">Image URL</label>
                                    <input
                                        type="text"
                                        value={card.headerUrl}
                                        onChange={(e) => updateCard(card.id, 'headerUrl', e.target.value)}
                                        className="w-full p-2 rounded bg-background border border-border"
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm text-muted-foreground block mb-1">Body Text</label>
                                    <textarea
                                        value={card.bodyText}
                                        onChange={(e) => updateCard(card.id, 'bodyText', e.target.value)}
                                        className="w-full p-2 rounded bg-background border border-border h-20 resize-none"
                                        placeholder="Enter card text..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-muted-foreground block mb-1">Button Text</label>
                                        <input
                                            type="text"
                                            value={card.buttonText}
                                            onChange={(e) => updateCard(card.id, 'buttonText', e.target.value)}
                                            className="w-full p-2 rounded bg-background border border-border"
                                            placeholder="Shop Now"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm text-muted-foreground block mb-1">Button URL</label>
                                        <input
                                            type="text"
                                            value={card.buttonUrl}
                                            onChange={(e) => updateCard(card.id, 'buttonUrl', e.target.value)}
                                            className="w-full p-2 rounded bg-background border border-border"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addCard}
                        className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Add Card
                    </button>
                </div>
            </div>

            {/* Preview & Send */}
            <div className="w-full md:w-1/2 p-6 flex flex-col bg-muted/10 overflow-y-auto md:overflow-visible">
                <div className="flex-1 overflow-y-auto mb-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                        <Eye className="w-4 h-4" /> Preview
                    </h3>

                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                        {cards.map((card) => (
                            <div key={card.id} className="flex-none w-64 bg-card rounded-lg overflow-hidden shadow-lg border border-border snap-center">
                                <div className="h-32 bg-muted flex items-center justify-center">
                                    {card.headerUrl ? (
                                        <img src={card.headerUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-muted-foreground text-xs">No Image</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-sm">{card.bodyText || 'Card body text...'}</p>
                                </div>
                                <div className="p-2 border-t border-border">
                                    <div className="w-full py-1.5 text-center text-accent font-medium text-sm bg-accent/10 rounded">
                                        {card.buttonText}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-medium mb-4">Configuration</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Template Name</label>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full p-2 rounded bg-background border border-border"
                                placeholder="e.g. marketing_carousel"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-muted-foreground block mb-1">Language Code</label>
                            <input
                                type="text"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full p-2 rounded bg-background border border-border"
                                placeholder="e.g. en_US"
                            />
                        </div>
                    </div>

                    <h3 className="text-lg font-medium mb-4">Recipients</h3>
                    <textarea
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        className="w-full h-32 p-3 rounded bg-background border border-border mb-4 resize-none"
                        placeholder="Enter phone numbers separated by commas or newlines..."
                    />
                    <button
                        onClick={handleSend}
                        disabled={sending || !recipients}
                        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {sending ? 'Sending...' : 'Send Campaign'}
                    </button>
                </div>
            </div>
        </div>
    )
}
