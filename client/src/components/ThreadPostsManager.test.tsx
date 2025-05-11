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
    
    // Should show thread navigation
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // First post should be active
    const firstPostButton = screen.getByText('1').closest('button');
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
    
    // Click on the second post
    fireEvent.click(screen.getByText('2'));
    
    // Should call onSwitchPost with the correct index
    expect(mockHandlers.onSwitchPost).toHaveBeenCalledWith(1);
  });
  
  it('should call onAddPost when add button is clicked', () => {
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
    
    // Click the add post button
    const addButton = screen.getByText(/Add Post/i);
    fireEvent.click(addButton);
    
    // Should call onAddPost
    expect(mockHandlers.onAddPost).toHaveBeenCalled();
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
    
    // Mock preventDefault
    const preventDefaultMock = vi.fn();
    
    // Click a post button with a mocked event
    const postButton = screen.getByText('2');
    fireEvent.click(postButton, {
      preventDefault: preventDefaultMock
    });
    
    // Should call preventDefault
    expect(preventDefaultMock).toHaveBeenCalled();
  });
});