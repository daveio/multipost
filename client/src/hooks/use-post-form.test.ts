import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { usePostForm } from './use-post-form';
import { renderWithProviders } from '../../test/test-utils';

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

describe('usePostForm hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    localStorageMock.clear.mockClear();
  });

  it('should initialize with default values', () => {
    const { result } = renderWithProviders(
      <TestHook />
    );
    
    expect(result.formState.content).toBe('');
    expect(result.formState.mediaFiles).toEqual([]);
    expect(result.formState.selectedPlatforms).toBeDefined();
    expect(result.isFormValid).toBe(false);
  });

  it('should update content correctly', () => {
    const { result, rerender } = renderWithProviders(
      <TestHook />
    );
    
    // Set content
    act(() => {
      result.actions.setContent('New content');
      rerender(<TestHook />);
    });
    
    expect(result.formState.content).toBe('New content');
  });

  it('should toggle platform selection', () => {
    const initialPlatforms = [
      { id: 'bluesky', isSelected: true },
      { id: 'mastodon', isSelected: false }
    ];
    
    const { result, rerender } = renderWithProviders(
      <TestHook initialContent="" initialPlatforms={initialPlatforms} />
    );
    
    // Toggle mastodon to selected
    act(() => {
      result.actions.togglePlatform('mastodon');
      rerender(<TestHook initialContent="" initialPlatforms={initialPlatforms} />);
    });
    
    // Check that mastodon is now selected
    const mastodonPlatform = result.formState.selectedPlatforms
      .find(p => p.id === 'mastodon');
    expect(mastodonPlatform?.isSelected).toBe(true);
  });

  it('should handle advanced options', () => {
    const { result, rerender } = renderWithProviders(
      <TestHook />
    );
    
    const newOptions = { showReasoningInUI: true };
    
    act(() => {
      result.actions.setAdvancedOptions(newOptions);
      rerender(<TestHook />);
    });
    
    expect(result.formState.advancedOptions).toMatchObject(newOptions);
  });

  it('should reset the form correctly', () => {
    const { result, rerender } = renderWithProviders(
      <TestHook initialContent="Test content" />
    );
    
    expect(result.formState.content).toBe('Test content');
    
    act(() => {
      result.actions.resetForm();
      rerender(<TestHook initialContent="Test content" />);
    });
    
    expect(result.formState.content).toBe('');
  });
});

// Helper component to test the hook
function TestHook({ 
  initialContent = '',
  initialPlatforms
}: { 
  initialContent?: string;
  initialPlatforms?: any[];
}) {
  return <TestRenderer hook={usePostForm({ initialContent, initialPlatforms })} />;
}

// Stores the hook result so we can access it in tests
function TestRenderer({ hook }: { hook: any }) {
  // @ts-ignore - This is just for testing
  window.testHookResult = hook;
  return null;
}

// Get the hook result from the window
Object.defineProperty(renderWithProviders, 'result', {
  get: () => window.testHookResult
});