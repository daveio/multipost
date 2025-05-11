import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from './storage';
import type { InsertUser, InsertAccount, InsertDraft, InsertPost } from '../shared/schema';

describe('MemStorage', () => {
  let storage: MemStorage;
  
  beforeEach(() => {
    storage = new MemStorage();
  });
  
  describe('User methods', () => {
    it('should get demo user by id', async () => {
      const user = await storage.getUser(1);
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.username).toBe('demouser');
    });
    
    it('should get demo user by username', async () => {
      const user = await storage.getUserByUsername('demouser');
      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
    });
    
    it('should create a new user', async () => {
      const newUser: InsertUser = {
        username: 'testuser',
        password: 'password123'
      };
      
      const createdUser = await storage.createUser(newUser);
      expect(createdUser.id).toBeGreaterThan(1); // Demo user has ID 1
      expect(createdUser.username).toBe(newUser.username);
      expect(createdUser.password).toBe(newUser.password);
      
      // Verify the user was actually stored
      const retrievedUser = await storage.getUser(createdUser.id);
      expect(retrievedUser).toEqual(createdUser);
    });
  });
  
  describe('Account methods', () => {
    it('should get demo accounts', async () => {
      const accounts = await storage.getAccounts(1);
      expect(accounts.length).toBeGreaterThan(0);
      
      // Check that we have the expected platforms
      const platforms = accounts.map(acc => acc.platformId);
      expect(platforms).toContain('bluesky');
      expect(platforms).toContain('mastodon');
    });
    
    it('should get accounts by platform', async () => {
      const accounts = await storage.getAccountsByPlatform(1, 'mastodon');
      expect(accounts.length).toBeGreaterThan(0);
      
      // All returned accounts should be for the specified platform
      accounts.forEach(account => {
        expect(account.platformId).toBe('mastodon');
      });
    });
    
    it('should create a new account', async () => {
      const newAccount: InsertAccount = {
        userId: 1,
        platformId: 'threads',
        username: 'testuser',
        displayName: 'Test User',
        isActive: true
      };
      
      const createdAccount = await storage.createAccount(newAccount);
      expect(createdAccount.id).toBeDefined();
      expect(createdAccount.platformId).toBe(newAccount.platformId);
      expect(createdAccount.username).toBe(newAccount.username);
      
      // Verify the account was actually stored
      const accounts = await storage.getAccountsByPlatform(1, 'threads');
      expect(accounts.find(acc => acc.id === createdAccount.id)).toBeDefined();
    });
    
    it('should update an account', async () => {
      // First get an account to update
      const accounts = await storage.getAccounts(1);
      const accountToUpdate = accounts[0];
      
      // Update the account
      const updatedAccount = await storage.updateAccount(accountToUpdate.id, {
        displayName: 'Updated Name',
        isActive: !accountToUpdate.isActive
      });
      
      expect(updatedAccount).toBeDefined();
      expect(updatedAccount?.displayName).toBe('Updated Name');
      expect(updatedAccount?.isActive).toBe(!accountToUpdate.isActive);
      
      // Verify the account was actually updated
      const retrievedAccount = (await storage.getAccounts(1))
        .find(acc => acc.id === accountToUpdate.id);
      
      expect(retrievedAccount).toEqual(updatedAccount);
    });
    
    it('should delete an account', async () => {
      // First get an account to delete
      const accounts = await storage.getAccounts(1);
      const accountToDelete = accounts[0];
      
      // Delete the account
      const deleted = await storage.deleteAccount(accountToDelete.id);
      expect(deleted).toBe(true);
      
      // Verify the account was actually deleted
      const accountsAfterDelete = await storage.getAccounts(1);
      expect(accountsAfterDelete.find(acc => acc.id === accountToDelete.id)).toBeUndefined();
    });
  });
  
  describe('Draft methods', () => {
    it('should get demo drafts', async () => {
      const drafts = await storage.getDrafts(1);
      expect(drafts.length).toBeGreaterThan(0);
    });
    
    it('should get a specific draft', async () => {
      // First get all drafts
      const drafts = await storage.getDrafts(1);
      const draftId = drafts[0].id;
      
      // Get the specific draft
      const draft = await storage.getDraft(draftId);
      expect(draft).toBeDefined();
      expect(draft?.id).toBe(draftId);
    });
    
    it('should create a new draft', async () => {
      const newDraft: InsertDraft = {
        userId: 1,
        content: 'Test draft content',
        mediaFiles: []
      };
      
      const createdDraft = await storage.createDraft(newDraft);
      expect(createdDraft.id).toBeDefined();
      expect(createdDraft.content).toBe(newDraft.content);
      
      // Verify the draft was actually stored
      const draft = await storage.getDraft(createdDraft.id);
      expect(draft).toEqual(createdDraft);
    });
    
    it('should update a draft', async () => {
      // First get a draft to update
      const drafts = await storage.getDrafts(1);
      const draftToUpdate = drafts[0];
      
      // Update the draft
      const updatedDraft = await storage.updateDraft(draftToUpdate.id, {
        content: 'Updated content'
      });
      
      expect(updatedDraft).toBeDefined();
      expect(updatedDraft?.content).toBe('Updated content');
      
      // Verify the draft was actually updated
      const draft = await storage.getDraft(draftToUpdate.id);
      expect(draft).toEqual(updatedDraft);
    });
    
    it('should delete a draft', async () => {
      // First get a draft to delete
      const drafts = await storage.getDrafts(1);
      const draftToDelete = drafts[0];
      
      // Delete the draft
      const deleted = await storage.deleteDraft(draftToDelete.id);
      expect(deleted).toBe(true);
      
      // Verify the draft was actually deleted
      const draft = await storage.getDraft(draftToDelete.id);
      expect(draft).toBeUndefined();
    });
  });
  
  describe('Post methods', () => {
    it('should create a new post', async () => {
      const newPost: InsertPost = {
        userId: 1,
        content: 'Test post content',
        mediaFiles: [],
        platforms: [{ id: 'bluesky', isSelected: true }]
      };
      
      const createdPost = await storage.createPost(newPost);
      expect(createdPost.id).toBeDefined();
      expect(createdPost.content).toBe(newPost.content);
      expect(createdPost.status).toBe('pending'); // Default status
      
      // Verify the post was actually stored
      const post = await storage.getPost(createdPost.id);
      expect(post).toEqual(createdPost);
    });
    
    it('should get posts for a user', async () => {
      // Create a post first
      const newPost: InsertPost = {
        userId: 1,
        content: 'Test post for retrieval',
        mediaFiles: [],
        platforms: [{ id: 'bluesky', isSelected: true }]
      };
      
      await storage.createPost(newPost);
      
      // Get all posts
      const posts = await storage.getPosts(1);
      expect(posts.length).toBeGreaterThan(0);
      
      // Check if our post is there
      const foundPost = posts.find(post => post.content === newPost.content);
      expect(foundPost).toBeDefined();
    });
    
    it('should update post status', async () => {
      // Create a post first
      const newPost: InsertPost = {
        userId: 1,
        content: 'Test post for status update',
        mediaFiles: [],
        platforms: [{ id: 'bluesky', isSelected: true }]
      };
      
      const createdPost = await storage.createPost(newPost);
      
      // Update the status
      const updatedPost = await storage.updatePostStatus(createdPost.id, 'published');
      expect(updatedPost).toBeDefined();
      expect(updatedPost?.status).toBe('published');
      
      // Verify the post was actually updated
      const post = await storage.getPost(createdPost.id);
      expect(post?.status).toBe('published');
    });
  });
});