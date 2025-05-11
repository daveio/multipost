import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePostForm } from './use-post-form';
import { apiRequest } from '../lib/queryClient';

// Mock dependencies
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn()
  }
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('usePostForm hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePostForm());
    
    expect(result.current.formState).toHaveProperty('content', '');
    expect(result.current.formState).toHaveProperty('platforms');
    expect(result.current.formState).toHaveProperty('mediaFiles');
    expect(result.current.formState.mediaFiles).toEqual([]);
    expect(result.current.formState).toHaveProperty('activePreviewTab', 'bluesky');
    expect(result.current.isFormValid).toBe(false);
  });

  it('should initialize with provided values', () => {
    const initialContent = 'Test content';
    const initialPlatforms = [
      { id: 'bluesky', isSelected: true },
      { id: 'mastodon', isSelected: false }
    ];
    
    const { result } = renderHook(() => 
      usePostForm({ 
        initialContent, 
        initialPlatforms 
      })
    );
    
    expect(result.current.formState.content).toBe(initialContent);
    expect(result.current.formState.platforms).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'bluesky', isSelected: true }),
      expect.objectContaining({ id: 'mastodon', isSelected: false })
    ]));
  });

  it('should update content', () => {
    const { result } = renderHook(() => usePostForm());
    
    act(() => {
      result.current.updateContent('New content');
    });
    
    expect(result.current.formState.content).toBe('New content');
  });

  it('should toggle platforms', () => {
    const { result } = renderHook(() => usePostForm());
    
    // Find a platform that's initially selected
    const initialPlatform = result.current.formState.platforms.find(p => p.isSelected);
    
    if (initialPlatform) {
      act(() => {
        result.current.togglePlatform(initialPlatform.id);
      });
      
      // After toggling, it should be deselected
      const updatedPlatform = result.current.formState.platforms.find(p => p.id === initialPlatform.id);
      expect(updatedPlatform?.isSelected).toBe(false);
      
      // Toggle again to select it
      act(() => {
        result.current.togglePlatform(initialPlatform.id);
      });
      
      const reselectedPlatform = result.current.formState.platforms.find(p => p.id === initialPlatform.id);
      expect(reselectedPlatform?.isSelected).toBe(true);
    }
  });

  it('should reset the form', () => {
    const { result } = renderHook(() => usePostForm({
      initialContent: 'Initial content'
    }));
    
    // First change the content
    act(() => {
      result.current.updateContent('New content');
    });
    
    expect(result.current.formState.content).toBe('New content');
    
    // Then reset the form
    act(() => {
      result.current.resetForm();
    });
    
    // Content should be reset to empty string
    expect(result.current.formState.content).toBe('');
  });

  it('should track form validity', () => {
    const { result } = renderHook(() => usePostForm());
    
    // Form should initially be invalid (no content)
    expect(result.current.isFormValid).toBe(false);
    
    // Add some content
    act(() => {
      result.current.updateContent('Some content');
    });
    
    // With content and at least one platform selected, form should be valid
    if (result.current.formState.platforms.some(p => p.isSelected)) {
      expect(result.current.isFormValid).toBe(true);
    }
    
    // Deselect all platforms
    act(() => {
      for (const platform of result.current.formState.platforms) {
        if (platform.isSelected) {
          result.current.togglePlatform(platform.id);
        }
      }
    });
    
    // With no platforms selected, form should be invalid
    expect(result.current.isFormValid).toBe(false);
  });

  it('should save a draft', async () => {
    // Mock API response
    const mockDraft = {
      id: 1,
      userId: 1,
      content: 'Test draft',
      mediaFiles: [],
      platforms: [{ id: 'bluesky', isSelected: true }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // @ts-ignore - Mocking
    apiRequest.mockResolvedValue({
      json: vi.fn().mockResolvedValue(mockDraft)
    });
    
    const { result } = renderHook(() => usePostForm({
      initialContent: 'Test draft'
    }));
    
    // Save as draft
    await act(async () => {
      await result.current.saveAsDraft();
    });
    
    // Check API was called correctly
    expect(apiRequest).toHaveBeenCalledWith('POST', '/api/drafts', expect.objectContaining({
      content: 'Test draft'
    }));
    
    // Should show pending state correctly
    expect(result.current.isPendingDraft).toBe(false);
  });

  it('should handle thread mode operations', () => {
    const { result } = renderHook(() => usePostForm());
    
    // Enter thread mode with multiple posts
    act(() => {
      result.current.setupThread(['First post', 'Second post', 'Third post']);
    });
    
    // Should be in thread mode with 3 posts
    expect(result.current.formState.isThreadMode).toBe(true);
    expect(result.current.formState.threadPosts.length).toBe(3);
    expect(result.current.formState.activeThreadIndex).toBe(0);
    expect(result.current.formState.content).toBe('First post');
    
    // Switch to second post
    act(() => {
      result.current.switchThreadPost(1);
    });
    
    expect(result.current.formState.activeThreadIndex).toBe(1);
    expect(result.current.formState.content).toBe('Second post');
    
    // Add a new post
    act(() => {
      result.current.addThreadPost('Fourth post');
    });
    
    expect(result.current.formState.threadPosts.length).toBe(4);
    
    // Remove a post
    act(() => {
      result.current.removeThreadPost(1);
    });
    
    expect(result.current.formState.threadPosts.length).toBe(3);
    
    // Exit thread mode
    act(() => {
      result.current.exitThreadMode();
    });
    
    expect(result.current.formState.isThreadMode).toBe(false);
  });
});