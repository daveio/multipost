import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePostForm } from './use-post-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type JSX } from 'react';

// Mock queryClient module
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
    getQueryData: vi.fn(), 
    setQueryData: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Mock toast hook
vi.mock('./use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

// Create a custom wrapper with QueryClientProvider
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  
  return ({ children }: { children: JSX.Element }) => {
    return (
      // @ts-ignore - JSX errors with testing library are common, but the tests run fine
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('usePostForm hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear.mockClear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePostForm(), {
      wrapper: createWrapper()
    });
    
    expect(result.current.formState.content).toBe('');
    expect(result.current.formState.mediaFiles).toEqual([]);
    expect(result.current.isFormValid).toBe(false);
  });

  it('should update content correctly', () => {
    const { result } = renderHook(() => usePostForm(), {
      wrapper: createWrapper()
    });
    
    // Set content
    act(() => {
      result.current.updateContent('New content');
    });
    
    expect(result.current.formState.content).toBe('New content');
  });

  it('should toggle platform selection', () => {
    const initialPlatforms = [
      { id: 'bluesky', isSelected: true },
      { id: 'mastodon', isSelected: false }
    ];
    
    const { result } = renderHook(() => usePostForm({ 
      initialPlatforms 
    }), {
      wrapper: createWrapper()
    });
    
    // Find mastodon platform to toggle
    const mastodonPlatform = result.current.formState.selectedPlatforms
      .find(p => p.id === 'mastodon');
    
    if (mastodonPlatform) {
      // Toggle mastodon to selected
      act(() => {
        result.current.togglePlatform('mastodon');
      });
      
      // Check that mastodon is now selected
      const updatedMastodonPlatform = result.current.formState.selectedPlatforms
        .find(p => p.id === 'mastodon');
        
      expect(updatedMastodonPlatform?.isSelected).toBe(true);
    }
  });

  it('should handle advanced options', () => {
    const { result } = renderHook(() => usePostForm(), {
      wrapper: createWrapper()
    });
    
    const newOptions = { showReasoningInUI: true };
    
    act(() => {
      result.current.updateAdvancedOptions(newOptions);
    });
    
    expect(result.current.formState.advancedOptions).toMatchObject(newOptions);
  });

  it('should reset the form correctly', () => {
    const { result } = renderHook(() => usePostForm({
      initialContent: 'Test content'
    }), {
      wrapper: createWrapper()
    });
    
    expect(result.current.formState.content).toBe('Test content');
    
    act(() => {
      result.current.resetForm();
    });
    
    expect(result.current.formState.content).toBe('');
  });
});