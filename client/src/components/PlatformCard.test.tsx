// @ts-nocheck
/* This file is intentionally not type-checked because of Jest/Vitest matcher errors */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { PlatformCard } from './PlatformCard';
import { renderWithProviders, mockPlatforms } from '../../../test/test-utils';

describe('PlatformCard component', () => {
  // Add isSelected property required by the Platform type
  const mockPlatform = {
    ...mockPlatforms[0],
    isSelected: true,
    accounts: []
  };
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
    
    // Should display the platform name
    expect(screen.getByText('Bluesky')).toBeInTheDocument();
    
    // Should display the character count (look for partial text)
    const charCountElement = screen.getByText(/100\/300/);
    expect(charCountElement).toBeInTheDocument();
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
    
    // Find the platform card container and click it
    const card = screen.getByTestId('platform-bluesky');
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
    
    // Check if the active class is applied to the card
    const activeCard = screen.getByTestId('platform-bluesky');
    expect(activeCard).toHaveClass('active');
    
    // Rerender with inactive state
    rerender(
      <PlatformCard 
        platform={mockPlatform} 
        charCount={100} 
        active={false} 
        onToggle={mockToggle} 
      />
    );
    
    // Check if the active class is not applied
    const inactiveCard = screen.getByTestId('platform-bluesky');
    expect(inactiveCard).not.toHaveClass('active');
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
    
    // Should display a warning - find by partial text and check the class
    const charCountText = `${charCount}/${mockPlatform.characterLimit}`;
    const charElement = screen.getByText((content) => {
      return content.includes(charCountText);
    });
    
    expect(charElement).toHaveClass('char-counter-danger');
  });
});