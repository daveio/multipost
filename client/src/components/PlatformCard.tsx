import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { SocialIcon } from "./SocialIcons";
import { Platform } from "../types";
import { useCatppuccinTheme } from "./theme/catppuccin-theme-provider";

interface PlatformCardProps {
  platform: Platform;
  charCount: number;
  active: boolean;
  onToggle: (platformId: string) => void;
}

export function PlatformCard({ platform, charCount, active, onToggle }: PlatformCardProps) {
  const { theme, mode } = useCatppuccinTheme();
  
  const getCharCountClass = () => {
    if (charCount > platform.characterLimit) return "char-counter-danger";
    if (charCount > platform.characterLimit * 0.8) return "char-counter-warning";
    return "text-muted-foreground";
  };

  // Map platform IDs to background colors based on theme
  const getBgColor = (platformId: string) => {
    // Define colors for each platform and theme
    const bgColors = {
      bluesky: {
        latte: 'bg-blue-100',
        frappe: 'bg-primary/10',
        macchiato: 'bg-primary/10', 
        mocha: 'bg-primary/10'
      },
      mastodon: {
        latte: 'bg-purple-100',
        frappe: 'bg-secondary/10',
        macchiato: 'bg-secondary/10',
        mocha: 'bg-secondary/10'
      },
      threads: {
        latte: 'bg-gray-100',
        frappe: 'bg-accent/10',
        macchiato: 'bg-accent/10',
        mocha: 'bg-accent/10'
      }
    };
    
    const platformKey = platformId as keyof typeof bgColors;
    const platformColors = bgColors[platformKey] || bgColors.bluesky;
    const themeKey = theme as keyof typeof platformColors;
    
    return platformColors[themeKey];
  };

  // No longer needed - SocialIcon component now handles theming
  const getIconColor = (platformId: string) => "";

  return (
    <div 
      className={cn(
        "platform-card p-3 border border-border rounded-lg cursor-pointer",
        active && "active"
      )}
      onClick={() => onToggle(platform.id)}
      data-platform={platform.id}
      data-testid={`platform-${platform.id}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className={cn("rounded-full p-2", getBgColor(platform.id))}>
          <SocialIcon platform={platform.icon} />
        </div>
        <Switch 
          checked={active} 
          onCheckedChange={() => onToggle(platform.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <h4 className="font-medium text-foreground">{platform.name}</h4>
      <p className="text-sm text-muted-foreground">
        {platform.accounts.length > 0 
          ? platform.accounts[0].username 
          : `@${platform.id}_user`}
      </p>
      <div className="mt-2 text-xs text-muted-foreground">
        <span className={getCharCountClass()}>
          {charCount}/{platform.characterLimit}
        </span> chars
      </div>
    </div>
  );
}
