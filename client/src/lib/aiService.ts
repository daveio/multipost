import { apiRequest } from "./queryClient";

export enum SplittingStrategy {
  SEMANTIC = "semantic", 
  SENTENCE = "sentence", 
  RETAIN_HASHTAGS = "retain_hashtags", 
  PRESERVE_MENTIONS = "preserve_mentions", 
  THREAD_OPTIMIZED = "thread_optimized",
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
export async function splitPost(content: string, strategy?: SplittingStrategy): Promise<Record<SplittingStrategy, Record<string, SplitPostResult>>> {
  try {
    console.log(`Splitting post with ${strategy ? 'strategy: ' + strategy : 'all strategies'}`);
    const response = await apiRequest('POST', '/api/split-post', { content, strategy });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error splitting post:', error);
    throw error;
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
  } catch (error) {
    console.error('Error optimizing post:', error);
    throw error;
  }
}

/**
 * Returns a human-readable name for each splitting strategy
 */
export function getStrategyName(strategy: SplittingStrategy): string {
  switch (strategy) {
    case SplittingStrategy.SEMANTIC:
      return 'Semantic (By Topic)';
    case SplittingStrategy.SENTENCE:
      return 'Sentence-Based';
    case SplittingStrategy.RETAIN_HASHTAGS:
      return 'Preserve Hashtags';
    case SplittingStrategy.PRESERVE_MENTIONS:
      return 'Preserve @Mentions';
    case SplittingStrategy.THREAD_OPTIMIZED:
      return 'Thread Optimized';
    default:
      return strategy;
  }
}

/**
 * Returns a description for each strategy
 */
export function getStrategyDescription(strategy: SplittingStrategy): string {
  switch (strategy) {
    case SplittingStrategy.SEMANTIC:
      return 'Splits by semantic units, preserving complete thoughts and topics.';
    case SplittingStrategy.SENTENCE:
      return 'Splits at sentence boundaries, ensuring no sentence is cut in the middle.';
    case SplittingStrategy.RETAIN_HASHTAGS:
      return 'Ensures all hashtags are preserved, especially in the final post.';
    case SplittingStrategy.PRESERVE_MENTIONS:
      return 'Preserves @mentions, repeating them in multiple posts if needed for context.';
    case SplittingStrategy.THREAD_OPTIMIZED:
      return 'Creates an engaging thread with clear continuity and hooks between posts.';
    default:
      return 'Custom splitting strategy';
  }
}