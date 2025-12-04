import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'

import { ArrowLeft } from 'lucide-react'

interface ChatWindowProps {
    chatId: string
    onBack?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
    const { data, mutate } = useSWR(chatId ? `/api/chats/${chatId}` : null, fetcher, { refreshInterval: 1000 })
    const messages = data?.messages || []
    const conversation = data?.conversation

    const [inputValue, setInputValue] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const handleSend = async () => {
        if (!inputValue.trim()) return

        const content = inputValue
        setInputValue('')

        await fetch(`/api/chats/${chatId}/send`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        })

        mutate()
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header (Mobile & Desktop) */}
            <div className="flex items-center p-4 border-b border-border bg-card">
                {/* Back Button (Mobile Only) */}
                <div className="md:hidden mr-2">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                    <span className="font-semibold">{conversation?.contactName || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{conversation?.contactPhone}</span>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-hidden">
                <ScrollArea className="h-full pr-4">
                    <div className="flex flex-col gap-4">
                        {messages?.map((msg: any) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>
            </div>
            <div className="p-4 border-t border-border bg-background">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend() }}
                    className="flex gap-2"
                >
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1"
                    />
                    <Button type="submit" size="icon">
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </div>
    )
}
