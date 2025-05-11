import { 
  Cloud, 
  AtSign, 
  Zap, 
  UserCheck, 
  Server, 
  RefreshCw,
  Share2,
  Settings,
  Upload,
  Save,
  Undo,
  Send,
  MessageSquare,
  Heart,
  Check,
  X,
  ChevronDown,
  Plus,
  Trash
} from "lucide-react";

type SocialIconProps = {
  platform: string;
  className?: string;
  size?: number;
};

export const SocialIcon = ({ platform, className = "", size = 16 }: SocialIconProps) => {
  switch (platform.toLowerCase()) {
    case 'bluesky':
      return <Cloud className={className} size={size} />;
    case 'threads':
      return <AtSign className={className} size={size} />;
    case 'nostr':
      return <Zap className={className} size={size} />;
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
          className={className}
        >
          <path d="M21.5 9.14v3.9c0 4.3-3.7 4.42-5.3 4.47h-2.42l-3.12-.65v2.23l-3.7-3.7 3.7-3.7v2.76c2.9 0 3.97-.34 4.9-1.2c.6-.59.55-1.6.55-1.6v-2.8c0-2.36 1.76-3 4.42-3Z" />
          <path d="M9.73 14.3 8.5 15.59l-1.17 1.3c-1.1 1.23-2.83 1.23-3.93 0L2.23 15.6c-.97-1.08-.8-2.13-.8-4.08V9.14C1.43 6.78 3.2 6.14 5.85 6.14h3.76v4.6c0 2.2.77 3.42 2.18 3.15l.37-.1-2.43.5Z" />
        </svg>
      );
    default:
      return <Share2 className={className} size={size} />;
  }
};

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
  Refresh: RefreshCw
};
