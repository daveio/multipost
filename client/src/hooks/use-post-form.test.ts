// @ts-nocheck
/* This file is intentionally not type-checked because of JSX errors with testing components */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePostForm } from './use-post-form';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

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
const createTestWrapper = () => {
  // Create a new QueryClient for each test
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  
  // @ts-ignore - We need to use @ts-ignore here because the JSX in test files causes type errors
  const Wrapper = ({ children }) => {
    // @ts-ignore
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
  
  return Wrapper;
};

describe('usePostForm hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear.mockClear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePostForm(), {
      wrapper: createTestWrapper()
    });
    
    expect(result.current.formState.content).toBe('');
    expect(result.current.formState.mediaFiles).toEqual([]);
    expect(result.current.isFormValid).toBe(false);
  });

  it('should update content correctly', () => {
    const { result } = renderHook(() => usePostForm(), {
      wrapper: createTestWrapper()
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
    
    const newOptions = { showReasoning: true };
    
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