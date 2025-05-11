import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  splitPost, 
  optimizePost, 
  SplittingStrategy,
  SplitPostResult 
} from './aiService';

// Mock module for apiRequest
vi.mock('./queryClient', () => ({
  apiRequest: vi.fn()
}));

import { apiRequest } from './queryClient';

describe('AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('splitPost', () => {
    const mockContent = 'This is a long post that needs to be split into multiple parts for social media. It should respect the character limits of different platforms and maintain the meaning of the original post.';
    const mockStrategies = [SplittingStrategy.SEMANTIC, SplittingStrategy.RETAIN_HASHTAGS];
    
    it('should call the API with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          [SplittingStrategy.SEMANTIC]: {
            bluesky: {
              strategy: SplittingStrategy.SEMANTIC,
              splitText: ['Part 1', 'Part 2'],
              reasoning: 'Split by semantic meaning'
            }
          },
          [SplittingStrategy.RETAIN_HASHTAGS]: {
            bluesky: {
              strategy: SplittingStrategy.RETAIN_HASHTAGS,
              splitText: ['Part 1 #hashtag', 'Part 2 #hashtag'],
              reasoning: 'Retained hashtags in each part'
            }
          }
        })
      };
      
      (apiRequest as any).mockResolvedValueOnce(mockResponse);
      
      await splitPost(mockContent, mockStrategies);
      
      // Check that apiRequest was called with correct parameters
      expect(apiRequest).toHaveBeenCalledWith(
        'POST', 
        '/api/split-post', 
        { 
          content: mockContent, 
          strategies: mockStrategies,
          customMastodonLimit: undefined
        }
      );
    });
    
    it('should return structured results from the API', async () => {
      // Mock successful response
      const mockResponseData = {
        [SplittingStrategy.SEMANTIC]: {
          bluesky: {
            strategy: SplittingStrategy.SEMANTIC,
            splitText: ['Part 1', 'Part 2'],
            reasoning: 'Split by semantic meaning'
          }
        }
      };
      
      const mockResponse = {
        json: vi.fn().mockResolvedValue(mockResponseData)
      };
      
      (apiRequest as any).mockResolvedValueOnce(mockResponse);
      
      const result = await splitPost(mockContent, mockStrategies);
      
      expect(result).toEqual(mockResponseData);
    });
    
    it('should handle API errors gracefully', async () => {
      // Mock error response
      const errorObj = new Error('API rate limit exceeded');
      (errorObj as any).json = vi.fn().mockResolvedValue({
        message: 'API rate limit exceeded'
      });
      
      (apiRequest as any).mockRejectedValueOnce(errorObj);
      
      // Expect the function to throw with a specific error message
      await expect(splitPost(mockContent, mockStrategies))
        .rejects.toThrow('API rate limit exceeded');
    });
    
    it('should handle network errors', async () => {
      // Mock network error
      const networkError = new Error('Network error');
      (apiRequest as any).mockRejectedValueOnce(networkError);
      
      await expect(splitPost(mockContent, mockStrategies))
        .rejects.toThrow('Network error');
    });
  });
  
  describe('optimizePost', () => {
    const mockContent = 'This is a post that needs to be optimized for a specific platform.';
    const mockPlatform = 'bluesky';
    
    it('should call the API with correct parameters', async () => {
      // Mock successful response
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          optimized: 'This is an optimized post for Bluesky with better hashtags #bluesky'
        })
      };
      
      (apiRequest as any).mockResolvedValueOnce(mockResponse);
      
      await optimizePost(mockContent, mockPlatform);
      
      // Check that apiRequest was called with correct parameters
      expect(apiRequest).toHaveBeenCalledWith(
        'POST', 
        '/api/optimize-post', 
        { 
          content: mockContent, 
          platform: mockPlatform,
          customMastodonLimit: undefined
        }
      );
    });
    
    it('should return optimized content from the API', async () => {
      // Mock successful response
      const mockOptimized = 'Optimized content';
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          optimized: mockOptimized
        })
      };
      
      (apiRequest as any).mockResolvedValueOnce(mockResponse);
      
      const result = await optimizePost(mockContent, mockPlatform);
      
      expect(result).toEqual(mockOptimized);
    });
    
    it('should handle API errors with a clear message', async () => {
      // Mock error response with JSON error info
      const errorObj = new Error('Invalid API key provided');
      (errorObj as any).json = vi.fn().mockResolvedValue({
        message: 'Invalid API key provided'
      });
      
      (apiRequest as any).mockRejectedValueOnce(errorObj);
      
      await expect(optimizePost(mockContent, mockPlatform))
        .rejects.toThrow('Invalid API key provided');
    });
    
    it('should handle non-JSON error responses', async () => {
      // Mock error response without JSON
      const errorObj = new Error('Server error');
      (errorObj as any).json = vi.fn().mockRejectedValue(new Error('Invalid JSON'));
      
      (apiRequest as any).mockRejectedValueOnce(errorObj);
      
      await expect(optimizePost(mockContent, mockPlatform))
        .rejects.toThrow('Server error');
    });
  });
  
  describe('Strategy-related functions', () => {
    it('should export enum for different splitting strategies', () => {
      expect(SplittingStrategy.SEMANTIC).toBeDefined();
      expect(SplittingStrategy.SENTENCE).toBeDefined();
      expect(SplittingStrategy.RETAIN_HASHTAGS).toBeDefined();
      expect(SplittingStrategy.PRESERVE_MENTIONS).toBeDefined();
    });
  });
});