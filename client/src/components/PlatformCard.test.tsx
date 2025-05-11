import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlatformCard } from './PlatformCard';

describe('PlatformCard component', () => {
  const mockPlatform = {
    id: 'bluesky',
    isSelected: true
  };
  
  const mockToggle = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should render the platform card', () => {
    render(
      <PlatformCard 
        platform={mockPlatform} 
        charCount={100} 
        active={true} 
        onToggle={mockToggle} 
      />
    );
    
    // Should display the platform name (capitalized)
    expect(screen.getByText('Bluesky')).toBeInTheDocument();
    
    // Should display the character count
    expect(screen.getByText('100')).toBeInTheDocument();
  });
  
  it('should call onToggle when clicked', () => {
    render(
      <PlatformCard 
        platform={mockPlatform} 
        charCount={100} 
        active={true} 
        onToggle={mockToggle} 
      />
    );
    
    // Find the clickable element and click it
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    // Should call the onToggle callback with the platform ID
    expect(mockToggle).toHaveBeenCalledWith('bluesky');
  });
  
  it('should display different styles based on active state', () => {
    // Render active card
    const { rerender } = render(
      <PlatformCard 
        platform={mockPlatform} 
        charCount={100} 
        active={true} 
        onToggle={mockToggle} 
      />
    );
    
    const activeCard = screen.getByRole('button');
    expect(activeCard).toHaveClass('bg-primary');
    
    // Rerender with inactive state
    rerender(
      <PlatformCard 
        platform={mockPlatform} 
        charCount={100} 
        active={false} 
        onToggle={mockToggle} 
      />
    );
    
    const inactiveCard = screen.getByRole('button');
    expect(inactiveCard).not.toHaveClass('bg-primary');
  });
  
  it('should display a warning when character count exceeds the limit', () => {
    // Mock a platform with a character limit
    const platformWithLimit = {
      ...mockPlatform,
      characterLimit: 50
    };
    
    // Render with character count exceeding the limit
    render(
      <PlatformCard 
        platform={platformWithLimit} 
        charCount={100} 
        active={true} 
        onToggle={mockToggle} 
      />
    );
    
    // Should display a warning
    const characterCount = screen.getByText('100');
    expect(characterCount).toHaveClass('text-red-500');
  });
});