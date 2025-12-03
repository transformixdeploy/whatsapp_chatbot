import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'

interface ChatWindowProps {
    chatId: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ChatWindow({ chatId }: ChatWindowProps) {
    const { data: messages, mutate } = useSWR(chatId ? `/api/chats/${chatId}` : null, fetcher, { refreshInterval: 1000 })
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

        // Optimistic update (optional, but good for UX)
        // For now, we'll just wait for the API

        await fetch(`/api/chats/${chatId}/send`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        })

        mutate()
    }

    return (
        <div className="flex flex-col h-full">
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
