'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ChatList } from '@/components/chat/ChatList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { NavSidebar } from '@/components/NavSidebar'
import { CampaignBuilder } from '@/components/campaign/CampaignBuilder'
import { cn } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<'chats' | 'campaigns'>('chats')
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const { data: chats, mutate } = useSWR('/api/chats', fetcher, { refreshInterval: 3000 })

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            {/* Navigation Sidebar */}
            <NavSidebar activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === 'chats' ? (
                <>
                    {/* Chat Sidebar (List) */}
                    <div className={cn(
                        "flex-col border-r border-border bg-background",
                        // Mobile: Full width, hidden if chat selected
                        selectedChatId ? "hidden md:flex md:w-80" : "flex w-full md:w-80"
                    )}>
                        <div className="p-4 border-b border-border">
                            <h1 className="text-xl font-bold text-accent">
                                Mermates Chatbot
                            </h1>
                        </div>
                        <ChatList
                            chats={chats || []}
                            selectedChatId={selectedChatId}
                            onSelectChat={setSelectedChatId}
                        />
                    </div>

                    {/* Main Chat Area (Window) */}
                    <div className={cn(
                        "flex-1 flex-col bg-background",
                        // Mobile: Full width, hidden if NO chat selected
                        selectedChatId ? "flex w-full" : "hidden md:flex"
                    )}>
                        {selectedChatId ? (
                            <ChatWindow
                                chatId={selectedChatId}
                                onBack={() => setSelectedChatId(null)}
                            />
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                Select a conversation to start chatting
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <CampaignBuilder />
            )}
        </div>
    )
}
