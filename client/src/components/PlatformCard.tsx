import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { SocialIcon } from "./SocialIcons";
import { Platform } from "../types";

interface PlatformCardProps {
  platform: Platform;
  charCount: number;
  active: boolean;
  onToggle: (platformId: string) => void;
}

export function PlatformCard({ platform, charCount, active, onToggle }: PlatformCardProps) {
  const getCharCountClass = () => {
    if (charCount > platform.characterLimit) return "char-counter-danger";
    if (charCount > platform.characterLimit * 0.8) return "char-counter-warning";
    return "text-gray-500";
  };

  // Map platform IDs to background colors
  const getBgColor = (platformId: string) => {
    switch (platformId) {
      case 'bluesky': return 'bg-sky-100';
      case 'mastodon': return 'bg-purple-100';
      case 'threads': return 'bg-gray-100';
      default: return 'bg-blue-100';
    }
  };

  // Map platform IDs to icon colors
  const getIconColor = (platformId: string) => {
    switch (platformId) {
      case 'bluesky': return 'text-sky-500';
      case 'mastodon': return 'text-purple-500';
      case 'threads': return 'text-gray-700';
      default: return 'text-blue-500';
    }
  };

  return (
    <div 
      className={cn(
        "platform-card p-3 border rounded-lg cursor-pointer",
        active && "active"
      )}
      onClick={() => onToggle(platform.id)}
      data-platform={platform.id}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={cn("rounded-full p-2", getBgColor(platform.id))}>
          <SocialIcon platform={platform.icon} className={getIconColor(platform.id)} />
        </div>
        <Switch 
          checked={active} 
          onCheckedChange={() => onToggle(platform.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <h4 className="font-medium">{platform.name}</h4>
      <p className="text-sm text-gray-500">
        {platform.accounts.length > 0 
          ? platform.accounts[0].username 
          : `@${platform.id}_user`}
      </p>
      <div className="mt-2 text-xs">
        <span className={getCharCountClass()}>
          {charCount}/{platform.characterLimit}
        </span> chars
      </div>
    </div>
  );
}
