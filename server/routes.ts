import { type Server, createServer } from 'http'
import { insertDraftSchema, insertPostSchema, mediaFileSchema, platformSchema } from '@shared/schema'
import type { Express, NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { SplittingStrategy, generateSplittingOptions, optimizePost, splitPost } from './services/openaiService'
import { storage } from './storage'

export async function registerRoutes(app: Express): Promise<Server> {
  const API_PREFIX = '/api'

  // User route - Get current demo user
  app.get(`${API_PREFIX}/user`, async (req: Request, res: Response) => {
    // For demo purposes, always return the first user
    const user = await storage.getUser(1)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Don't return the password
    const { password, ...userWithoutPassword } = user
    res.json(userWithoutPassword)
  })

  // Accounts routes
  app.get(`${API_PREFIX}/accounts`, async (req: Request, res: Response) => {
    const accounts = await storage.getAccounts(1) // Use demo user
    res.json(accounts)
  })

  app.get(`${API_PREFIX}/accounts/:platformId`, async (req: Request, res: Response) => {
    const { platformId } = req.params
    const accounts = await storage.getAccountsByPlatform(1, platformId) // Use demo user
    res.json(accounts)
  })

  // Drafts routes
  app.get(`${API_PREFIX}/drafts`, async (req: Request, res: Response) => {
    const drafts = await storage.getDrafts(1) // Use demo user
    res.json(drafts)
  })

  app.get(`${API_PREFIX}/drafts/:id`, async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id)
    const draft = await storage.getDraft(id)

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' })
    }

    res.json(draft)
  })

  app.post(`${API_PREFIX}/drafts`, async (req: Request, res: Response) => {
    try {
      const validatedData = insertDraftSchema.parse({
        ...req.body,
        userId: 1 // Use demo user
      })

      const draft = await storage.createDraft(validatedData)
      res.status(201).json(draft)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid draft data', errors: error.errors })
      }
      res.status(500).json({ message: 'Failed to create draft' })
    }
  })

  app.put(`${API_PREFIX}/drafts/:id`, async (req: Request, res: Response) => {
    try {
      const id = Number.parseInt(req.params.id)
      const draft = await storage.getDraft(id)

      if (!draft) {
        return res.status(404).json({ message: 'Draft not found' })
      }

      const validatedData = insertDraftSchema.partial().parse(req.body)
      const updatedDraft = await storage.updateDraft(id, validatedData)
      res.json(updatedDraft)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid draft data', errors: error.errors })
      }
      res.status(500).json({ message: 'Failed to update draft' })
    }
  })

  app.delete(`${API_PREFIX}/drafts/:id`, async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id)
    const success = await storage.deleteDraft(id)

    if (!success) {
      return res.status(404).json({ message: 'Draft not found' })
    }

    res.status(204).send()
  })

  // Posts routes
  app.post(`${API_PREFIX}/posts`, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        userId: 1 // Use demo user
      })

      const post = await storage.createPost(validatedData)

      // Simulate posting to platforms
      setTimeout(async () => {
        await storage.updatePostStatus(post.id, 'completed')
      }, 2000)

      res.status(201).json(post)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid post data', errors: error.errors })
      }
      res.status(500).json({ message: 'Failed to create post' })
    }
  })

  // Platform character limits
  app.get(`${API_PREFIX}/platforms/character-limits`, (req: Request, res: Response) => {
    // Check if custom Mastodon limit is provided as a query parameter
    const customMastodonLimit = req.query.customMastodonLimit as string
    const mastodonLimit =
      customMastodonLimit && !isNaN(Number.parseInt(customMastodonLimit)) ? Number.parseInt(customMastodonLimit) : 500

    res.json({
      bluesky: 300,
      mastodon: mastodonLimit,
      threads: 500
      // Nostr support removed
    })
  })

  // Upload route for media files
  app.post(`${API_PREFIX}/upload`, (req: Request, res: Response) => {
    // This is a mock implementation
    // In a real app, we would handle file uploads using multer or similar

    // We're returning hardcoded URLs for demonstration purposes
    try {
      const { files } = req.body

      if (!Array.isArray(files)) {
        return res.status(400).json({ message: 'Files array is required' })
      }

      const processedFiles = files.map((file, index) => {
        return {
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: `https://images.unsplash.com/photo-${150000000000 + index}`,
          previewUrl: `https://images.unsplash.com/photo-${150000000000 + index}?w=200&h=200`
        }
      })

      res.status(201).json(processedFiles)
    } catch (error) {
      res.status(500).json({ message: 'Failed to upload files' })
    }
  })

  // AI Post Splitting
  app.post(`${API_PREFIX}/split-post`, async (req: Request, res: Response) => {
    try {
      // Verify the OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: 'OpenAI API key is missing',
          error: 'The OpenAI API key is not configured. Add OPENAI_API_KEY to your environment variables.',
          code: 'missing_api_key'
        })
      }

      const { content, strategies, customMastodonLimit } = req.body

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Content is required and must be a string' })
      }

      // Get platform character limits
      const platformLimits: Record<string, number> = {
        bluesky: 300,
        mastodon:
          customMastodonLimit && !isNaN(Number.parseInt(customMastodonLimit))
            ? Number.parseInt(customMastodonLimit)
            : 500,
        threads: 500
        // Nostr support removed
      }

      // If specific strategies are provided, only generate those
      if (strategies && Array.isArray(strategies) && strategies.length > 0) {
        try {
          // Create a result object to store all the strategy results
          const results: Record<string, Record<string, any>> = {}

          // Important: Process all strategies together, not individually
          console.log(`Processing all selected strategies together: ${strategies.join(', ')}`)

          // Initialize the results for each selected strategy
          for (const strategy of strategies) {
            if (!Object.values(SplittingStrategy).includes(strategy)) {
              continue // Skip invalid strategies
            }
            results[strategy] = {}
          }

          // Generate platform-specific splits using all selected strategies together
          for (const platform of Object.keys(platformLimits)) {
            const limit = platformLimits[platform]

            // Only split if content exceeds platform limit
            if (content.length > limit) {
              console.log(`Splitting for ${platform} with limit ${limit} using all selected strategies together`)

              // Make a single API call with all strategies
              const platformResult = await splitPost(
                content,
                limit,
                strategies // Pass all selected strategies at once
              )

              // Store the same result under each strategy key for UI compatibility
              for (const strategy of strategies) {
                if (!Object.values(SplittingStrategy).includes(strategy)) continue

                results[strategy][platform] = {
                  ...platformResult,
                  strategy: strategies // Show all selected strategies in the result
                }
              }
            } else {
              // No splitting needed
              for (const strategy of strategies) {
                if (!Object.values(SplittingStrategy).includes(strategy)) continue

                results[strategy][platform] = {
                  splitText: [content],
                  strategy: strategies,
                  reasoning: `Content is within character limit for ${platform} (${limit} chars). No splitting required.`
                }
              }
            }
          }

          return res.json(results)
        } catch (error) {
          console.error('Error in split post with strategies:', error)
          throw error
        }
      } else {
        // No specific strategies provided, use the first one (SEMANTIC) for simplicity
        const singleStrategy = SplittingStrategy.SEMANTIC

        // Create a result object
        const results: Record<string, Record<string, any>> = {
          [singleStrategy]: {}
        }

        // Generate platform-specific splits using the default strategy
        for (const platform of Object.keys(platformLimits)) {
          const limit = platformLimits[platform]

          // Only split if content exceeds platform limit
          if (content.length > limit) {
            console.log(`Splitting for ${platform} with limit ${limit} using default strategy`)
            const platformResult = await splitPost(
              content,
              limit,
              singleStrategy // Using just the single strategy in this case
            )

            results[singleStrategy][platform] = platformResult
          } else {
            // No splitting needed
            results[singleStrategy][platform] = {
              splitText: [content],
              strategy: singleStrategy,
              reasoning: `Content is within character limit for ${platform} (${limit} chars). No splitting required.`
            }
          }
        }

        return res.json(results)
      }
    } catch (error: any) {
      console.error('Error in split-post endpoint:', error)

      // Construct a detailed error response
      const errorResponse: Record<string, any> = {
        message: 'Failed to split post',
        error: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN_ERROR',
        type: error.type || 'SERVER_ERROR',
        param: error.param || null
      }

      // Add user-friendly suggestion based on error code
      if (error.code === 'invalid_api_key' || error.code === 'missing_api_key') {
        errorResponse.suggestion = 'Please check that your OpenAI API key is correctly configured.'
      } else if (error.code === 'rate_limit_exceeded') {
        errorResponse.suggestion = 'Please wait a few moments and try again.'
      } else if (error.code === 'insufficient_quota') {
        errorResponse.suggestion = 'Please check your OpenAI account billing or usage limits.'
      }

      // Add specific error handling for common OpenAI API issues
      if (error.response && error.response.status) {
        errorResponse.statusCode = error.response.status

        if (error.response.status === 401) {
          errorResponse.message = 'OpenAI API authentication error. Please check API key.'
        } else if (error.response.status === 429) {
          errorResponse.message = 'OpenAI API rate limit exceeded. Please try again later.'
        } else if (error.response.status === 500) {
          errorResponse.message = 'OpenAI API server error. The service might be experiencing issues.'
        }

        // Include any data from the response
        if (error.response.data) {
          errorResponse.details = error.response.data
        }
      }

      res.status(500).json(errorResponse)
    }
  })

  // AI Post Optimization for specific platform
  app.post(`${API_PREFIX}/optimize-post`, async (req: Request, res: Response) => {
    try {
      // Verify the OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          message: 'OpenAI API key is missing',
          error: 'The OpenAI API key is not configured. Add OPENAI_API_KEY to your environment variables.',
          code: 'missing_api_key',
          suggestion: 'Please check that your OpenAI API key is correctly configured.'
        })
      }

      const { content, platform, customMastodonLimit } = req.body

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ message: 'Content is required and must be a string' })
      }

      if (!platform || typeof platform !== 'string') {
        return res.status(400).json({ message: 'Platform is required and must be a string' })
      }

      // Get character limit for the platform
      const platformLimits: Record<string, number> = {
        bluesky: 300,
        mastodon:
          customMastodonLimit && !isNaN(Number.parseInt(customMastodonLimit))
            ? Number.parseInt(customMastodonLimit)
            : 500,
        threads: 500
        // Nostr support removed
      }

      const characterLimit = platformLimits[platform] || 500

      const optimizedContent = await optimizePost(content, platform, characterLimit)
      res.json({ optimized: optimizedContent })
    } catch (error: any) {
      console.error('Error in optimize-post endpoint:', error)

      // Construct a detailed error response
      const errorResponse: Record<string, any> = {
        message: 'Failed to optimize post',
        error: error.message || 'Unknown error',
        code: error.code || 'UNKNOWN_ERROR',
        type: error.type || 'SERVER_ERROR',
        param: error.param || null
      }

      // Add user-friendly suggestion based on error code
      if (error.code === 'invalid_api_key' || error.code === 'missing_api_key') {
        errorResponse.suggestion = 'Please check that your OpenAI API key is correctly configured.'
      } else if (error.code === 'rate_limit_exceeded') {
        errorResponse.suggestion = 'Please wait a few moments and try again.'
      } else if (error.code === 'insufficient_quota') {
        errorResponse.suggestion = 'Please check your OpenAI account billing or usage limits.'
      }

      // Add specific error handling for common OpenAI API issues
      if (error.response && error.response.status) {
        errorResponse.statusCode = error.response.status

        if (error.response.status === 401) {
          errorResponse.message = 'OpenAI API authentication error. Please check API key.'
        } else if (error.response.status === 429) {
          errorResponse.message = 'OpenAI API rate limit exceeded. Please try again later.'
        } else if (error.response.status === 500) {
          errorResponse.message = 'OpenAI API server error. The service might be experiencing issues.'
        }

        // Include any data from the response
        if (error.response.data) {
          errorResponse.details = error.response.data
        }
      }

      res.status(500).json(errorResponse)
    }
  })

  const httpServer = createServer(app)
  return httpServer
}
