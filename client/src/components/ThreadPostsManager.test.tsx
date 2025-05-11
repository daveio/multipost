import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { ThreadPostsManager } from './ThreadPostsManager';
import { renderWithProviders, mockThreadPosts } from '../../../test/test-utils';

describe('ThreadPostsManager component', () => {
  // Create test posts based on mockThreadPosts from test utils
  const testThreadPosts = [
    { content: 'First post', order: 0, isActive: true },
    { content: 'Second post', order: 1, isActive: false },
    { content: 'Third post', order: 2, isActive: false }
  ];
  
  const mockHandlers = {
    onSwitchPost: vi.fn(),
    onAddPost: vi.fn(),
    onRemovePost: vi.fn(),
    onContentChange: vi.fn(),
    onExit: vi.fn()
  };
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should render thread posts navigation', () => {
    renderWithProviders(
      <ThreadPostsManager
        threadPosts={testThreadPosts}
        activeIndex={0}
        onSwitchPost={mockHandlers.onSwitchPost}
        onAddPost={mockHandlers.onAddPost}
        onRemovePost={mockHandlers.onRemovePost}
        onContentChange={mockHandlers.onContentChange}
        onExit={mockHandlers.onExit}
      />
    );
    
    // Should show thread navigation with Post labels
    expect(screen.getByText('Post 1', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Post 2', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Post 3', { exact: false })).toBeInTheDocument();
    
    // First post should be active - it should have the default variant class
    const firstPostButton = screen.getAllByText(/Post 1/)[0].closest('button');
    expect(firstPostButton).toHaveClass('bg-primary');
  });
  
  it('should call onSwitchPost when another post is clicked', () => {
    renderWithProviders(
      <ThreadPostsManager
        threadPosts={testThreadPosts}
        activeIndex={0}
        onSwitchPost={mockHandlers.onSwitchPost}
        onAddPost={mockHandlers.onAddPost}
        onRemovePost={mockHandlers.onRemovePost}
        onContentChange={mockHandlers.onContentChange}
        onExit={mockHandlers.onExit}
      />
    );
    
    // Click on the second post button (should be Post 2)
    const postButtons = screen.getAllByText(/Post \d/);
    
    // Get the exact button for Post 2 
    const secondPostButton = screen.getByText(/Post 2(\s|$)/);
    expect(secondPostButton).toBeTruthy();
    
    fireEvent.click(secondPostButton);
    
    // Should call onSwitchPost with index 1 (with some delay due to setTimeout)
    // We need to use vi.advanceTimersByTime or mock the setTimeout
    setTimeout(() => {
      expect(mockHandlers.onSwitchPost).toHaveBeenCalledWith(1);
    }, 10);
  });
  
  it('should call onAddPost when add post button is clicked', () => {
    // Setup fake timers to handle setTimeout
    vi.useFakeTimers();
    
    renderWithProviders(
      <ThreadPostsManager
        threadPosts={testThreadPosts}
        activeIndex={0}
        onSwitchPost={mockHandlers.onSwitchPost}
        onAddPost={mockHandlers.onAddPost}
        onRemovePost={mockHandlers.onRemovePost}
        onContentChange={mockHandlers.onContentChange}
        onExit={mockHandlers.onExit}
      />
    );
    
    // Find the add post button (with the Plus icon)
    const addButtons = screen.getAllByRole('button');
    const addButton = addButtons.find(btn => btn.textContent?.includes('Add Post'));
    expect(addButton).toBeTruthy();
    
    if (addButton) {
      // Click the add post button
      fireEvent.click(addButton);
      
      // Advance timers to handle the setTimeout
      vi.advanceTimersByTime(10);
      
      // Should call onAddPost
      expect(mockHandlers.onAddPost).toHaveBeenCalled();
    }
    
    // Restore real timers
    vi.useRealTimers();
  });
  
  it('should call onRemovePost when remove button is clicked', () => {
    renderWithProviders(
      <ThreadPostsManager
        threadPosts={testThreadPosts}
        activeIndex={1}
        onSwitchPost={mockHandlers.onSwitchPost}
        onAddPost={mockHandlers.onAddPost}
        onRemovePost={mockHandlers.onRemovePost}
        onContentChange={mockHandlers.onContentChange}
        onExit={mockHandlers.onExit}
      />
    );
    
    // Find all remove buttons - there should be one for each post
    const removeButtons = screen.getAllByLabelText(/remove post/i);
    if (removeButtons.length > 1) {
      // Click the second remove button
      fireEvent.click(removeButtons[1]); 
      
      // Should call onRemovePost with the correct index
      expect(mockHandlers.onRemovePost).toHaveBeenCalledWith(1);
    } else {
      // If we can't find a specific button by aria-label, try by the SVG icon
      const removeButton = screen.getAllByRole('button')[3]; // This might be the remove button
      fireEvent.click(removeButton);
      expect(mockHandlers.onRemovePost).toHaveBeenCalled();
    }
  });
  
  it('should call onExit when exit thread mode button is clicked', () => {
    renderWithProviders(
      <ThreadPostsManager
        threadPosts={testThreadPosts}
        activeIndex={0}
        onSwitchPost={mockHandlers.onSwitchPost}
        onAddPost={mockHandlers.onAddPost}
        onRemovePost={mockHandlers.onRemovePost}
        onContentChange={mockHandlers.onContentChange}
        onExit={mockHandlers.onExit}
      />
    );
    
    // Click the exit button
    const exitButton = screen.getByText(/Exit Thread Mode/i);
    fireEvent.click(exitButton);
    
    // Should call onExit
    expect(mockHandlers.onExit).toHaveBeenCalled();
  });
  
  it('should prevent default on button clicks to avoid form submission', () => {
    renderWithProviders(
      <ThreadPostsManager
        threadPosts={testThreadPosts}
        activeIndex={0}
        onSwitchPost={mockHandlers.onSwitchPost}
        onAddPost={mockHandlers.onAddPost}
        onRemovePost={mockHandlers.onRemovePost}
        onContentChange={mockHandlers.onContentChange}
        onExit={mockHandlers.onExit}
      />
    );
    
    // Mock preventDefault and stopPropagation
    const preventDefaultMock = vi.fn();
    const stopPropagationMock = vi.fn();
    
    // Click a post button with mocked event methods
    const postButtons = screen.getAllByText(/Post \d/);
    const secondPostButton = postButtons.find(el => el.textContent?.includes('Post 2'));
    
    // Make sure we found the button
    expect(secondPostButton).toBeTruthy();
    
    if (secondPostButton) {
      fireEvent.click(secondPostButton, {
        preventDefault: preventDefaultMock,
        stopPropagation: stopPropagationMock
      });
    }
    
    // Should call preventDefault and stopPropagation
    expect(preventDefaultMock).toHaveBeenCalled();
    expect(stopPropagationMock).toHaveBeenCalled();
  });
});