import { cn } from '@/lib/utils'
import {
  AlertCircle,
  AlertTriangle,
  AlignJustify,
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  ChevronDown,
  Cloud,
  Heart,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Scissors,
  Send,
  Server,
  Settings,
  Share2,
  SplitSquareVertical,
  Trash,
  Undo,
  Upload,
  UserCheck,
  X,
  XCircle,
  Zap
} from 'lucide-react'
import { useCatppuccinTheme } from './theme/catppuccin-theme-provider'

type SocialIconProps = {
  platform: string
  className?: string
  size?: number
  useThemeColors?: boolean
}

export const SocialIcon = ({ platform, className = '', size = 16, useThemeColors = true }: SocialIconProps) => {
  const { theme, mode } = useCatppuccinTheme()

  // Define platform colors for each theme
  const getIconClass = (platform: string) => {
    if (!useThemeColors) return className

    const themeColors = {
      // Platform specific colors based on theme
      bluesky: {
        latte: 'text-blue-500',
        frappe: 'text-primary',
        macchiato: 'text-primary',
        mocha: 'text-primary'
      },
      mastodon: {
        latte: 'text-purple-500',
        frappe: 'text-secondary',
        macchiato: 'text-secondary',
        mocha: 'text-secondary'
      },
      threads: {
        latte: 'text-gray-700',
        frappe: 'text-accent',
        macchiato: 'text-accent',
        mocha: 'text-accent'
      },
      multipost: {
        latte: 'text-blue-600',
        frappe: 'text-primary',
        macchiato: 'text-primary',
        mocha: 'text-primary'
      }
    }

    const platformKey = platform.toLowerCase() as keyof typeof themeColors
    const platformColors = themeColors[platformKey] || themeColors.multipost
    const themeKey = theme as keyof typeof platformColors

    return cn(className, platformColors[themeKey] || 'text-foreground')
  }

  switch (platform.toLowerCase()) {
    case 'bluesky':
      return <Cloud className={getIconClass('bluesky')} size={size} />
    case 'threads':
      return <AtSign className={getIconClass('threads')} size={size} />
    case 'mastodon':
      // Using a custom icon for Mastodon
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={getIconClass('mastodon')}
        >
          <path d="M21.5 9.14v3.9c0 4.3-3.7 4.42-5.3 4.47h-2.42l-3.12-.65v2.23l-3.7-3.7 3.7-3.7v2.76c2.9 0 3.97-.34 4.9-1.2c.6-.59.55-1.6.55-1.6v-2.8c0-2.36 1.76-3 4.42-3Z" />
          <path d="M9.73 14.3 8.5 15.59l-1.17 1.3c-1.1 1.23-2.83 1.23-3.93 0L2.23 15.6c-.97-1.08-.8-2.13-.8-4.08V9.14C1.43 6.78 3.2 6.14 5.85 6.14h3.76v4.6c0 2.2.77 3.42 2.18 3.15l.37-.1-2.43.5Z" />
        </svg>
      )
    case 'multipost':
      return <Zap className={getIconClass('multipost')} size={size} />
    default:
      return <Share2 className={getIconClass('multipost')} size={size} />
  }
}

// Export other icons used in the application
export const UIIcon = {
  Settings: Settings,
  Upload: Upload,
  Save: Save,
  Undo: Undo,
  Send: Send,
  Reply: MessageSquare,
  Like: Heart,
  Check: Check,
  Close: X,
  ExpandMore: ChevronDown,
  Add: Plus,
  Delete: Trash,
  Account: UserCheck,
  Server: Server,
  Refresh: RefreshCw,
  Warning: AlertCircle,
  Alert: AlertTriangle,
  Split: SplitSquareVertical,
  Cut: Scissors,
  ArrowLeft: ArrowLeft,
  ArrowRight: ArrowRight,
  Thread: AlignJustify,
  Expand: Maximize2,
  Collapse: Minimize2,
  Exit: XCircle,
  Edit: Pencil,
  Plus: Plus
}
