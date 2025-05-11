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
import { AlertTriangle, CheckCircle2, HelpCircle, Info } from "lucide-react";
import { 
  SplittingStrategy, 
  SplitPostResult,
  splitPost,
  getStrategyName,
  getStrategyDescription,
  getStrategyTooltip
} from "@/lib/aiService";
import { Account, CharacterStat } from "../types";
import { getPlatformName } from '@/lib/platform-config';
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
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
    setErrorDetails(null);
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
      
      // Extract detailed error message from the API response or error object
      let errorMessage = 'Failed to generate split options';
      let technicalDetails = '';
      
      if (error.cause) {
        // Enhanced error with cause data (from our improved error handling)
        console.log('Enhanced error with cause:', error.cause);
        
        const cause = error.cause;
        
        // Get more specific error message
        if (cause.message) {
          errorMessage = cause.message;
        }
        
        // Get details about specific OpenAI errors
        if (cause.code) {
          switch (cause.code) {
            case 'invalid_api_key':
              errorMessage = 'OpenAI API key is invalid or missing';
              break;
            case 'rate_limit_exceeded':
              errorMessage = 'OpenAI rate limit exceeded. Please try again in a few moments.';
              break;
            case 'insufficient_quota':
              errorMessage = 'OpenAI API quota exceeded. Please check your usage.';
              break;
          }
        }
        
        // Format all technical details
        technicalDetails = JSON.stringify(cause, null, 2);
      } else if (error.response) {
        // API error with response
        errorMessage = error.response.data?.error || error.message || errorMessage;
        technicalDetails = JSON.stringify(error.response.data || {}, null, 2);
      } else if (error.message) {
        // Regular error with message
        errorMessage = error.message;
        technicalDetails = error.stack || JSON.stringify(error, null, 2);
      }
      
      // Display a detailed error message with helpful debugging info
      setError(`Error: ${errorMessage}`);
      setErrorDetails(technicalDetails);
      console.error('Split generation error details:', technicalDetails);
      
      toast({
        title: 'Error Generating Splits',
        description: (
          <div>
            <p>{errorMessage}</p>
            <p className="text-xs text-gray-500 mt-1">Try again or select different splitting strategies.</p>
          </div>
        ),
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
  
  // Render loading state with enhanced animation and visual feedback
  const renderLoading = () => {
    return (
      <div className="space-y-6">
        {/* Progress information */}
        <div className="space-y-3 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
              <h3 className="text-sm font-medium text-blue-700">{progressStage}</h3>
            </div>
            <span className="text-sm font-medium bg-blue-600 text-white px-2 py-1 rounded-full">
              {progressPercent}%
            </span>
          </div>
          
          {/* Enhanced progress bar */}
          <div className="h-3 w-full bg-blue-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          
          {/* Loading message with status icons */}
          <div className="flex items-center gap-2 text-sm mt-2">
            {progressPercent < 30 && (
              <div className="flex items-center text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Analyzing content structure...
              </div>
            )}
            {progressPercent >= 30 && progressPercent < 60 && (
              <div className="flex items-center text-indigo-700 bg-indigo-100 px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Optimizing splits using AI...
              </div>
            )}
            {progressPercent >= 60 && progressPercent < 90 && (
              <div className="flex items-center text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
                Generating formatted thread...
              </div>
            )}
            {progressPercent >= 90 && (
              <div className="flex items-center text-green-700 bg-green-100 px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                Finalizing thread notation...
              </div>
            )}
          </div>
        </div>
        
        {/* Animated post preview skeletons */}
        <div className="space-y-6 relative">
          {/* Thread connection visualization */}
          <div className="absolute left-5 top-14 bottom-0 w-0.5 bg-blue-200 z-0" />
          
          {/* First post skeleton */}
          <Card className="border border-blue-100 shadow-sm relative z-10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24 bg-blue-100" />
                    <Skeleton className="h-4 w-16 bg-blue-50" />
                  </div>
                  <Skeleton className="h-4 w-full bg-blue-50" />
                  <Skeleton className="h-4 w-full bg-blue-50" />
                  <div className="flex justify-between mt-3">
                    <Skeleton className="h-5 w-20 bg-blue-100 rounded-full" />
                    <Skeleton className="h-4 w-16 bg-blue-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Connection dot */}
          <div className="absolute left-[18px] top-44 h-3 w-3 rounded-full bg-blue-400 z-20" />
          
          {/* Second post skeleton with refined animation */}
          <Card className="border border-blue-100 shadow-sm relative z-10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-200 to-blue-300 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-24 bg-blue-100" />
                    <Skeleton className="h-4 w-16 bg-blue-50" />
                  </div>
                  <Skeleton className="h-4 w-full bg-blue-50" />
                  <Skeleton className="h-4 w-3/4 bg-blue-50" />
                  <div className="flex justify-between mt-3">
                    <Skeleton className="h-5 w-20 bg-blue-100 rounded-full" />
                    <Skeleton className="h-4 w-16 bg-blue-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
          splitText: strategyResults as string[],
          strategy,
          reasoning: `Split optimized for ${getPlatformName(platformId)}`
        } as SplitPostResult;
      } else if (strategyResults.splitText && Array.isArray(strategyResults.splitText)) {
        // Object with splitText array
        // Make sure to handle the case when reasoning might not be a string
        const reasoning = typeof strategyResults.reasoning === 'string' 
          ? strategyResults.reasoning 
          : `Split optimized for ${getPlatformName(platformId)}`;
          
        result = {
          splitText: strategyResults.splitText as string[],
          strategy,
          reasoning
        } as SplitPostResult;
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
        {/* Thread visualization with connecting lines */}
        <div className="relative">
          {splitTextArray.map((post, index) => (
            <div key={index} className="relative">
              {/* Vertical thread line and connecting dots */}
              {index < splitTextArray.length - 1 && (
                <>
                  {/* Main connecting line */}
                  <div className="absolute left-5 top-16 bottom-0 w-0.5 bg-gray-300 z-0" />
                  
                  {/* Thread connection dot at the bottom */}
                  <div className="absolute left-[18px] bottom-0 h-2.5 w-2.5 rounded-full bg-gray-400 z-20 transform translate-y-1/2" />
                </>
              )}
              
              {/* Thread connection dot at the top of subsequent posts */}
              {index > 0 && (
                <div className="absolute left-[18px] top-0 h-2.5 w-2.5 rounded-full bg-gray-400 z-20 transform -translate-y-1/2" />
              )}
              
              <Card key={`post-${index}`} className="border relative z-10 mb-4">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-background">
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
                      <p className="mt-2 text-sm whitespace-pre-wrap">{typeof post === 'string' ? post : JSON.stringify(post)}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        {/* Thread numbering */}
                        <Badge variant="outline" className="font-mono">
                          🧵 {index + 1} of {splitTextArray.length}
                        </Badge>
                        
                        {/* Character count */}
                        <div className="text-xs text-gray-500">
                          {typeof post === 'string' ? post.length : '?'} / {characterStats.find(s => s.platform === platformId)?.limit || 500} chars
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
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
              <TooltipProvider key={strategy}>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Button
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
                      <span className="flex items-center gap-1">
                        {getStrategyName(strategy as SplittingStrategy)}
                        <Info className="h-4 w-4 text-gray-500" />
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-sm p-4">
                    <p className="font-medium">{getStrategyName(strategy as SplittingStrategy)}</p>
                    <p className="text-sm mt-1">{getStrategyTooltip(strategy as SplittingStrategy)}</p>
                    <p className="text-xs text-gray-500 mt-2">{getStrategyDescription(strategy as SplittingStrategy)}</p>
                    <div className="text-xs bg-blue-50 p-2 rounded mt-2 text-blue-700">
                      <p className="font-medium">Thread Optimization</p>
                      <p>All splits include thread optimization with thread numbering using "🧵 x of y" notation.</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
          
          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <div className="font-medium">{error}</div>
                
                {errorDetails && (
                  <div className="mt-2">
                    <details className="text-xs bg-red-50 p-3 rounded-md border border-red-200">
                      <summary className="font-medium cursor-pointer">View Technical Details</summary>
                      <div className="mt-2 space-y-2">
                        {/* Tips based on error type */}
                        {errorDetails.includes('rate_limit_exceeded') && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                            <p className="font-medium">Rate Limit Exceeded</p>
                            <p>OpenAI's rate limit was reached. Please wait a few moments and try again.</p>
                          </div>
                        )}
                        
                        {errorDetails.includes('invalid_api_key') && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                            <p className="font-medium">API Authentication Error</p>
                            <p>There might be an issue with the OpenAI API key. Please check that it's correctly configured.</p>
                          </div>
                        )}
                        
                        {/* Raw error details */}
                        <div className="p-2 bg-gray-900 text-gray-100 rounded overflow-x-auto">
                          <pre className="text-xs whitespace-pre-wrap">
                            {errorDetails}
                          </pre>
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
          
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
              toast({
                title: "Applying split",
                description: `Applying ${getStrategyName(activeStrategy)} split for ${getPlatformName(activePlatform)}`,
              });
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
          className="px-6 bg-green-600 hover:bg-green-700"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Apply {getStrategyName(activeStrategy)} Split
          </span>
        </Button>
      </div>
    </div>
  );
}