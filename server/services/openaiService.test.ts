import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SplittingStrategy, optimizePost, splitPost, validateThreadIndicatorFormatting } from './openaiService'

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockImplementation(async () => ({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    posts: ['First split post', 'Second split post'],
                    reasoning: 'Split for testing purposes'
                  })
                }
              }
            ]
          }))
        }
      }
    }))
  }
})

describe('OpenAI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('splitPost function', () => {
    it('should split a post into multiple posts', async () => {
      const content = 'This is a long post that needs to be split into multiple posts.'
      const characterLimit = 200
      const strategy = SplittingStrategy.SEMANTIC

      const result = await splitPost(content, characterLimit, strategy)

      expect(result).toHaveProperty('splitText')
      expect(result).toHaveProperty('strategy')
      expect(result).toHaveProperty('reasoning')
      expect(result.splitText).toBeInstanceOf(Array)
      expect(result.splitText.length).toBe(2)
      expect(result.strategy).toBe(strategy)
      expect(result.reasoning).toBe('Split for testing purposes')
    })

    it('should handle multiple strategies', async () => {
      const content = 'This is a long post that needs to be split into multiple posts.'
      const characterLimit = 200
      const strategies = [SplittingStrategy.SEMANTIC, SplittingStrategy.SENTENCE]

      const result = await splitPost(content, characterLimit, strategies)

      expect(result).toHaveProperty('splitText')
      expect(result.splitText).toBeInstanceOf(Array)
      expect(result.strategy).toBe(strategies[0]) // First strategy is used as main
    })
  })

  describe('optimizePost function', () => {
    it('should optimize a post for a specific platform', async () => {
      const content = 'This is a post that needs to be optimized.'
      const platform = 'bluesky'
      const characterLimit = 300

      // For this test, we accept the current implementation's response format
      // which returns a JSON string from the mock
      const result = await optimizePost(content, platform, characterLimit)

      expect(typeof result).toBe('string')

      // The current mock returns JSON content, so we parse it to verify structure
      const parsed = JSON.parse(result)
      expect(parsed).toHaveProperty('posts')
      expect(Array.isArray(parsed.posts)).toBe(true)
      expect(parsed).toHaveProperty('reasoning')
    })
  })

  describe('validateThreadIndicatorFormatting function', () => {
    it('should add two newlines before thread indicator when missing', () => {
      const post = 'This is a post without proper newlines before thread indicator 🧵 2 of 3'
      const result = validateThreadIndicatorFormatting(post, 1, 3)

      // Should add two newlines before thread indicator
      expect(result).toEqual('This is a post without proper newlines before thread indicator\n\n🧵 2 of 3')
    })

    it('should not modify posts that already have two newlines before the thread indicator', () => {
      const post = 'This is a post with proper newlines before thread indicator\n\n🧵 2 of 3'
      const result = validateThreadIndicatorFormatting(post, 1, 3)

      // Should not modify the content
      expect(result).toEqual(post)
    })

    it('should not modify posts without thread indicators', () => {
      const post = 'This is a post without any thread indicator'
      const result = validateThreadIndicatorFormatting(post, 0, 1)

      // Should not modify the content
      expect(result).toEqual(post)
    })

    it('should handle empty posts', () => {
      const post = ''
      const result = validateThreadIndicatorFormatting(post, 0, 1)

      // Should not modify empty content
      expect(result).toEqual('')
    })

    it('should handle various thread indicator formats', () => {
      const postWithSlash = 'This is a post with thread indicator 🧵 2/3'
      const resultWithSlash = validateThreadIndicatorFormatting(postWithSlash, 1, 3)
      expect(resultWithSlash).toEqual('This is a post with thread indicator\n\n🧵 2/3')

      const postWithOf = 'This is a post with thread indicator 🧵 2 of 3'
      const resultWithOf = validateThreadIndicatorFormatting(postWithOf, 1, 3)
      expect(resultWithOf).toEqual('This is a post with thread indicator\n\n🧵 2 of 3')

      const postWithSpaces = 'This is a post with thread indicator 🧵  2  of  3'
      const resultWithSpaces = validateThreadIndicatorFormatting(postWithSpaces, 1, 3)
      expect(resultWithSpaces).toEqual('This is a post with thread indicator\n\n🧵  2  of  3')
    })
  })
})
