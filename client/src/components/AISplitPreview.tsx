import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { SocialIcon, UIIcon } from "./SocialIcons";
import { 
  SplittingStrategy, 
  SplitPostResult,
  splitPost,
  getStrategyName,
  getStrategyDescription
} from "@/lib/aiService";
import { Account, CharacterStat } from "../types";
import { getPlatformName } from '@/lib/platform-config';

interface AISplitPreviewProps {
  content: string;
  isOpen: boolean;
  accounts: Account[];
  characterStats: CharacterStat[];
  onClose: () => void;
  onApplySplit: (strategy: SplittingStrategy, platformId: string, splitText: string[]) => void;
}

export function AISplitPreview({ 
  content, 
  isOpen, 
  accounts, 
  characterStats, 
  onClose, 
  onApplySplit 
}: AISplitPreviewProps) {
  const { toast } = useToast();
  
  const [activeStrategy, setActiveStrategy] = useState<SplittingStrategy>(SplittingStrategy.SEMANTIC);
  const [activePlatform, setActivePlatform] = useState<string>('bluesky');
  const [isLoading, setIsLoading] = useState(false);
  const [splitResults, setSplitResults] = useState<Record<SplittingStrategy, Record<string, SplitPostResult>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Check if any platform needs splitting
  const needsSplitting = characterStats.some(stat => stat.current > stat.limit);
  
  // Get all platforms that need splitting
  const platformsNeedingSplit = characterStats
    .filter(stat => stat.current > stat.limit)
    .map(stat => stat.platform);
  
  // Find the first platform that needs splitting to set as active
  useEffect(() => {
    if (platformsNeedingSplit.length > 0 && !activePlatform) {
      setActivePlatform(platformsNeedingSplit[0]);
    }
  }, [platformsNeedingSplit, activePlatform]);
  
  // Generate AI splitting options when opened
  useEffect(() => {
    async function generateSplitOptions() {
      if (isOpen && content && needsSplitting) {
        setIsLoading(true);
        setError(null);
        
        try {
          console.log("Calling splitPost with content:", content.substring(0, 50) + "...");
          const results = await splitPost(content);
          console.log("Split results received:", results);
          
          // Check if results has the expected structure
          if (results && Object.keys(results).length > 0) {
            setSplitResults(results);
          } else {
            setError("Received empty or invalid results from the server");
            toast({
              title: 'Error',
              description: 'Failed to generate split options. Invalid response format.',
              variant: 'destructive',
            });
          }
        } catch (error: any) {
          console.error('Failed to generate split options:', error);
          setError(error.message || 'Failed to generate split options');
          toast({
            title: 'Error',
            description: 'Failed to generate split options. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    generateSplitOptions();
  }, [isOpen, content, needsSplitting, toast]);
  
  // If no split is needed, show a message
  if (!needsSplitting) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UIIcon.Check className="mr-2 h-5 w-5 text-green-500" />
              No Splitting Required
            </CardTitle>
            <CardDescription>
              Your content is within character limits for all platforms.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Button 
              onClick={(e) => {
                e.preventDefault(); // Prevent form submission
                e.stopPropagation(); // Stop event propagation
                onClose();
              }}
              type="button" // Explicitly set type to button
            >
              Close
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get the active platform's account
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
  
  // Render split post preview
  const renderSplitPosts = (platformId: string, strategy: SplittingStrategy) => {
    if (!splitResults) return null;
    
    const result = splitResults[strategy]?.[platformId];
    if (!result) return null;
    
    return (
      <div className="space-y-4">
        {result.splitText.map((post, index) => (
          <Card key={index} className="border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  {getAvatarUrl(platformId) ? (
                    <AvatarImage src={getAvatarUrl(platformId)} alt={getDisplayName(platformId)} />
                  ) : (
                    <AvatarFallback>{getAccountInitials(platformId)}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{getDisplayName(platformId)}</span>
                    <span className="text-gray-500 text-sm">{getUsername(platformId)}</span>
                  </div>
                  <p className="mt-2 text-sm">{post}</p>
                  
                  {/* Thread numbering */}
                  <div className="mt-2">
                    <Badge variant="outline">
                      Post {index + 1} of {result.splitText.length}
                    </Badge>
                  </div>
                  
                  {/* Character count */}
                  <div className="mt-2 text-xs text-gray-500">
                    {post.length} / {characterStats.find(s => s.platform === platformId)?.limit || 500} characters
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Reasoning */}
        <Alert className="bg-gray-50">
          <AlertDescription>
            <strong>AI Reasoning:</strong> {result.reasoning}
          </AlertDescription>
        </Alert>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <Card key={i} className="border">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">AI Post Splitting Preview</h2>
        <Button 
          variant="ghost" 
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event propagation
            onClose();
          }}
          type="button" // Explicitly set type to button
        >
          <UIIcon.Close className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Select Platform Tabs */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Platform Requiring Split:</h3>
        <Tabs value={activePlatform} onValueChange={(value) => setActivePlatform(value)}>
          <TabsList className="w-full">
            {platformsNeedingSplit.map(platformId => (
              <TabsTrigger
                key={platformId}
                value={platformId}
                className="flex-1"
              >
                <SocialIcon platform={platformId} className="mr-1" size={14} />
                <span className="ml-1">{getPlatformName(platformId)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Select Strategy Tabs */}
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2">Choose a Splitting Strategy:</h3>
        <Tabs value={activeStrategy} onValueChange={(v) => setActiveStrategy(v as SplittingStrategy)}>
          <TabsList className="w-full">
            {Object.values(SplittingStrategy).map(strategy => (
              <TabsTrigger key={strategy} value={strategy} className="flex-1 text-xs">
                {getStrategyName(strategy as SplittingStrategy)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Strategy Description */}
          <div className="text-xs text-gray-500 mt-2">
            {getStrategyDescription(activeStrategy)}
          </div>
        </Tabs>
      </div>
      
      {/* Split Preview */}
      <Card className="mb-4">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-md">Split Preview</CardTitle>
          <CardDescription>
            Here's how your post will be split for {getPlatformName(activePlatform)}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-0 pb-4">
          <ScrollArea className="max-h-96 pr-3">
            {isLoading ? (
              renderLoading()
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : splitResults ? (
              renderSplitPosts(activePlatform, activeStrategy)
            ) : (
              <div className="text-center py-4 text-gray-500">
                No splitting options available.
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Original Post */}
      <Card className="mb-4">
        <CardHeader className="px-4 py-3">
          <CardTitle className="text-md">Original Post</CardTitle>
          <CardDescription>
            {content.length} characters ({characterStats.find(s => s.platform === activePlatform)?.limit || 0} character limit)
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 py-0 pb-4">
          <ScrollArea className="max-h-40">
            <p className="text-sm">{content}</p>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event propagation
            onClose();
          }}
          type="button" // Explicitly set type to button
        >
          Cancel
        </Button>
        <Button 
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event propagation
            if (splitResults?.[activeStrategy]?.[activePlatform]) {
              onApplySplit(
                activeStrategy, 
                activePlatform, 
                splitResults[activeStrategy][activePlatform].splitText
              );
            }
          }}
          type="button" // Explicitly set type to button
          disabled={isLoading || !splitResults}
        >
          Apply This Split
        </Button>
      </div>
    </div>
  );
}