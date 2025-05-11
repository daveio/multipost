import { SocialIcon, UIIcon } from "./SocialIcons";
import { cn } from "@/lib/utils";
import { Account, MediaFile } from "../types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface PlatformPreviewProps {
  content: string;
  mediaFiles: MediaFile[];
  activeTab: string;
  accounts: Account[];
  onTabChange: (tab: string) => void;
}

export function PlatformPreview({ 
  content, 
  mediaFiles, 
  activeTab, 
  accounts,
  onTabChange 
}: PlatformPreviewProps) {
  const getActiveAccount = (platformId: string): Account | undefined => {
    return accounts.find(account => account.platformId === platformId && account.isActive);
  };

  const getDisplayName = (platformId: string): string => {
    const account = getActiveAccount(platformId);
    return account?.displayName || `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} User`;
  };

  const getUsername = (platformId: string): string => {
    const account = getActiveAccount(platformId);
    if (account) {
      if (platformId === 'mastodon' && account.instanceUrl) {
        return `@${account.username}@${account.instanceUrl}`;
      }
      return `@${account.username}`;
    }
    return `@${platformId}_user`;
  };

  const getAvatarUrl = (platformId: string): string => {
    const account = getActiveAccount(platformId);
    return account?.avatarUrl || '';
  };

  const getAccountInitials = (platformId: string): string => {
    const account = getActiveAccount(platformId);
    if (account?.displayName) {
      return account.displayName.substring(0, 2).toUpperCase();
    }
    return platformId.substring(0, 2).toUpperCase();
  };

  // Format the content based on platform
  const getFormattedContent = (platformId: string): string => {
    // In a real app, we could apply platform-specific formatting here
    return content || "What's on your mind? Type your message here to post across multiple platforms...";
  };

  return (
    <>
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto platform-tabs-container">
          {["bluesky", "mastodon", "threads"].map((platform) => (
            <TabsTrigger key={platform} value={platform} className="flex-1 min-w-fit">
              <SocialIcon platform={platform} className="mr-1" size={14} />
              <span className="ml-1 capitalize">{platform}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {["bluesky", "mastodon", "threads"].map((platform) => (
          <TabsContent key={platform} value={platform} className="mt-0">
            <div className="preview-card p-4 border border-border rounded-lg bg-muted">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  {getAvatarUrl(platform) ? (
                    <AvatarImage src={getAvatarUrl(platform)} alt={getDisplayName(platform)} />
                  ) : (
                    <AvatarFallback>{getAccountInitials(platform)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1 w-full">
                    <span className="font-semibold truncate max-w-[40%] text-foreground">{getDisplayName(platform)}</span>
                    <span className="text-muted-foreground text-sm truncate max-w-[55%]">{getUsername(platform)}</span>
                  </div>
                  <p className="mt-2 text-sm preview-content text-foreground">{getFormattedContent(platform)}</p>
                  
                  {/* Media Preview Grid */}
                  {mediaFiles.length > 0 && (
                    <div className={cn(
                      "grid gap-2 mt-3",
                      mediaFiles.length === 1 ? "grid-cols-1" : "grid-cols-2"
                    )}>
                      {mediaFiles.slice(0, 4).map((file) => (
                        <div key={file.id} className="overflow-hidden rounded-lg aspect-square bg-card">
                          <img 
                            src={file.previewUrl || file.url} 
                            alt={file.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-4 mt-4 text-muted-foreground">
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                      <UIIcon.Reply className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">Reply</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                      <UIIcon.Refresh className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">Repost</span>
                    </div>
                    <div className="flex items-center gap-1 hover:text-primary cursor-pointer">
                      <UIIcon.Like className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs">Like</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
