import { useState, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageBubble } from './MessageBubble'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

import { ArrowLeft } from 'lucide-react'

interface ChatWindowProps {
    chatId: string
    onBack?: () => void
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ChatWindow({ chatId, onBack }: ChatWindowProps) {
    const [isAtBottom, setIsAtBottom] = useState(true)
    const { data: chatData, mutate } = useSWR(chatId ? `/api/chats/${chatId}` : null, fetcher, {
        refreshInterval: 1000,
        keepPreviousData: true
    })
    const [inputValue, setInputValue] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const messages = chatData?.messages || []
    const conversation = chatData?.conversation

    // Check if user is at bottom
    const handleScroll = () => {
        if (!containerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        // Consider "at bottom" if within 100px of the bottom
        const isBottom = scrollHeight - scrollTop - clientHeight < 100
        setIsAtBottom(isBottom)
    }

    // Auto-scroll effect
    useEffect(() => {
        if (containerRef.current && isAtBottom && messages && messages.length > 0) {
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight
                }
            })
        }
    }, [messages?.length, messages?.[messages.length - 1]?.id, isAtBottom])

    // Scroll to bottom when chat changes or messages load
    useEffect(() => {
        if (containerRef.current && messages && messages.length > 0) {
            setIsAtBottom(true)
            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                if (containerRef.current && scrollRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight
                }
            })
        }
    }, [chatId, messages?.length])

    const handleSend = async () => {
        if (!inputValue.trim()) return

        const content = inputValue
        setInputValue('')
        setIsAtBottom(true) // Force scroll to bottom on send

        // Optimistic update (optional, but good for UX)
        // For now, we'll just wait for the API

        await fetch(`/api/chats/${chatId}/send`, {
            method: 'POST',
            body: JSON.stringify({ content }),
        })

        mutate()
    }

    return (
        <div className="flex flex-col h-full min-h-0 overflow-hidden">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center gap-3 p-4 border-b border-border bg-card flex-shrink-0">
                <Avatar>
                    <AvatarFallback>
                        {conversation?.contactName?.[0]?.toUpperCase() || conversation?.contactPhone?.[0] || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h2 className="font-semibold text-lg">
                        {conversation?.contactName || conversation?.contactPhone || 'Unknown'}
                    </h2>
                    {conversation?.contactPhone && (
                        <p className="text-sm text-muted-foreground">{conversation.contactPhone}</p>
                    )}
                </div>
            </div>

            {/* Mobile Header */}
            <div className="md:hidden flex items-center gap-3 p-4 border-b border-border bg-card flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-0">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar>
                    <AvatarFallback>
                        {conversation?.contactName?.[0]?.toUpperCase() || conversation?.contactPhone?.[0] || '?'}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h2 className="font-semibold">
                        {conversation?.contactName || conversation?.contactPhone || 'Chat'}
                    </h2>
                    {conversation?.contactPhone && (
                        <p className="text-xs text-muted-foreground">{conversation.contactPhone}</p>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden min-h-0 flex flex-col relative">
                <div
                    ref={containerRef}
                    onScroll={handleScroll}
                    className="absolute inset-0 overflow-y-auto px-4 py-4 custom-scrollbar"
                >
                    <div className="flex flex-col gap-4">
                        {messages?.map((msg: any) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        <div ref={scrollRef} />
                    </div>
                </div>
            </div>
            <div className="p-4 border-t border-border bg-background flex-shrink-0">
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
