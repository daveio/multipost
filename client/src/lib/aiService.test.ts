import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  splitPost, 
  optimizePost, 
  getStrategyName, 
  getStrategyDescription, 
  getStrategyTooltip,
  SplittingStrategy
} from './aiService';
import { apiRequest } from './queryClient';

// Mock the apiRequest function
vi.mock('./queryClient', () => ({
  apiRequest: vi.fn()
}));

describe('AI Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('splitPost function', () => {
    it('should call the API with correct parameters for a single strategy', async () => {
      // Mock the API response
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          semantic: {
            bluesky: {
              splitText: ['Part 1', 'Part 2'],
              strategy: 'semantic',
              reasoning: 'Testing split'
            }
          }
        })
      };
      
      // @ts-ignore - Mocking
      apiRequest.mockResolvedValue(mockResponse);

      // Call the function
      const content = 'Test content that is too long';
      const strategy = SplittingStrategy.SEMANTIC;
      const result = await splitPost(content, strategy);

      // Check apiRequest was called correctly
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/split-post', {
        content,
        strategies: [strategy],
        customMastodonLimit: undefined
      });

      // Check the result
      expect(result).toHaveProperty('semantic');
      expect(result.semantic).toHaveProperty('bluesky');
      expect(result.semantic.bluesky.splitText).toEqual(['Part 1', 'Part 2']);
    });

    it('should call the API with multiple strategies', async () => {
      // Mock the API response
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          semantic: {
            bluesky: {
              splitText: ['Part 1', 'Part 2'],
              strategy: 'semantic',
              reasoning: 'Testing split'
            }
          },
          sentence: {
            bluesky: {
              splitText: ['Sentence 1', 'Sentence 2'],
              strategy: 'sentence',
              reasoning: 'Testing sentence split'
            }
          }
        })
      };
      
      // @ts-ignore - Mocking
      apiRequest.mockResolvedValue(mockResponse);

      // Call the function
      const content = 'Test content that is too long';
      const strategies = [
        SplittingStrategy.SEMANTIC,
        SplittingStrategy.SENTENCE
      ];
      const result = await splitPost(content, strategies);

      // Check apiRequest was called correctly
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/split-post', {
        content,
        strategies,
        customMastodonLimit: undefined
      });

      // Check the result
      expect(result).toHaveProperty('semantic');
      expect(result).toHaveProperty('sentence');
      expect(result.semantic.bluesky.splitText).toEqual(['Part 1', 'Part 2']);
      expect(result.sentence.bluesky.splitText).toEqual(['Sentence 1', 'Sentence 2']);
    });

    it('should handle API errors', async () => {
      // Mock the API error
      const mockError = new Error('API error');
      mockError.json = vi.fn().mockResolvedValue({
        message: 'Failed to split post',
        error: 'Test error'
      });
      
      // @ts-ignore - Mocking
      apiRequest.mockRejectedValue(mockError);

      // Call the function and expect it to throw
      const content = 'Test content';
      const strategy = SplittingStrategy.SEMANTIC;
      
      await expect(splitPost(content, strategy)).rejects.toThrow();
    });
  });

  describe('optimizePost function', () => {
    it('should call the API with correct parameters', async () => {
      // Mock the API response
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          optimized: 'Optimized content'
        })
      };
      
      // @ts-ignore - Mocking
      apiRequest.mockResolvedValue(mockResponse);

      // Call the function
      const content = 'Test content';
      const platform = 'bluesky';
      const result = await optimizePost(content, platform);

      // Check apiRequest was called correctly
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/optimize-post', {
        content,
        platform,
        customMastodonLimit: undefined
      });

      // Check the result
      expect(result).toBe('Optimized content');
    });

    it('should handle custom Mastodon limit', async () => {
      // Mock the API response
      const mockResponse = {
        json: vi.fn().mockResolvedValue({
          optimized: 'Optimized content'
        })
      };
      
      // @ts-ignore - Mocking
      apiRequest.mockResolvedValue(mockResponse);

      // Call the function
      const content = 'Test content';
      const platform = 'mastodon';
      const customMastodonLimit = 1000;
      await optimizePost(content, platform, customMastodonLimit);

      // Check apiRequest was called with customMastodonLimit
      expect(apiRequest).toHaveBeenCalledWith('POST', '/api/optimize-post', {
        content,
        platform,
        customMastodonLimit
      });
    });
  });

  describe('Strategy utility functions', () => {
    it('getStrategyName should return readable names', () => {
      expect(getStrategyName(SplittingStrategy.SEMANTIC)).toBe('Semantic Grouping');
      expect(getStrategyName(SplittingStrategy.SENTENCE)).toBe('Sentence Boundaries');
      expect(getStrategyName(SplittingStrategy.RETAIN_HASHTAGS)).toBe('Preserve Hashtags');
      expect(getStrategyName(SplittingStrategy.PRESERVE_MENTIONS)).toBe('Preserve @Mentions');
    });

    it('getStrategyDescription should return detailed descriptions', () => {
      expect(getStrategyDescription(SplittingStrategy.SEMANTIC)).toContain('semantic units');
      expect(getStrategyDescription(SplittingStrategy.SENTENCE)).toContain('sentence boundaries');
      expect(getStrategyDescription(SplittingStrategy.RETAIN_HASHTAGS)).toContain('hashtags');
      expect(getStrategyDescription(SplittingStrategy.PRESERVE_MENTIONS)).toContain('mentions');
    });

    it('getStrategyTooltip should return short tooltips', () => {
      expect(getStrategyTooltip(SplittingStrategy.SEMANTIC)).toContain('topics');
      expect(getStrategyTooltip(SplittingStrategy.SENTENCE)).toContain('sentences');
      expect(getStrategyTooltip(SplittingStrategy.RETAIN_HASHTAGS)).toContain('#hashtags');
      expect(getStrategyTooltip(SplittingStrategy.PRESERVE_MENTIONS)).toContain('@mentions');
    });
  });
});