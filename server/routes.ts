import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  mediaFileSchema,
  platformSchema,
  insertDraftSchema,
  insertPostSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  generateSplittingOptions, 
  optimizePost, 
  SplittingStrategy 
} from "./services/openaiService";

export async function registerRoutes(app: Express): Promise<Server> {
  const API_PREFIX = "/api";
  
  // User route - Get current demo user
  app.get(`${API_PREFIX}/user`, async (req: Request, res: Response) => {
    // For demo purposes, always return the first user
    const user = await storage.getUser(1);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Don't return the password
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Accounts routes
  app.get(`${API_PREFIX}/accounts`, async (req: Request, res: Response) => {
    const accounts = await storage.getAccounts(1); // Use demo user
    res.json(accounts);
  });
  
  app.get(`${API_PREFIX}/accounts/:platformId`, async (req: Request, res: Response) => {
    const { platformId } = req.params;
    const accounts = await storage.getAccountsByPlatform(1, platformId); // Use demo user
    res.json(accounts);
  });
  
  // Drafts routes
  app.get(`${API_PREFIX}/drafts`, async (req: Request, res: Response) => {
    const drafts = await storage.getDrafts(1); // Use demo user
    res.json(drafts);
  });
  
  app.get(`${API_PREFIX}/drafts/:id`, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const draft = await storage.getDraft(id);
    
    if (!draft) {
      return res.status(404).json({ message: "Draft not found" });
    }
    
    res.json(draft);
  });
  
  app.post(`${API_PREFIX}/drafts`, async (req: Request, res: Response) => {
    try {
      const validatedData = insertDraftSchema.parse({
        ...req.body,
        userId: 1 // Use demo user
      });
      
      const draft = await storage.createDraft(validatedData);
      res.status(201).json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid draft data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create draft" });
    }
  });
  
  app.put(`${API_PREFIX}/drafts/:id`, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const draft = await storage.getDraft(id);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      const validatedData = insertDraftSchema.partial().parse(req.body);
      const updatedDraft = await storage.updateDraft(id, validatedData);
      res.json(updatedDraft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid draft data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update draft" });
    }
  });
  
  app.delete(`${API_PREFIX}/drafts/:id`, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteDraft(id);
    
    if (!success) {
      return res.status(404).json({ message: "Draft not found" });
    }
    
    res.status(204).send();
  });
  
  // Posts routes
  app.post(`${API_PREFIX}/posts`, async (req: Request, res: Response) => {
    try {
      const validatedData = insertPostSchema.parse({
        ...req.body,
        userId: 1 // Use demo user
      });
      
      const post = await storage.createPost(validatedData);
      
      // Simulate posting to platforms
      setTimeout(async () => {
        await storage.updatePostStatus(post.id, "completed");
      }, 2000);
      
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });
  
  // Platform character limits
  app.get(`${API_PREFIX}/platforms/character-limits`, (req: Request, res: Response) => {
    res.json({
      bluesky: 300,
      mastodon: 500,
      threads: 500,
      nostr: 1000
    });
  });
  
  // Upload route for media files
  app.post(`${API_PREFIX}/upload`, (req: Request, res: Response) => {
    // This is a mock implementation
    // In a real app, we would handle file uploads using multer or similar
    
    // We're returning hardcoded URLs for demonstration purposes
    try {
      const { files } = req.body;
      
      if (!Array.isArray(files)) {
        return res.status(400).json({ message: "Files array is required" });
      }
      
      const processedFiles = files.map((file, index) => {
        return {
          id: `file-${Date.now()}-${index}`,
          name: file.name,
          type: file.type,
          size: file.size,
          url: `https://images.unsplash.com/photo-${150000000000 + index}`,
          previewUrl: `https://images.unsplash.com/photo-${150000000000 + index}?w=200&h=200`
        };
      });
      
      res.status(201).json(processedFiles);
    } catch (error) {
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
