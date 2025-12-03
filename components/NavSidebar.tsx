import { MessageSquare, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavSidebarProps {
    activeTab: 'chats' | 'campaigns'
    onTabChange: (tab: 'chats' | 'campaigns') => void
}

export function NavSidebar({ activeTab, onTabChange }: NavSidebarProps) {
    return (
        <div className="w-16 border-r border-border flex flex-col items-center py-4 gap-4 bg-card">
            <button
                onClick={() => onTabChange('chats')}
                className={cn(
                    "p-3 rounded-xl transition-colors",
                    activeTab === 'chats'
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50"
                )}
                title="Chats"
            >
                <MessageSquare className="w-6 h-6" />
            </button>
            <button
                onClick={() => onTabChange('campaigns')}
                className={cn(
                    "p-3 rounded-xl transition-colors",
                    activeTab === 'campaigns'
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50"
                )}
                title="Campaigns"
            >
                <Megaphone className="w-6 h-6" />
            </button>
        </div>
    )
}
