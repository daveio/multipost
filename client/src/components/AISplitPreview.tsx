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
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { 
  SplittingStrategy, 
  SplitPostResult,
  splitPost,
  getStrategyName,
  getStrategyDescription
} from "@/lib/aiService";
import { Account, CharacterStat } from "../types";
import { getPlatformName } from '@/lib/platform-config';
import { Progress } from "@/components/ui/progress";

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
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activePlatform, setActivePlatform] = useState<string>('');
  const [activeStrategy, setActiveStrategy] = useState<SplittingStrategy>(SplittingStrategy.SEMANTIC);
  const [selectedStrategies, setSelectedStrategies] = useState<SplittingStrategy[]>([SplittingStrategy.SEMANTIC]);
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
  
  // Toggle a strategy selection
  const toggleStrategy = (strategy: SplittingStrategy) => {
    setSelectedStrategies(prev => {
      if (prev.includes(strategy)) {
        // If it's the only selected strategy, don't remove it
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== strategy);
      } else {
        return [...prev, strategy];
      }
    });
  };
  
  // Select all strategies
  const selectAllStrategies = () => {
    setSelectedStrategies(Object.values(SplittingStrategy));
  };
  
  // Reset to default (semantic only)
  const resetToDefault = () => {
    setSelectedStrategies([SplittingStrategy.SEMANTIC]);
  };
  
  // Generate AI splitting options
  const generateSplitOptions = async () => {
    if (!content || !needsSplitting) return;
    
    setIsLoading(true);
    setError(null);
    setSplitResults(null);
    setProgressStage('Initializing AI split');
    setProgressPercent(5);
    
    const updateProgress = (stage: string, percent: number) => {
      setProgressStage(stage);
      setProgressPercent(percent);
    };
    
    try {
      updateProgress('Analyzing content...', 10);
      await new Promise(r => setTimeout(r, 500)); // UI smoothness
      
      updateProgress('Preparing splitting strategies...', 20);
      await new Promise(r => setTimeout(r, 500)); // UI smoothness
      
      // Validate selected strategies
      if (selectedStrategies.length === 0) {
        throw new Error("No splitting strategies selected");
      }
      
      updateProgress(`Generating splits for ${selectedStrategies.length} strategies...`, 40);
      console.log(`Requesting splits for strategies:`, selectedStrategies);
      
      // Call the API with all selected strategies
      const results = await splitPost(content, selectedStrategies);
      
      updateProgress(`Processing results...`, 80);
      console.log("Split results:", results);
      
      if (!results || Object.keys(results).length === 0) {
        throw new Error("API returned empty results");
      }
      
      updateProgress('Finalizing results...', 95);
      setSplitResults(results);
      updateProgress('Split generation complete!', 100);
      
    } catch (error: any) {
      console.error('Failed to generate split options:', error);
      
      // Extract detailed error message
      let errorMessage = error.message || 'Failed to generate split options';
      
      // Display a detailed error message with helpful debugging info
      setError(`Error: ${errorMessage}. Please try again with a different strategy.`);
      
      toast({
        title: 'Error Generating Splits',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Automatically generate split options on first open
  useEffect(() => {
    if (isOpen && content && needsSplitting && !splitResults && !isLoading) {
      generateSplitOptions();
    }
  }, [isOpen, content, needsSplitting]);
  
  // If no split is needed, show a message
  if (!needsSplitting) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
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
  
  // Render loading state 
  const renderLoading = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2 mb-4">
          <Progress value={progressPercent} className="h-2 w-full" />
          <p className="text-sm text-gray-500">{progressStage}</p>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Helper functions for account data
  const getDisplayName = (platformId: string): string => {
    const account = accounts.find(a => a.platformId === platformId);
    return account?.displayName || 'User';
  };
  
  const getUsername = (platformId: string): string => {
    const account = accounts.find(a => a.platformId === platformId);
    return account?.username ? `@${account.username}` : '';
  };
  
  const getAvatarUrl = (platformId: string): string => {
    const account = accounts.find(a => a.platformId === platformId);
    return account?.avatarUrl || '';
  };
  
  const getAccountInitials = (platformId: string): string => {
    const displayName = getDisplayName(platformId);
    if (displayName && displayName !== 'User') {
      const parts = displayName.split(' ');
      if (parts.length > 1) {
        return parts[0][0] + parts[1][0];
      }
      return displayName.substring(0, 2);
    }
    return platformId.substring(0, 2).toUpperCase();
  };
  
  // Render split post preview
  const renderSplitPosts = (platformId: string, strategy: SplittingStrategy) => {
    if (!splitResults) {
      console.log("No split results available");
      return (
        <div className="p-4 text-center text-gray-500">
          No split results available. Try entering a longer post.
        </div>
      );
    }
    
    console.log("Available strategies:", Object.keys(splitResults));
    console.log("Looking for strategy:", strategy, "platform:", platformId);
    
    if (!splitResults[strategy]) {
      console.log("Strategy not found in results");
      return (
        <div className="p-4 text-center text-gray-500">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
          <h3 className="text-base font-medium text-gray-800 mb-2">Strategy Not Available</h3>
          <p>The requested splitting strategy could not be generated.</p>
          <p className="mt-2">Please try another strategy or try again later.</p>
        </div>
      );
    }
    
    // Handle different response formats
    let result: SplitPostResult | null = null;
    
    // Check if the strategy exists in results
    const strategyResults = splitResults[strategy];
    console.log("Strategy results:", strategyResults);
    
    // Check different formats
    if (strategyResults[platformId]) {
      // Standard format with platform keys
      result = strategyResults[platformId];
    } else if (Array.isArray(strategyResults) || (strategyResults.splitText && Array.isArray(strategyResults.splitText))) {
      // Direct array or object with splitText array - format into proper result
      console.log("Converting direct result format");
      
      // Handle different types of responses
      if (Array.isArray(strategyResults)) {
        // Direct array of strings
        result = {
          splitText: strategyResults as unknown as string[],
          strategy,
          reasoning: `Split optimized for ${getPlatformName(platformId)}`
        };
      } else if (strategyResults.splitText && Array.isArray(strategyResults.splitText)) {
        // Object with splitText array
        result = {
          splitText: strategyResults.splitText as string[],
          strategy,
          reasoning: strategyResults.reasoning || `Split optimized for ${getPlatformName(platformId)}`
        };
      }
    } else if (strategyResults.bluesky || strategyResults.mastodon || strategyResults.threads || strategyResults.nostr) {
      // Try to use any available platform
      const availablePlatforms = Object.keys(strategyResults);
      if (availablePlatforms.length > 0) {
        const alternatePlatform = availablePlatforms[0];
        result = strategyResults[alternatePlatform];
        
        console.log(`Using ${alternatePlatform} results for ${platformId}`);
        
        return (
          <div>
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <AlertDescription>
                No specific split found for {getPlatformName(platformId)}. 
                Showing split for {getPlatformName(alternatePlatform)} instead.
              </AlertDescription>
            </Alert>
            {result && renderSplitResult(result, platformId)}
          </div>
        );
      }
    }
    
    if (!result) {
      return (
        <div className="p-4 text-center text-gray-500">
          <AlertTriangle className="mx-auto h-8 w-8 text-amber-500 mb-3" />
          <h3 className="text-base font-medium text-gray-800 mb-2">Platform Not Available</h3>
          <p>Split results for {getPlatformName(platformId)} could not be processed.</p>
          <p className="mt-2">Please try a different platform or strategy.</p>
          <details className="mt-4 text-left bg-gray-50 p-2 rounded text-xs">
            <summary>View Technical Details</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(strategyResults, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    
    return renderSplitResult(result, platformId);
  };
  

  
  // Helper function to render a split result
  const renderSplitResult = (result: SplitPostResult, platformId: string) => {
    console.log("Rendering split result:", result);
    
    // Ensure we have valid splitText data to render
    let splitTextArray: string[] = [];
    
    // Validate the expected data structure
    if (!result || !result.splitText) {
      console.error("Invalid split result data:", result);
      return (
        <div className="p-4 text-center text-gray-600">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-base font-medium text-gray-800 mb-2">Invalid Data Structure</h3>
          <p>The API returned an invalid data structure.</p>
          <details className="mt-4 text-left bg-gray-50 p-2 rounded text-xs">
            <summary>View Technical Details</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    
    // Convert string to array if needed
    if (Array.isArray(result.splitText)) {
      splitTextArray = result.splitText;
    } else if (typeof result.splitText === 'string') {
      // Handle single string case
      splitTextArray = [result.splitText];
    } else {
      // Invalid type case
      console.error("Invalid splitText type:", typeof result.splitText);
      return (
        <div className="p-4 text-center text-gray-600">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-3" />
          <h3 className="text-base font-medium text-gray-800 mb-2">Invalid Data Type</h3>
          <p>Expected string or array but received: {typeof result.splitText}</p>
          <details className="mt-4 text-left bg-gray-50 p-2 rounded text-xs">
            <summary>View Technical Details</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {splitTextArray.map((post, index) => (
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
                  <p className="mt-2 text-sm">{typeof post === 'string' ? post : JSON.stringify(post)}</p>
                  
                  {/* Thread numbering */}
                  <div className="mt-2">
                    <Badge variant="outline">
                      Post {index + 1} of {splitTextArray.length}
                    </Badge>
                  </div>
                  
                  {/* Character count */}
                  <div className="mt-2 text-xs text-gray-500">
                    {typeof post === 'string' ? post.length : '?'} / {characterStats.find(s => s.platform === platformId)?.limit || 500} characters
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Reasoning */}
        <Alert className="bg-gray-50">
          <AlertDescription className="text-xs text-gray-600">
            <strong>Reasoning:</strong> {result.reasoning || "Split based on platform character limits"}
          </AlertDescription>
        </Alert>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6 fixed top-10 left-10 right-10 bottom-10 z-50 overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">AI Post Splitting Preview</h2>
        <Button 
          variant="ghost" 
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event propagation
            onClose();
          }}
          type="button" // Explicitly set type to button
        >
          <UIIcon.Close className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Select Platform Tabs */}
      <div className="mb-6">
        <h3 className="text-base font-medium mb-3">Platform Requiring Split:</h3>
        <div className="flex flex-wrap gap-3">
          {platformsNeedingSplit.map(platformId => (
            <Button
              key={platformId}
              variant={activePlatform === platformId ? "default" : "outline"}
              size="default"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActivePlatform(platformId);
              }}
              type="button"
              className="flex items-center gap-2 px-4 py-2"
            >
              <SocialIcon platform={platformId} size={18} />
              <span className="font-medium">{getPlatformName(platformId)}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Select Strategy Tabs */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-medium">Choose Splitting Strategies:</h3>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={selectAllStrategies}
              className="text-xs"
            >
              Select All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetToDefault}
              className="text-xs"
            >
              Reset
            </Button>
          </div>
        </div>
        <div>
          <div className="flex flex-wrap gap-3 mb-3">
            {Object.values(SplittingStrategy).map(strategy => (
              <Button
                key={strategy}
                variant={selectedStrategies.includes(strategy) ? "default" : "outline"}
                size="default"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleStrategy(strategy as SplittingStrategy);
                }}
                type="button"
                className="px-4 py-2"
              >
                {getStrategyName(strategy as SplittingStrategy)}
              </Button>
            ))}
          </div>
          
          {/* Generate Button */}
          <Button 
            variant="secondary"
            className="w-full mb-3" 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              generateSplitOptions();
            }}
            disabled={isLoading || selectedStrategies.length === 0}
            type="button"
          >
            {isLoading ? 'Generating...' : 'Generate Split Options'}
          </Button>
          
          {/* Strategy Description */}
          <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
            {getStrategyDescription(activeStrategy)}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left side: Split Preview */}
        <div className="w-full lg:w-2/3">
          <Card className="mb-6">
            <CardHeader className="p-5 border-b">
              <CardTitle className="text-lg">Split Preview</CardTitle>
              <CardDescription className="text-base">
                How your post will be split for {getPlatformName(activePlatform)}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="h-[400px] overflow-auto pr-3">
                {isLoading ? (
                  renderLoading()
                ) : error ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="text-base">{error}</AlertDescription>
                  </Alert>
                ) : splitResults ? (
                  renderSplitPosts(activePlatform, activeStrategy)
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
                    <p className="text-lg font-medium">No splitting options available.</p>
                    <p className="mt-2">Try entering a longer post.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right side: Original Post */}
        <div className="w-full lg:w-1/3">
          <Card className="mb-6">
            <CardHeader className="p-5 border-b">
              <CardTitle className="text-lg">Original Post</CardTitle>
              <CardDescription className="text-base">
                {content.length} characters ({characterStats.find(s => s.platform === activePlatform)?.limit || 0} character limit)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <div className="max-h-[200px] overflow-auto">
                <p className="text-base whitespace-pre-wrap">{content}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault(); // Prevent form submission
            e.stopPropagation(); // Stop event propagation
            onClose();
          }}
          type="button" // Explicitly set type to button
          size="lg"
          className="px-6"
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
          size="lg"
          className="px-6"
        >
          Apply This Split
        </Button>
      </div>
    </div>
  );
}