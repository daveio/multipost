import OpenAI from "openai";

// Verify the presence of OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error("OpenAI API key is missing. Please add OPENAI_API_KEY to environment variables.");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Splitting strategies
export enum SplittingStrategy {
  SEMANTIC = "semantic", // Split by meaningful semantic chunks
  SENTENCE = "sentence", // Split by sentences
  RETAIN_HASHTAGS = "retain_hashtags", // Ensure hashtags are preserved
  PRESERVE_MENTIONS = "preserve_mentions", // Make sure @mentions stay intact
  // Thread optimization is now included in all strategies
}

interface SplitPostResult {
  splitText: string[];
  strategy: SplittingStrategy;
  reasoning: string;
}

/**
 * Validate and fix thread indicator formatting to ensure it has two newlines before it
 * @param post The post text to validate
 * @param index The index of the post in the thread (0-based)
 * @param total The total number of posts in the thread
 * @returns The post with properly formatted thread indicator
 */
export function validateThreadIndicatorFormatting(post: string, index: number, total: number): string {
  // Skip validation for empty posts
  if (!post || post.trim().length === 0) {
    return post;
  }
  
  console.log(`Validating thread indicator formatting for post ${index+1}/${total}: "${post.substring(0, 30)}..."`);
  
  // Check if this post has a thread indicator
  const threadIndicatorRegex = /🧵\s*(\d+)\s*(?:of|\/)\s*(\d+)$/;
  const threadIndicatorMatch = post.match(threadIndicatorRegex);
  
  // If no thread indicator, no changes needed
  if (!threadIndicatorMatch) {
    return post;
  }
  
  // Check if the thread indicator already has two newlines before it
  const twoNewlinesBeforeRegex = /\n\n🧵\s*(\d+)\s*(?:of|\/)\s*(\d+)$/;
  if (twoNewlinesBeforeRegex.test(post)) {
    // Already formatted correctly
    return post;
  }
  
  // Find the thread indicator position
  const indicatorPosition = post.lastIndexOf(threadIndicatorMatch[0]);
  
  // Split the post into content and indicator
  const content = post.substring(0, indicatorPosition).trim();
  const indicator = post.substring(indicatorPosition);
  
  // Combine with two newlines in between
  const fixedPost = content + '\n\n' + indicator;
  console.log(`Fixed thread indicator formatting: "${fixedPost.substring(Math.max(0, fixedPost.length - 50))}"`);
  return fixedPost;
}

/**
 * Split a long post into multiple posts for specific platform
 * using multiple strategies simultaneously
 */
export async function splitPost(
  content: string,
  characterLimit: number,
  strategies: SplittingStrategy | SplittingStrategy[]
): Promise<SplitPostResult> {
  // Convert to array if single strategy
  const strategiesArray = Array.isArray(strategies) ? strategies : [strategies];
  
  // Build a comprehensive system prompt that considers all selected strategies
  const strategiesDescription = strategiesArray
    .map(strategy => getStrategyDescription(strategy))
    .join('\n\n');
  
  const systemPrompt = `You are an expert in splitting long social media posts into multiple shorter posts for a thread.
  The character limit per post is ${characterLimit} characters.

  Take the input text and split it into multiple posts that each stays under the character limit.
  Create a single, optimal split that incorporates ALL of the following strategies:
  
  ${strategiesDescription}
  
  IMPORTANT: Always optimize for thread reading experience:
  - Start each post (except the first) with a clear continuation indicator
  - End each post (except the last) with a hook or cliffhanger to encourage reading the next post
  - Mark thread numbering with notation like "🧵 1 of 3", "🧵 2 of 3", "🧵 3 of 3" at the end of each post
  - Add two newlines before the thread notation
  
  Return your response as a JSON object with the following format:
  {
    "posts": ["post1", "post2", ...],
    "reasoning": "brief explanation of your splitting approach and how you balanced the different strategies"
  }`;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: content
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = response.choices[0].message.content || "{}";
    
    try {
      const result = JSON.parse(responseContent);
      
      // Validate the expected response structure
      if (!result.posts) {
        throw new Error(`OpenAI response is missing 'posts' field. Response was: ${JSON.stringify(result)}`);
      }
      
      // Ensure posts is an array
      if (!Array.isArray(result.posts)) {
        if (typeof result.posts === 'string') {
          // Single post string is acceptable, convert to array
          result.posts = [result.posts];
        } else {
          // Invalid format
          throw new Error(`OpenAI 'posts' field must be an array or string. Received: ${typeof result.posts}`);
        }
      }
      
      // Validate that all posts are strings
      for (let i = 0; i < result.posts.length; i++) {
        if (typeof result.posts[i] !== 'string') {
          throw new Error(`Post at index ${i} is not a string. Type: ${typeof result.posts[i]}, Value: ${JSON.stringify(result.posts[i])}`);
        }
        
        // Validate and fix thread indicators formatting
        result.posts[i] = validateThreadIndicatorFormatting(result.posts[i], i, result.posts.length);
      }
      
      // Use the first strategy as the main one for response structure
      const mainStrategy = Array.isArray(strategies) ? strategies[0] : strategies;
      
      return {
        splitText: result.posts,
        strategy: mainStrategy,
        reasoning: result.reasoning || "No reasoning provided"
      };
    } catch (parseError: any) {
      console.error("Error processing OpenAI response:", parseError);
      // Throw with more details to be handled upstream
      throw new Error(`Invalid OpenAI response format: ${parseError.message}. Raw response: ${responseContent}`);
    }
  } catch (error: any) {
    console.error("Error splitting post:", error);
    
    // Enhanced error handling with specific OpenAI error cases
    let errorMessage = `Failed to split post: ${error.message || "Unknown error"}`;
    let errorCode = "general_error";
    
    // Extract OpenAI specific error codes if available
    if (error.response?.data?.error) {
      const openAIError = error.response.data.error;
      
      // Map common OpenAI errors to user-friendly messages
      if (openAIError.type === 'invalid_request_error') {
        if (openAIError.code === 'invalid_api_key') {
          errorMessage = "Invalid OpenAI API key provided. Please check your API key.";
          errorCode = "invalid_api_key";
        } else if (openAIError.code === 'rate_limit_exceeded') {
          errorMessage = "OpenAI rate limit exceeded. Please try again after a short wait.";
          errorCode = "rate_limit_exceeded";
        } else if (openAIError.code === 'insufficient_quota') {
          errorMessage = "OpenAI quota exceeded. Please check your OpenAI account billing.";
          errorCode = "insufficient_quota";
        }
      }
    }
    
    // Create an enhanced error object with code and details
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = errorCode;
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
}

/**
 * Generate multiple splitting strategies for a post and return all options
 */
export async function generateSplittingOptions(
  content: string,
  platformLimits: Record<string, number>
): Promise<Record<SplittingStrategy, Record<string, SplitPostResult>>> {
  // Create an object to hold all results by strategy and platform
  const results: Record<SplittingStrategy, Record<string, SplitPostResult>> = {
    [SplittingStrategy.SEMANTIC]: {},
    [SplittingStrategy.SENTENCE]: {},
    [SplittingStrategy.RETAIN_HASHTAGS]: {},
    [SplittingStrategy.PRESERVE_MENTIONS]: {},
  };
  
  // For each platform and strategy, generate splitting options
  const platforms = Object.keys(platformLimits);
  
  // First, check if splitting is actually needed for any platform
  const needsSplitting = platforms.some(platform => 
    content.length > platformLimits[platform]
  );
  
  if (!needsSplitting) {
    // No splitting needed, return original content for all strategies and platforms
    const noSplittingResult: SplitPostResult = {
      splitText: [content],
      strategy: SplittingStrategy.SEMANTIC,
      reasoning: "Content is within character limits for all platforms. No splitting required."
    };
    
    Object.values(SplittingStrategy).forEach(strategy => {
      platforms.forEach(platform => {
        results[strategy][platform] = noSplittingResult;
      });
    });
    
    return results;
  }
  
  // For platforms that need splitting, run the AI for all strategies
  for (const strategy of Object.values(SplittingStrategy)) {
    for (const platform of platforms) {
      if (content.length > platformLimits[platform]) {
        try {
          // Generate split for this strategy and platform
          results[strategy][platform] = await splitPost(
            content,
            platformLimits[platform],
            strategy as SplittingStrategy
          );
        } catch (error: any) {
          console.error(`Error generating splitting for ${platform} with ${strategy}:`, error);
          // Propagate the error up with detailed information
          throw new Error(`Failed to generate split for ${platform} using ${strategy} strategy: ${error.message}`);
        }
      } else {
        // No splitting needed for this platform - use authentic data
        results[strategy as SplittingStrategy][platform] = {
          splitText: [content],
          strategy: strategy as SplittingStrategy,
          reasoning: `Content is within character limit for ${platform}. No splitting required.`
        };
      }
    }
  }
  
  return results;
}

/**
 * Optimize a post for a specific platform
 */
export async function optimizePost(
  content: string,
  platform: string,
  characterLimit: number
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert social media optimizer. Your task is to optimize the given text for ${platform}, 
          ensuring it fits within ${characterLimit} characters while preserving the original meaning and style.
          Make adjustments to make the post more engaging and appropriate for ${platform}'s audience and format.
          Don't use hashtags unless they were in the original content. Don't add emojis unless they were in the original.
          Keep the same tone and voice as the original.`
        },
        {
          role: "user",
          content: content
        }
      ],
      temperature: 0.7,
      max_tokens: characterLimit,
    });
    
    return response.choices[0].message.content?.trim() || "";
  } catch (error: any) {
    console.error("Error optimizing post:", error);
    
    // Enhanced error handling with specific OpenAI error cases
    let errorMessage = `Failed to optimize post: ${error.message || "Unknown error"}`;
    let errorCode = "general_error";
    
    // Extract OpenAI specific error codes if available
    if (error.response?.data?.error) {
      const openAIError = error.response.data.error;
      
      // Map common OpenAI errors to user-friendly messages
      if (openAIError.type === 'invalid_request_error') {
        if (openAIError.code === 'invalid_api_key') {
          errorMessage = "Invalid OpenAI API key provided. Please check your API key.";
          errorCode = "invalid_api_key";
        } else if (openAIError.code === 'rate_limit_exceeded') {
          errorMessage = "OpenAI rate limit exceeded. Please try again after a short wait.";
          errorCode = "rate_limit_exceeded";
        } else if (openAIError.code === 'insufficient_quota') {
          errorMessage = "OpenAI quota exceeded. Please check your OpenAI account billing.";
          errorCode = "insufficient_quota";
        }
      }
    }
    
    // Create an enhanced error object with code and details
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = errorCode;
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }
}

/**
 * Get description for a specific strategy
 */
function getStrategyDescription(strategy: SplittingStrategy): string {
  switch(strategy) {
    case SplittingStrategy.SEMANTIC:
      return `SEMANTIC SPLITTING: Split the text based on semantic units, preserving the meaning of each section.
      Each split should contain complete thoughts or topics.`;
      
    case SplittingStrategy.SENTENCE:
      return `SENTENCE-BASED SPLITTING: Split the text at sentence boundaries, ensuring no sentence is cut in the middle.
      Try to keep related sentences together when possible.`;
      
    case SplittingStrategy.RETAIN_HASHTAGS:
      return `HASHTAG PRESERVATION: Ensure all hashtags from the original post are preserved.
      If there are hashtags in the original, include all of them in the last post.`;
      
    case SplittingStrategy.PRESERVE_MENTIONS:
      return `MENTION PRESERVATION: Ensure all @mentions from the original post are preserved.
      If a post is split such that it separates an @mention from its context, 
      include the @mention in both posts where relevant.`;
      
    // Thread optimization is now applied to all strategies automatically
      
    default:
      return `Split based on semantic units, preserving the meaning of each section.`;
  }
}

/**
 * Get the appropriate system prompt based on the splitting strategy
 * (Legacy method, kept for backwards compatibility)
 */
function getSystemPromptForStrategy(strategy: SplittingStrategy, characterLimit: number): string {
  const basePrompt = `You are an expert in splitting long social media posts into multiple shorter posts for a thread.
  The character limit per post is ${characterLimit} characters.
  Take the input text and split it into multiple posts that each stays under the character limit.
  Ensure each post makes sense on its own while maintaining the original meaning and narrative flow.
  Return your response as a JSON object with the following format:
  {
    "posts": ["post1", "post2", ...],
    "reasoning": "brief explanation of your splitting approach"
  }`;
  
  return `${basePrompt}\n${getStrategyDescription(strategy)}`;
}