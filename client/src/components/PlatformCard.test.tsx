import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { PlatformCard } from './PlatformCard';
import { renderWithProviders, mockPlatforms } from '../../../test/test-utils';

describe('PlatformCard component', () => {
  const mockPlatform = mockPlatforms[0]; // Using the Bluesky platform from test utils
  const mockToggle = vi.fn();
  
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should render the platform card', () => {
    renderWithProviders(
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
    renderWithProviders(
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
    const { rerender } = renderWithProviders(
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
    // Create a platform with its character limit exceeded
    const charCount = mockPlatform.characterLimit + 50;
    
    // Render with character count exceeding the limit
    renderWithProviders(
      <PlatformCard 
        platform={mockPlatform} 
        charCount={charCount} 
        active={true} 
        onToggle={mockToggle} 
      />
    );
    
    // Should display a warning
    const characterCount = screen.getByText(charCount.toString());
    expect(characterCount).toHaveClass('text-red-500');
  });
});