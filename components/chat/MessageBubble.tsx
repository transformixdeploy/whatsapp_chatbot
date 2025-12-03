import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface MessageBubbleProps {
    message: {
        content: string
        sender: string
        createdAt: string
    }
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.sender === 'user'

    return (
        <div className={cn("flex w-full", isUser ? "justify-start" : "justify-end")}>
            <div
                className={cn(
                    "max-w-[70%] rounded-lg p-3 text-sm",
                    isUser
                        ? "bg-secondary text-secondary-foreground rounded-tl-none"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                )}
            >
                <p>{message.content}</p>
                <span className="text-[10px] opacity-70 mt-1 block text-right">
                    {format(new Date(message.createdAt), 'HH:mm')}
                </span>
            </div>
        </div>
    )
}
