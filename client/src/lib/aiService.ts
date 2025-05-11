import { apiRequest } from "./queryClient";

export enum SplittingStrategy {
  SEMANTIC = "semantic", 
  SENTENCE = "sentence", 
  RETAIN_HASHTAGS = "retain_hashtags", 
  PRESERVE_MENTIONS = "preserve_mentions",
  // Thread optimization is now applied to all strategies automatically
}

export interface SplitPostResult {
  splitText: string[];
  strategy: SplittingStrategy;
  reasoning: string;
}

/**
 * Splits a post into multiple posts using different strategies
 * If a specific strategy is provided, only that strategy will be calculated
 */
export async function splitPost(
  content: string, 
  strategies?: SplittingStrategy | SplittingStrategy[]
): Promise<Record<SplittingStrategy, Record<string, SplitPostResult>>> {
  try {
    // Convert single strategy to array
    const strategiesArray = strategies 
      ? (Array.isArray(strategies) ? strategies : [strategies]) 
      : undefined;
    
    console.log(`Splitting post with strategies:`, strategiesArray || 'default');
    
    // Send the strategies as an array
    const response = await apiRequest('POST', '/api/split-post', { 
      content, 
      strategies: strategiesArray 
    });
    
    const data = await response.json();
    console.log('Split post API response:', data);
    return data;
  } catch (error: any) {
    console.error('Error splitting post:', error);
    
    // Check if there's a detailed error response from the server
    if (error.json) {
      try {
        // Try to parse the error response
        const errorData = await error.json();
        console.error('Detailed splitting error:', errorData);
        
        // Create a more informative error object
        const enhancedError = new Error(errorData.message || 'Failed to split post');
        enhancedError.cause = errorData;
        throw enhancedError;
      } catch (jsonError) {
        // If parsing fails, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Optimizes a post for a specific platform
 */
export async function optimizePost(content: string, platform: string): Promise<string> {
  try {
    const response = await apiRequest('POST', '/api/optimize-post', { content, platform });
    const data = await response.json();
    return data.optimized;
  } catch (error: any) {
    console.error('Error optimizing post:', error);
    
    // Check if there's a detailed error response from the server
    if (error.json) {
      try {
        // Try to parse the error response
        const errorData = await error.json();
        console.error('Detailed optimization error:', errorData);
        
        // Create a more informative error object
        const enhancedError = new Error(errorData.message || 'Failed to optimize post');
        enhancedError.cause = errorData;
        throw enhancedError;
      } catch (jsonError) {
        // If parsing fails, throw the original error
        throw error;
      }
    } else {
      throw error;
    }
  }
}

/**
 * Returns a human-readable name for each splitting strategy
 */
export function getStrategyName(strategy: SplittingStrategy): string {
  switch (strategy) {
    case SplittingStrategy.SEMANTIC:
      return 'Semantic Grouping';
    case SplittingStrategy.SENTENCE:
      return 'Sentence Boundaries';
    case SplittingStrategy.RETAIN_HASHTAGS:
      return 'Preserve Hashtags';
    case SplittingStrategy.PRESERVE_MENTIONS:
      return 'Preserve @Mentions';
    default:
      return String(strategy);
  }
}

/**
 * Returns a detailed description for each strategy
 */
export function getStrategyDescription(strategy: SplittingStrategy): string {
  switch (strategy) {
    case SplittingStrategy.SEMANTIC:
      return 'Creates splits based on meaningful semantic units, preserving complete thoughts and topics. Each split will contain related ideas and maintain the logical flow of your content.';
    case SplittingStrategy.SENTENCE:
      return 'Divides content at sentence boundaries, ensuring no sentence is cut in the middle. This provides a more natural reading experience without breaking the grammatical structure of your sentences.';
    case SplittingStrategy.RETAIN_HASHTAGS:
      return 'Ensures all hashtags from your original post are preserved. If hashtags are present, they will be strategically distributed across posts with priority on including them where contextually relevant.';
    case SplittingStrategy.PRESERVE_MENTIONS:
      return 'Maintains @mentions in their proper context. If a split would separate a mention from its relevant context, the mention will be included in both related posts for clarity and proper attribution.';
    default:
      return 'Custom splitting strategy';
  }
}

/**
 * Returns a short tooltip for each strategy
 */
export function getStrategyTooltip(strategy: SplittingStrategy): string {
  switch (strategy) {
    case SplittingStrategy.SEMANTIC:
      return 'Groups similar topics together in each post';
    case SplittingStrategy.SENTENCE:
      return 'Splits only at the end of complete sentences';
    case SplittingStrategy.RETAIN_HASHTAGS:
      return 'Ensures all #hashtags are preserved in appropriate context';
    case SplittingStrategy.PRESERVE_MENTIONS:
      return 'Keeps @mentions with their relevant context';
    default:
      return '';
  }
}