import { useState } from "react";
import { Account } from "../types";
import { SocialIcon, UIIcon } from "./SocialIcons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface AccountSelectorProps {
  accounts: Account[];
  selectedAccounts: { [platformId: string]: number[] };
  onToggleAccount: (platformId: string, accountId: number) => void;
}

export function AccountSelector({ 
  accounts, 
  selectedAccounts, 
  onToggleAccount 
}: AccountSelectorProps) {
  const { toast } = useToast();
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>("bluesky");
  
  const groupedAccounts = accounts.reduce((acc: { [key: string]: Account[] }, account) => {
    if (!acc[account.platformId]) {
      acc[account.platformId] = [];
    }
    acc[account.platformId].push(account);
    return acc;
  }, {});
  
  const getPlatformDisplayName = (platformId: string): string => {
    return `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} Accounts`;
  };
  
  const handleAddAccount = (platformId: string) => {
    toast({
      title: "Feature not available",
      description: `Adding a new ${platformId} account is not available in the demo.`,
    });
  };
  
  const handleAddInstance = (platformId: string) => {
    toast({
      title: "Feature not available",
      description: `Adding a new ${platformId} instance is not available in the demo.`,
    });
  };
  
  const isAccountSelected = (platformId: string, accountId: number): boolean => {
    return selectedAccounts[platformId]?.includes(accountId) || false;
  };
  
  return (
    <div className="bg-card rounded-xl shadow-sm p-6 mb-6 border border-border">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Account Selection</h2>
      
      <div className="space-y-4">
        {Object.keys(groupedAccounts).map((platformId) => (
          <Accordion 
            key={platformId} 
            type="single" 
            value={expandedPlatform === platformId ? platformId : ""}
            onValueChange={(value) => setExpandedPlatform(value)}
            className="border rounded-lg"
          >
            <AccordionItem value={platformId} className="border-0">
              <AccordionTrigger className="font-medium px-4 py-3">
                <div className="flex items-center gap-2">
                  <SocialIcon 
                    platform={platformId} 
                    className={
                      platformId === 'bluesky' ? 'text-sky-500' :
                      platformId === 'mastodon' ? 'text-purple-500' :
                      platformId === 'threads' ? 'text-gray-700' :
                      'text-yellow-500'
                    } 
                  />
                  <span>{getPlatformDisplayName(platformId)}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {groupedAccounts[platformId].map((account) => (
                    <div key={account.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Checkbox 
                        id={`account-${account.id}`}
                        checked={isAccountSelected(platformId, account.id)}
                        onCheckedChange={() => onToggleAccount(platformId, account.id)}
                      />
                      <Avatar className="h-6 w-6">
                        {account.avatarUrl ? (
                          <AvatarImage src={account.avatarUrl} alt={account.username} />
                        ) : (
                          <AvatarFallback>{account.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {platformId === 'mastodon' && account.instanceUrl
                          ? `@${account.username}@${account.instanceUrl}`
                          : `@${account.username}`
                        }
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {platformId === 'mastodon' && account.instanceUrl
                          ? account.instanceUrl
                          : 'Main Account'
                        }
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleAddAccount(platformId)}
                    className="h-8 text-xs"
                  >
                    <UIIcon.Add className="h-3 w-3 mr-1" /> Add Account
                  </Button>
                  {platformId === 'mastodon' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAddInstance(platformId)}
                      className="h-8 text-xs"
                    >
                      <UIIcon.Server className="h-3 w-3 mr-1" /> Add Instance
                    </Button>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
