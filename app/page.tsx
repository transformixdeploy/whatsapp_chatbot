'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { ChatList } from '@/components/chat/ChatList'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { NavSidebar } from '@/components/NavSidebar'
import { CampaignBuilder } from '@/components/campaign/CampaignBuilder'

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
                    {/* Chat Sidebar */}
                    <div className="w-80 border-r border-border flex flex-col">
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

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {selectedChatId ? (
                            <ChatWindow chatId={selectedChatId} />
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
