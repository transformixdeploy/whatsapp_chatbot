import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface ChatListProps {
    chats: any[]
    selectedChatId: string | null
    onSelectChat: (id: string) => void
}

export function ChatList({ chats, selectedChatId, onSelectChat }: ChatListProps) {
    return (
        <ScrollArea className="flex-1">
            <div className="flex flex-col gap-2 p-2">
                {chats.map((chat) => (
                    <button
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={cn(
                            "flex items-start gap-3 p-3 rounded-lg text-left transition-colors hover:bg-accent/50",
                            selectedChatId === chat.id && "bg-accent"
                        )}
                    >
                        <Avatar>
                            <AvatarFallback>{chat.contactName?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="font-medium truncate">{chat.contactName || chat.contactPhone}</span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                                {chat.messages?.[0]?.content || 'No messages'}
                            </p>
                        </div>
                        {chat.unreadCount > 0 && (
                            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        )}
                    </button>
                ))}
            </div>
        </ScrollArea>
    )
}
