import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from './storage';
import type { InsertDraft, InsertAccount } from '@shared/schema';

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User operations', () => {
    it('should get a user by ID', async () => {
      const user = await storage.getUser(1);
      expect(user).not.toBeUndefined();
      expect(user?.id).toBe(1);
    });

    it('should get a user by username', async () => {
      const user = await storage.getUserByUsername('demo');
      expect(user).not.toBeUndefined();
      expect(user?.username).toBe('demo');
    });
  });

  describe('Account operations', () => {
    it('should get all accounts for a user', async () => {
      const accounts = await storage.getAccounts(1);
      expect(accounts).toBeInstanceOf(Array);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0]).toHaveProperty('userId', 1);
    });

    it('should get accounts by platform', async () => {
      const accounts = await storage.getAccountsByPlatform(1, 'bluesky');
      expect(accounts).toBeInstanceOf(Array);
      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0]).toHaveProperty('platformId', 'bluesky');
    });

    it('should create, update and delete an account', async () => {
      // Create new account
      const newAccount: InsertAccount = {
        userId: 1,
        platformId: 'test-platform',
        username: 'test-user',
        displayName: 'Test User',
        avatarUrl: 'https://example.com/avatar.png',
        instanceUrl: 'https://example.com',
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: new Date(),
        isActive: true
      };

      const created = await storage.createAccount(newAccount);
      expect(created).toHaveProperty('id');
      expect(created.username).toBe('test-user');

      // Update account
      const updated = await storage.updateAccount(created.id, { displayName: 'Updated Name' });
      expect(updated).not.toBeUndefined();
      expect(updated?.displayName).toBe('Updated Name');

      // Delete account
      const deleted = await storage.deleteAccount(created.id);
      expect(deleted).toBe(true);

      // Verify it's gone
      const accounts = await storage.getAccountsByPlatform(1, 'test-platform');
      expect(accounts.length).toBe(0);
    });
  });

  describe('Draft operations', () => {
    it('should get all drafts for a user', async () => {
      const drafts = await storage.getDrafts(1);
      expect(drafts).toBeInstanceOf(Array);
      expect(drafts.length).toBeGreaterThan(0);
      expect(drafts[0]).toHaveProperty('userId', 1);
    });

    it('should get a draft by ID', async () => {
      const draft = await storage.getDraft(1);
      expect(draft).not.toBeUndefined();
      expect(draft?.id).toBe(1);
    });

    it('should create, update and delete a draft', async () => {
      // Create new draft
      const newDraft: InsertDraft = {
        userId: 1,
        content: 'Test draft content',
        mediaFiles: [],
        platforms: [{ id: 'bluesky', isSelected: true }],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const created = await storage.createDraft(newDraft);
      expect(created).toHaveProperty('id');
      expect(created.content).toBe('Test draft content');

      // Update draft
      const updated = await storage.updateDraft(created.id, { content: 'Updated content' });
      expect(updated).not.toBeUndefined();
      expect(updated?.content).toBe('Updated content');

      // Delete draft
      const deleted = await storage.deleteDraft(created.id);
      expect(deleted).toBe(true);

      // Verify it's gone
      const draft = await storage.getDraft(created.id);
      expect(draft).toBeUndefined();
    });
  });

  describe('Post operations', () => {
    it('should create and retrieve a post', async () => {
      const newPost = {
        userId: 1,
        content: 'Test post content',
        mediaFiles: [],
        platforms: [{ id: 'bluesky', isSelected: true }]
      };

      const created = await storage.createPost(newPost);
      expect(created).toHaveProperty('id');
      expect(created.content).toBe('Test post content');
      expect(created.status).toBe('pending');

      // Get post by ID
      const post = await storage.getPost(created.id);
      expect(post).not.toBeUndefined();
      expect(post?.id).toBe(created.id);
      expect(post?.content).toBe('Test post content');

      // Update post status
      const updated = await storage.updatePostStatus(created.id, 'published');
      expect(updated).not.toBeUndefined();
      expect(updated?.status).toBe('published');

      // Get all posts for user
      const posts = await storage.getPosts(1);
      expect(posts).toBeInstanceOf(Array);
      expect(posts.some(p => p.id === created.id)).toBe(true);
    });
  });
});