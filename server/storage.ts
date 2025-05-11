import {
  users, accounts, drafts, posts,
  type User, type InsertUser,
  type Account, type InsertAccount,
  type Draft, type InsertDraft,
  type Post, type InsertPost,
  type MediaFile, type Platform
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Account methods
  getAccounts(userId: number): Promise<Account[]>;
  getAccountsByPlatform(userId: number, platformId: string): Promise<Account[]>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Draft methods
  getDrafts(userId: number): Promise<Draft[]>;
  getDraft(id: number): Promise<Draft | undefined>;
  createDraft(draft: InsertDraft): Promise<Draft>;
  updateDraft(id: number, draft: Partial<InsertDraft>): Promise<Draft | undefined>;
  deleteDraft(id: number): Promise<boolean>;
  
  // Post methods
  getPosts(userId: number): Promise<Post[]>;
  getPost(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePostStatus(id: number, status: string): Promise<Post | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private accounts: Map<number, Account>;
  private drafts: Map<number, Draft>;
  private posts: Map<number, Post>;
  private currentUserId: number;
  private currentAccountId: number;
  private currentDraftId: number;
  private currentPostId: number;

  constructor() {
    this.users = new Map();
    this.accounts = new Map();
    this.drafts = new Map();
    this.posts = new Map();
    this.currentUserId = 1;
    this.currentAccountId = 1;
    this.currentDraftId = 1;
    this.currentPostId = 1;
    
    // Create a demo user
    const demoUser: User = {
      id: this.currentUserId++,
      username: "demo",
      password: "password"
    };
    this.users.set(demoUser.id, demoUser);
    
    // Create some demo accounts
    this.createDemoAccounts(demoUser.id);
    
    // Create some demo drafts
    this.createDemoDrafts(demoUser.id);
  }
  
  private createDemoAccounts(userId: number) {
    const platforms = ["bluesky", "mastodon", "threads"];
    const instances = ["", "mastodon.social", ""];
    
    platforms.forEach((platform, index) => {
      const account: Account = {
        id: this.currentAccountId++,
        userId,
        platformId: platform,
        username: `user_${platform}`,
        displayName: `Demo ${platform.charAt(0).toUpperCase() + platform.slice(1)} User`,
        avatarUrl: "",
        instanceUrl: instances[index],
        accessToken: "",
        refreshToken: "",
        expiresAt: null,
        isActive: true
      };
      
      this.accounts.set(account.id, account);
    });
    
    // Add a second Mastodon account
    const secondMastodonAccount: Account = {
      id: this.currentAccountId++,
      userId,
      platformId: "mastodon",
      username: "user_mastodon_2",
      displayName: "Demo Mastodon User 2",
      avatarUrl: "",
      instanceUrl: "fosstodon.org",
      accessToken: "",
      refreshToken: "",
      expiresAt: null,
      isActive: true
    };
    
    this.accounts.set(secondMastodonAccount.id, secondMastodonAccount);
  }
  
  private createDemoDrafts(userId: number) {
    const draftContent = [
      "Just finished working on the new project, excited to share some details about the implementation...",
      "Conference notes from today: Some really interesting insights about distributed systems..."
    ];
    
    draftContent.forEach((content, index) => {
      const draft: Draft = {
        id: this.currentDraftId++,
        userId,
        content,
        mediaFiles: index === 0 ? [
          {
            id: "media1",
            name: "nature.jpg",
            type: "image/jpeg",
            size: 1200000,
            url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            previewUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200"
          },
          {
            id: "media2",
            name: "city.jpg",
            type: "image/jpeg",
            size: 1500000,
            url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df",
            previewUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200"
          }
        ] : [],
        platforms: [
          { id: "bluesky", isSelected: true, accounts: [1] },
          { id: "mastodon", isSelected: true, accounts: [2, 5] },
          { id: "threads", isSelected: index === 0, accounts: [3] }
        ],
        createdAt: new Date(Date.now() - (index === 0 ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)),
        updatedAt: new Date(Date.now() - (index === 0 ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000))
      };
      
      this.drafts.set(draft.id, draft);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Account methods
  async getAccounts(userId: number): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId
    );
  }
  
  async getAccountsByPlatform(userId: number, platformId: string): Promise<Account[]> {
    return Array.from(this.accounts.values()).filter(
      (account) => account.userId === userId && account.platformId === platformId
    );
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.currentAccountId++;
    const newAccount: Account = { ...account, id };
    this.accounts.set(id, newAccount);
    return newAccount;
  }
  
  async updateAccount(id: number, account: Partial<InsertAccount>): Promise<Account | undefined> {
    const existingAccount = this.accounts.get(id);
    if (!existingAccount) return undefined;
    
    const updatedAccount = { ...existingAccount, ...account };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }
  
  // Draft methods
  async getDrafts(userId: number): Promise<Draft[]> {
    return Array.from(this.drafts.values())
      .filter((draft) => draft.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }
  
  async getDraft(id: number): Promise<Draft | undefined> {
    return this.drafts.get(id);
  }
  
  async createDraft(draft: InsertDraft): Promise<Draft> {
    const id = this.currentDraftId++;
    const now = new Date();
    const newDraft: Draft = { 
      ...draft, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.drafts.set(id, newDraft);
    return newDraft;
  }
  
  async updateDraft(id: number, draft: Partial<InsertDraft>): Promise<Draft | undefined> {
    const existingDraft = this.drafts.get(id);
    if (!existingDraft) return undefined;
    
    const updatedDraft = { 
      ...existingDraft, 
      ...draft,
      updatedAt: new Date()
    };
    this.drafts.set(id, updatedDraft);
    return updatedDraft;
  }
  
  async deleteDraft(id: number): Promise<boolean> {
    return this.drafts.delete(id);
  }
  
  // Post methods
  async getPosts(userId: number): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter((post) => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getPost(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }
  
  async createPost(post: InsertPost): Promise<Post> {
    const id = this.currentPostId++;
    const newPost: Post = { 
      ...post, 
      id,
      status: "pending",
      createdAt: new Date()
    };
    this.posts.set(id, newPost);
    return newPost;
  }
  
  async updatePostStatus(id: number, status: string): Promise<Post | undefined> {
    const existingPost = this.posts.get(id);
    if (!existingPost) return undefined;
    
    const updatedPost = { ...existingPost, status };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }
}

export const storage = new MemStorage();
