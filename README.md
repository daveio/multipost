# Multipost: Cross-Platform Social Media Publisher

Multipost is a comprehensive web application for intelligent content sharing across multiple social media platforms. It provides AI-powered post optimization, thread creation, and content splitting capabilities to help users create the perfect content for different social platforms.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Data Models](#data-models)
6. [Frontend Components](#frontend-components)
7. [Backend Services](#backend-services)
8. [AI Integration](#ai-integration)
9. [State Management](#state-management)
10. [Thread Management](#thread-management)
11. [Installation & Setup](#installation--setup)
12. [Configuration](#configuration)
13. [API Reference](#api-reference)
14. [Workflow States](#workflow-states)
15. [Error Handling](#error-handling)
16. [Screenshots & UI Components](#screenshots--ui-components)

## Overview

Multipost enables users to compose and publish content simultaneously to multiple social platforms, including Bluesky, Mastodon, and Threads. The application handles different character limits for each platform, provides real-time previews, and offers AI-powered post splitting using OpenAI GPT-4o to optimize content for each network's requirements.

## Features

- **Multi-Platform Publishing**: Post to Bluesky, Mastodon, and Threads with a single click
- **Real-Time Character Counting**: Visualize character limits for each platform
- **Platform-Specific Previews**: See how posts will appear on each platform
- **AI-Powered Content Splitting**: Uses OpenAI GPT-4o to intelligently split long posts
- **Multiple Splitting Strategies**:
  - Semantic splitting (by meaning/context)
  - Sentence-based splitting
  - Hashtag retention
  - Mention preservation
- **Thread Management**: Create, preview, and navigate multi-post threads
- **Media Support**: Upload and attach media files to posts
- **Draft Saving**: Save posts as drafts for later editing
- **Platform Account Selection**: Choose which accounts to post to on each platform
- **Advanced Configuration**: Customize post appearance and behavior
- **Configuration Persistence**: Save and load splitting configurations

## Architecture

Multipost is built using a modern web stack:

### Frontend
- **React**: UI component library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **shadcn/ui**: Component library with a clean, modern design
- **React Query**: Data fetching and state management
- **wouter**: Lightweight routing solution

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **OpenAI API**: For AI-powered content processing
- **Memory Storage**: In-memory data store for drafts, posts, and user accounts

### Development Tools
- **Vite**: Frontend build tool
- **drizzle-orm**: Database ORM
- **Zod**: Schema validation

## Directory Structure

```
├── client/                  # Frontend code
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility functions and services
│   │   ├── pages/           # Page components
│   │   ├── types/           # TypeScript type definitions
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
├── server/                  # Backend code
│   ├── services/            # Service modules
│   │   └── openaiService.ts # OpenAI integration
│   ├── index.ts             # Main server entry point
│   ├── routes.ts            # API route definitions
│   └── storage.ts           # Data storage implementation
└── shared/                  # Shared code between frontend/backend
    └── schema.ts            # Data models and schemas
```

## Data Models

### Core Models

#### User
```typescript
{
  id: number;
  username: string;
  password: string;
}
```

#### Account
```typescript
{
  id: number;
  userId: number;
  platformId: string;        // 'bluesky', 'mastodon', 'threads'
  username: string;
  displayName: string;
  avatarUrl: string;
  instanceUrl: string;       // For Mastodon
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  isActive: boolean;
}
```

#### Draft
```typescript
{
  id: number;
  userId: number;
  content: string;
  mediaFiles: MediaFile[];
  platforms: Platform[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Post
```typescript
{
  id: number;
  userId: number;
  content: string;
  mediaFiles: MediaFile[];
  platforms: Platform[];
  status: string;        // 'pending', 'published', 'failed'
  createdAt: Date;
}
```

#### MediaFile
```typescript
{
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
}
```

#### Platform
```typescript
{
  id: string;           // 'bluesky', 'mastodon', 'threads'
  isSelected: boolean;
  accounts?: number[];  // Account IDs
}
```

#### ThreadPost
```typescript
{
  id: string;
  content: string;
  index: number;
}
```

#### CharacterStat
```typescript
{
  platform: string;
  current: number;
  limit: number;
  percent: number;
}
```

#### SplittingStrategy
```typescript
enum SplittingStrategy {
  SEMANTIC = "semantic",           // Split by meaningful semantic chunks
  SENTENCE = "sentence",           // Split by sentences
  RETAIN_HASHTAGS = "retain_hashtags",  // Ensure hashtags are preserved
  PRESERVE_MENTIONS = "preserve_mentions"  // Make sure @mentions stay intact
}
```

#### SplittingConfig
```typescript
{
  name: string;
  strategies: SplittingStrategy[];
  id?: string;
  timestamp?: number;
}
```

#### AdvancedOptions
```typescript
{
  useThreadNotation: boolean;
  threadNotationFormat: string;
  showRawJson: boolean;
  customMastodonLimit: number;
  showReasoning: boolean;
}
```

## Frontend Components

### Main Components

#### PostComposer
The central component for creating posts. Manages content, platform selection, and posting actions.

```typescript
interface PostComposerProps {
  content: string;
  mediaFiles: MediaFile[];
  characterStats: CharacterStat[];
  selectedPlatforms: { id: string; isSelected: boolean; accounts?: number[] }[];
  advancedOptions: AdvancedOptions;
  isPendingDraft: boolean;
  isPendingPost: boolean;
  isPendingUpload: boolean;
  isFormValid: boolean;
  threadPosts: ThreadPost[];
  isThreadMode: boolean;
  activeThreadIndex: number;
  onContentChange: (content: string) => void;
  onTogglePlatform: (platformId: string) => void;
  onAdvancedOptionsChange: (options: Partial<AdvancedOptions>) => void;
  onUploadFiles: (files: File[]) => void;
  onRemoveMediaFile: (fileId: string) => void;
  onSaveAsDraft: () => void;
  onSubmitPost: () => void;
  onResetForm: () => void;
  onSwitchThreadPost: (index: number) => void;
  onAddThreadPost: (content?: string) => void;
  onRemoveThreadPost: (index: number) => void;
  onExitThreadMode: () => void;
  onApplySplit?: (strategy: SplittingStrategy, platformId: string, splitText: string[]) => void;
  accounts?: Account[];
}
```

#### ThreadPostsManager
Manages thread creation, editing, and navigation.

```typescript
interface ThreadPostsManagerProps {
  threadPosts: ThreadPost[];
  activeIndex: number;
  onSwitchPost: (index: number) => void;
  onAddPost: (content?: string) => void;
  onRemovePost: (index: number) => void;
  onContentChange: (content: string) => void;
  onExit: () => void;
}
```

#### AISplitPreview
Displays AI-generated splitting options for long content.

```typescript
interface AISplitPreviewProps {
  content: string;
  isOpen: boolean;
  accounts: Account[];
  characterStats: CharacterStat[];
  onClose: () => void;
  onApplySplit: (strategy: SplittingStrategy, platformId: string, splitText: string[]) => void;
  advancedOptions?: {
    showRawJson?: boolean;
    [key: string]: any;
  };
}
```

#### PlatformPreview
Shows how content will appear on different platforms.

```typescript
interface PlatformPreviewProps {
  content: string;
  mediaFiles: MediaFile[];
  activeTab: string;
  accounts: Account[];
  onTabChange: (tab: string) => void;
}
```

#### PlatformCard
Displays a platform with toggle functionality.

```typescript
interface PlatformCardProps {
  platform: Platform;
  charCount: number;
  active: boolean;
  onToggle: (platformId: string) => void;
}
```

#### SplitWithAIButton
Button to trigger AI splitting for long content.

```typescript
interface SplitWithAIButtonProps {
  content: string;
  isContentTooLong: boolean;
  accounts: Account[];
  characterStats: CharacterStat[];
  onApplySplit: (strategy: SplittingStrategy, platformId: string, splitText: string[]) => void;
  advancedOptions?: {
    showRawJson?: boolean;
    [key: string]: any;
  };
}
```

#### SavedSplittingConfigs
Manages saved AI splitting configurations.

```typescript
interface SavedSplittingConfigsProps {
  selectedStrategies: SplittingStrategy[];
  savedConfigs: SplittingConfig[];
  onSaveConfig: (name: string) => void;
  onLoadConfig: (config: SplittingConfig) => void;
  onDeleteConfig: (configName: string) => void;
}
```

### Custom Hooks

#### usePostForm
Manages form state for creating and editing posts.

```typescript
interface UsePostFormProps {
  initialContent?: string;
  initialPlatforms?: { id: string; isSelected: boolean }[];
  initialMediaFiles?: MediaFile[];
  initialAdvancedOptions?: Partial<AdvancedOptions>;
}
```

Returns:
```typescript
{
  formState: PostFormState;
  accounts: Account[];
  drafts: Draft[];
  isFormValid: boolean;
  isPendingDraft: boolean;
  isPendingPost: boolean;
  isPendingUpload: boolean;
  updateContent: (content: string) => void;
  updateAdvancedOptions: (options: Partial<AdvancedOptions>) => void;
  togglePlatform: (platformId: string) => void;
  toggleAccount: (platformId: string, accountId: number) => void;
  uploadFiles: (files: File[]) => void;
  removeMediaFile: (fileId: string) => void;
  saveAsDraft: () => void;
  submitPost: () => void;
  loadDraft: (draftId: number) => void;
  deleteDraft: (draftId: number) => void;
  resetForm: () => void;
  setActivePreviewTab: (tab: string) => void;
  setupThread: (posts: string[]) => void;
  switchThreadPost: (index: number) => void;
  addThreadPost: (content?: string) => void;
  removeThreadPost: (index: number) => void;
  exitThreadMode: () => void;
}
```

#### useToast
Manages toast notifications.

## Backend Services

### API Routes

- **GET /api/user**: Get the current user
- **GET /api/accounts**: Get all accounts for the current user
- **GET /api/accounts/:platformId**: Get accounts for a specific platform
- **GET /api/drafts**: Get all drafts for the current user
- **GET /api/drafts/:id**: Get a specific draft
- **POST /api/drafts**: Create a new draft
- **PUT /api/drafts/:id**: Update a draft
- **DELETE /api/drafts/:id**: Delete a draft
- **POST /api/posts**: Create and publish a post
- **GET /api/platforms/character-limits**: Get character limits for each platform
- **POST /api/upload**: Upload media files
- **POST /api/split-post**: Split a post using AI
- **POST /api/optimize-post**: Optimize a post for a specific platform

### OpenAI Service

The `openaiService.ts` handles AI-powered post splitting and optimization.

#### Main Functions:

- **splitPost**: Splits a post into multiple posts based on selected strategies
- **generateSplittingOptions**: Generates different splitting options
- **optimizePost**: Optimizes a post for a specific platform

## AI Integration

The application uses OpenAI's GPT-4o model to split and optimize content:

1. When a post exceeds character limits, the user can click "Split with AI"
2. Multiple splitting strategies can be selected simultaneously:
   - Semantic splitting (keeping related content together)
   - Sentence splitting (at natural sentence boundaries)
   - Hashtag retention (keeping hashtags intact)
   - Mention preservation (ensuring @mentions stay together)
3. The AI considers all selected strategies together rather than applying them individually
4. Thread optimization is included in all strategies by default
5. The AI provides reasoning for its splits which can be displayed to the user
6. Multiple splitting options can be saved and loaded

### OpenAI API Integration

The application uses OpenAI's GPT-4o model for several key features:

1. **API Key Management**:
   - The application checks for the presence of the OpenAI API key at server startup
   - Key validation happens before making API requests
   - Detailed error messages for missing or invalid keys

2. **Error Handling**:
   - Comprehensive error handling for OpenAI API responses
   - User-friendly error messages with suggestions for resolution
   - Specific handling for common errors (rate limits, quota exceeded)
   - Detailed error logging for debugging

3. **GPT-4o Prompt Engineering**:
   - Structured system prompts that combine multiple splitting strategies
   - JSON response formatting for consistent parsing
   - Thread optimization instructions built into every prompt
   - Character limit enforcement based on platform requirements
 
4. **Response Validation**:
   - Safety checks for malformed API responses
   - Handling for unexpected response formats
   - Fallback mechanisms for failed requests
   - Structured error propagation to client

## State Management

Post form state is managed through the `usePostForm` hook, which handles:

1. Content updates
2. Platform selection
3. Media file uploads
4. Draft saving/loading
5. Post submission
6. Advanced options
7. Thread management

Local storage is used to persist:
- Advanced options
- Custom character limits
- Splitting configurations
- Thread state

## Thread Management

Thread creation and management is handled through:

1. **ThreadPostsManager**: UI component for thread navigation and editing
2. **usePostForm.setupThread**: Converts a single post into a thread
3. **Thread State**: Maintained in both component state and localStorage
4. **Event Handling**: All thread-related buttons use proper event handling to prevent form submission

Thread functionality includes:
- Creating threads from scratch
- Converting long posts into threads using AI
- Adding/removing thread posts
- Navigating between posts
- Previewing complete threads
- Exiting thread mode safely

## Installation & Setup

### Prerequisites
- Node.js (v14+)
- npm (v6+)
- OpenAI API key (for AI-powered features)

### Installation Steps
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file with the following:
     ```
     OPENAI_API_KEY=your_openai_api_key
     ```
   - Or use Replit's Secrets management to add the OPENAI_API_KEY
4. Start the development server:
   ```
   npm run dev
   ```

### OpenAI API Key
The application requires an OpenAI API key for AI-powered features:
- Post splitting based on character limits
- Content optimization for different platforms

If the OpenAI API key is missing or invalid, the application will:
1. Log an error message on the server
2. Return detailed error responses from API endpoints
3. Display user-friendly error messages in the UI
4. Include suggestions for fixing the issue

To obtain an OpenAI API key:
1. Create an account at [OpenAI](https://openai.com/)
2. Navigate to API key management
3. Generate a new API key
4. Add it to your environment as OPENAI_API_KEY

## Configuration

### Platform Configuration
Platform settings are defined in `client/src/lib/platform-config.ts`:

```typescript
export const DEFAULT_PLATFORMS: Platform[] = [
  {
    id: 'bluesky',
    isSelected: true,
  },
  {
    id: 'mastodon',
    isSelected: true,
  },
  {
    id: 'threads',
    isSelected: true,
  }
];

export const PLATFORM_CHARACTER_LIMITS: Record<string, number> = {
  bluesky: 300,
  mastodon: 500,
  threads: 500,
};
```

### Advanced Options
Advanced options are stored in localStorage:
- Thread notation format: ${index+1}/${total}
- Custom Mastodon character limit
- Show AI reasoning toggle
- Raw JSON display toggle

## API Reference

### POST /api/split-post
Split a post using AI.

Request:
```json
{
  "content": "Long post content to split...",
  "strategies": ["semantic", "sentence", "retain_hashtags", "preserve_mentions"],
  "customMastodonLimit": 500
}
```

Success Response:
```json
{
  "semantic": {
    "bluesky": {
      "splitText": ["Part 1...", "Part 2..."],
      "strategy": "semantic",
      "reasoning": "Split explanation..."
    },
    "mastodon": {
      "splitText": ["Part 1...", "Part 2..."],
      "strategy": "semantic",
      "reasoning": "Split explanation..."
    }
  },
  "sentence": {
    // Similar structure
  }
}
```

Error Response:
```json
{
  "message": "Failed to split post",
  "error": "Invalid OpenAI API key provided. Please check your API key.",
  "code": "invalid_api_key",
  "suggestion": "Please check that your OpenAI API key is correctly configured."
}
```

Error codes include:
- `invalid_api_key`: The OpenAI API key is invalid
- `missing_api_key`: The OpenAI API key is not configured
- `rate_limit_exceeded`: Too many requests to OpenAI API in a short time
- `insufficient_quota`: OpenAI API usage quota has been exceeded

### POST /api/optimize-post
Optimize a post for a specific platform.

Request:
```json
{
  "content": "Long post content to optimize...",
  "platform": "bluesky",
  "customMastodonLimit": 500
}
```

Success Response:
```json
{
  "optimized": "Optimized content for the specified platform..."
}
```

Error Response:
```json
{
  "message": "Failed to optimize post",
  "error": "OpenAI rate limit exceeded. Please try again after a short wait.",
  "code": "rate_limit_exceeded",
  "suggestion": "Please wait a few moments and try again."
}
```

### POST /api/posts
Publish a post.

Request:
```json
{
  "content": "Post content",
  "mediaFiles": [],
  "platforms": [
    {
      "id": "bluesky",
      "isSelected": true,
      "accounts": [1]
    }
  ]
}
```

Response:
```json
{
  "id": 1,
  "content": "Post content",
  "status": "published",
  "createdAt": "2025-05-11T12:30:45.123Z"
}
```

## Workflow States

The application includes a workflow named 'Start application' that runs `npm run dev`, which starts both the Express server for the backend and the Vite server for the frontend.

## Error Handling

The application provides comprehensive error handling:

1. **API Errors**: Detailed error messages from the backend
2. **OpenAI Errors**: Enhanced error handling for API key issues, rate limits, etc.
   - Missing API key detection
   - Invalid API key handling
   - Rate limit exceeded notifications
   - Quota exceeded warnings
   - Detailed error explanations with suggestions
3. **Validation Errors**: Form validation using Zod schemas
4. **UI Feedback**: Toast notifications for success/error states
5. **Thread Navigation**: Safe handling of thread state to prevent data loss
   - Event propagation control (preventDefault, stopPropagation)
   - Timeout separation between content updates and form submissions
   - Explicit button type declarations

## Screenshots & UI Components

The UI is built with a clean, modern design using shadcn/ui components:

1. **Main Composer**: Text area with character counting and platform selection
2. **Platform Cards**: Visual toggles for each platform
3. **AI Split Preview**: Interactive display of splitting options
4. **Thread Manager**: Navigation and editing interface for thread posts
5. **Platform Preview**: Tabs showing how content will appear on each platform
6. **Drafts List**: Saved drafts with load/delete options

---

This README provides a comprehensive overview of the Multipost application. For specific implementation details, refer to the codebase.