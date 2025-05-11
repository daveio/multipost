import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a custom render function that includes the QueryClientProvider
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0, // Use gcTime instead of cacheTime in v5
    },
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  { 
    queryClient = createTestQueryClient(),
    ...renderOptions 
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Export everything from testing-library 
export * from '@testing-library/react';

// Common test mocks for our components
export const mockPlatforms = [
  { 
    id: 'bluesky', 
    name: 'Bluesky', 
    icon: 'bluesky',
    characterLimit: 300,
    accounts: []
  },
  { 
    id: 'mastodon', 
    name: 'Mastodon', 
    icon: 'mastodon',
    characterLimit: 500,
    accounts: []
  },
  { 
    id: 'threads', 
    name: 'Threads', 
    icon: 'threads',
    characterLimit: 500,
    accounts: []
  }
];

export const mockAccounts = [
  { id: 1, platformId: 'bluesky', username: 'user1', isActive: true },
  { id: 2, platformId: 'mastodon', username: 'user2', isActive: true },
  { id: 3, platformId: 'threads', username: 'user3', isActive: true }
];

export const mockDrafts = [
  { id: 1, content: 'Draft 1 content', mediaFiles: [], createdAt: new Date().toISOString() },
  { id: 2, content: 'Draft 2 content', mediaFiles: [], createdAt: new Date().toISOString() }
];

export const mockMediaFiles = [
  { id: 'media1', url: 'https://example.com/image1.jpg', type: 'image/jpeg', name: 'image1.jpg', size: 1024 }
];

export const mockThreadPosts = [
  { content: 'First thread post', index: 0 },
  { content: 'Second thread post', index: 1 }
];