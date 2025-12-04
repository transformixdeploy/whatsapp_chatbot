import { MessageSquare, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavSidebarProps {
    activeTab: 'chats' | 'campaigns'
    onTabChange: (tab: 'chats' | 'campaigns') => void
}

export function NavSidebar({ activeTab, onTabChange }: NavSidebarProps) {
    return (
        <div className="
            flex bg-card border-border
            /* Mobile: Bottom Bar */
            fixed bottom-0 w-full h-16 flex-row items-center justify-around border-t z-50
            /* Desktop: Sidebar */
            md:relative md:w-16 md:h-full md:flex-col md:justify-start md:py-4 md:gap-4 md:border-r md:border-t-0
        ">
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
