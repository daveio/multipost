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
  advancedOptions?: {
    showRawJson?: boolean;
    [key: string]: any;
  };
}

export function AISplitPreview({ 
  content, 
  isOpen, 
  accounts,
  characterStats,
  onClose,
  onApplySplit,
  advancedOptions = { showRawJson: false }
}: AISplitPreviewProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [progressStage, setProgressStage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activePlatform, setActivePlatform] = useState<string>('');
  const [activeStrategy, setActiveStrategy] = useState<SplittingStrategy>(SplittingStrategy.SEMANTIC);
  // Enable multiple strategies by default
  const [selectedStrategies, setSelectedStrategies] = useState<SplittingStrategy[]>([
    SplittingStrategy.SEMANTIC,
    SplittingStrategy.SENTENCE,
    SplittingStrategy.RETAIN_HASHTAGS,
    SplittingStrategy.PRESERVE_MENTIONS
  ]);
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
  
  // Reset to default (all strategies enabled)
  const resetToDefault = () => {
    setSelectedStrategies([
      SplittingStrategy.SEMANTIC,
      SplittingStrategy.SENTENCE,
      SplittingStrategy.RETAIN_HASHTAGS,
      SplittingStrategy.PRESERVE_MENTIONS
    ]);
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
    if (!splitResults) return null;
    
    const strategyResults = splitResults[strategy];
    if (!strategyResults) return null;
    
    const result = strategyResults[platformId];
    if (!result) return null;
    
    return renderSplitResult(result, platformId);
  };
  
  // Render split result
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
          
          {/* Always show details if developer mode is enabled */}
          {advancedOptions.showRawJson ? (
            <div className="mt-4 text-left bg-gray-900 p-3 rounded text-xs">
              <h4 className="text-gray-300 mb-2 font-mono flex items-center">
                <span className="inline-block mr-2 p-1 bg-red-800 text-red-200 rounded">Error</span>
                Developer Mode Raw Data
              </h4>
              <pre className="text-green-400 font-mono whitespace-pre-wrap overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <details className="mt-4 text-left bg-gray-50 p-2 rounded text-xs">
              <summary>View Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          )}
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
          
          {/* Always show details if developer mode is enabled */}
          {advancedOptions.showRawJson ? (
            <div className="mt-4 text-left bg-gray-900 p-3 rounded text-xs">
              <h4 className="text-gray-300 mb-2 font-mono flex items-center">
                <span className="inline-block mr-2 p-1 bg-red-800 text-red-200 rounded">Error</span>
                Developer Mode Raw Data
              </h4>
              <pre className="text-green-400 font-mono whitespace-pre-wrap overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ) : (
            <details className="mt-4 text-left bg-gray-50 p-2 rounded text-xs">
              <summary>View Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {/* Show raw JSON if enabled in advanced options */}
        {advancedOptions.showRawJson && (
          <div className="mb-4 p-4 bg-gray-900 text-gray-100 rounded-md shadow-inner overflow-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-mono text-gray-300">Raw AI Response JSON</h4>
              <Badge variant="outline" className="text-xs font-mono text-gray-400 border-gray-700">
                Developer Mode
              </Badge>
            </div>
            <pre className="text-xs font-mono text-green-400 overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
        
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
              
              {/* Thread connection dot at the top (for all posts except the first) */}
              {index > 0 && (
                <div className="absolute left-[18px] top-0 h-2.5 w-2.5 rounded-full bg-gray-400 z-20 transform -translate-y-1/2" />
              )}
              
              {/* Post card */}
              <Card className="border-gray-200 shadow-sm mb-6 relative z-10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Account avatar */}
                    <Avatar className="h-10 w-10 border border-gray-200">
                      {getAvatarUrl(platformId) ? (
                        <AvatarImage src={getAvatarUrl(platformId)} alt={getDisplayName(platformId)} />
                      ) : (
                        <AvatarFallback>{getAccountInitials(platformId)}</AvatarFallback>
                      )}
                    </Avatar>
                    
                    {/* Post content */}
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-medium text-sm">{getDisplayName(platformId)}</span>
                          <span className="text-gray-500 text-sm">{getUsername(platformId)}</span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {post}
                        </div>
                        
                        {/* Post meta */}
                        <div className="flex justify-between mt-3">
                          <div className="flex items-center gap-3 text-gray-500">
                            <div className="flex items-center gap-1">
                              <UIIcon.Reply className="h-3.5 w-3.5" />
                              <span className="text-xs">5</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <UIIcon.Like className="h-3.5 w-3.5" />
                              <span className="text-xs">12</span>
                            </div>
                          </div>
                          
                          {/* Post number in thread */}
                          {splitTextArray.length > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {index + 1} of {splitTextArray.length}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        
        {/* Apply Split Button */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              // Reset results
              setSplitResults(null);
              // Generate new options
              generateSplitOptions();
            }}
          >
            <UIIcon.Refresh className="h-3.5 w-3.5" />
            <span>Regenerate</span>
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                onApplySplit(result.strategy, platformId, splitTextArray);
                onClose();
              }}
            >
              <UIIcon.Check className="h-3.5 w-3.5" />
              <span>Apply Split</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Split Content with AI</CardTitle>
          <CardDescription>
            Your post exceeds character limits for one or more platforms. Use AI to optimize the split.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Loading state */}
          {isLoading ? renderLoading() : (
            <div className="space-y-6">
              {/* Strategy Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Splitting Strategies</h3>
                    <p className="text-xs text-gray-500">Select one or more strategies to generate splits</p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resetToDefault}
                      className="h-7 text-xs"
                    >
                      Reset
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={selectAllStrategies}
                      className="h-7 text-xs"
                    >
                      Select All
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.values(SplittingStrategy).map((strategy) => (
                    <TooltipProvider key={strategy}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Badge 
                              variant={selectedStrategies.includes(strategy) ? "default" : "outline"}
                              className={`
                                cursor-pointer transition-all duration-200 select-none
                                ${selectedStrategies.includes(strategy) ? 'bg-primary hover:bg-primary/90' : 'bg-transparent hover:bg-gray-100'}
                              `}
                              onClick={() => toggleStrategy(strategy)}
                            >
                              {selectedStrategies.includes(strategy) && (
                                <UIIcon.Check className="mr-1 h-3 w-3" />
                              )}
                              {getStrategyName(strategy)}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-sm font-medium">{getStrategyName(strategy)}</p>
                          <p className="text-xs mt-1">{getStrategyTooltip(strategy)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
              
              {/* Error Display */}
              {error && (
                <Alert variant="destructive" className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="ml-2">
                    <div className="font-medium">{error}</div>
                    
                    {errorDetails && (
                      <div className="mt-2">
                        {advancedOptions.showRawJson ? (
                          // Developer mode error display (always expanded)
                          <div className="text-xs bg-gray-900 text-gray-200 p-3 rounded-md border border-gray-700">
                            <h4 className="text-gray-300 font-mono flex items-center mb-2">
                              <span className="inline-block mr-2 p-1 bg-red-800 text-red-200 rounded">Error</span>
                              Developer Mode Error Data
                            </h4>
                            
                            {/* Tips based on error type */}
                            {errorDetails.includes('rate_limit_exceeded') && (
                              <div className="p-2 bg-amber-950 border border-amber-800 rounded text-amber-200 mb-3">
                                <p className="font-medium mb-1">Rate Limit Exceeded</p>
                                <p>OpenAI's rate limit was reached. Please wait a few moments and try again.</p>
                              </div>
                            )}
                            
                            {errorDetails.includes('invalid_api_key') && (
                              <div className="p-2 bg-red-950 border border-red-800 rounded text-red-200 mb-3">
                                <p className="font-medium mb-1">API Authentication Error</p>
                                <p>There might be an issue with the OpenAI API key. Please check that it's correctly configured.</p>
                              </div>
                            )}
                            
                            {/* Raw error details with syntax highlighting */}
                            <pre className="overflow-auto p-2 bg-gray-950 font-mono text-green-400 rounded max-h-80">
                              {errorDetails}
                            </pre>
                          </div>
                        ) : (
                          // Normal user error display
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
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Strategy active indicator */}
              {/* UI design for strategy info and platform selection */}
              <div className="space-y-4">
                {splitResults && (
                  <>
                    {/* Platform tabs */}
                    <Tabs 
                      defaultValue={activePlatform} 
                      onValueChange={setActivePlatform}
                      className="w-full"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">Split Preview by Platform</h3>
                        
                        {/* Strategy selection for this platform */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Strategy:</span>
                          <select
                            className="text-xs p-1 border rounded bg-white"
                            value={activeStrategy}
                            onChange={(e) => setActiveStrategy(e.target.value as SplittingStrategy)}
                          >
                            {selectedStrategies.map(strategy => (
                              <option key={strategy} value={strategy}>{getStrategyName(strategy)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <TabsList className="mb-4 mt-2">
                        {platformsNeedingSplit.map(platformId => (
                          <TabsTrigger 
                            key={platformId}
                            value={platformId}
                            className="inline-flex items-center gap-1.5"
                          >
                            <SocialIcon platform={platformId} className="h-3.5 w-3.5" />
                            <span>{getPlatformName(platformId)}</span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      
                      {/* Results for each platform */}
                      {platformsNeedingSplit.map(platformId => (
                        <TabsContent key={platformId} value={platformId} className="mt-0">
                          {renderSplitPosts(platformId, activeStrategy)}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </>
                )}
                
                {/* Generate button (only visible when results are not available yet) */}
                {!splitResults && !isLoading && !error && (
                  <div className="flex justify-end">
                    <Button 
                      onClick={generateSplitOptions}
                      className="gap-1.5"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>Generate Split Options</span>
                    </Button>
                  </div>
                )}
                
                {/* Generate button (visible when there's an error) */}
                {!splitResults && !isLoading && error && (
                  <div className="flex justify-between mt-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={generateSplitOptions}
                      className="gap-1.5"
                    >
                      <UIIcon.Refresh className="h-3.5 w-3.5" />
                      <span>Try Again</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}