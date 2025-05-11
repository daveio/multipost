import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CharacterStats } from './CharacterStats';
import { renderWithProviders } from '../../test/test-utils';

describe('CharacterStats component', () => {
  const mockStats = [
    { platform: 'bluesky', current: 150, limit: 300, percentage: 50 },
    { platform: 'mastodon', current: 400, limit: 500, percentage: 80 },
    { platform: 'threads', current: 550, limit: 500, percentage: 110 }
  ];
  
  it('should render character stats for all platforms', () => {
    renderWithProviders(<CharacterStats stats={mockStats} />);
    
    // Should show all platforms
    expect(screen.getByText('Bluesky')).toBeInTheDocument();
    expect(screen.getByText('Mastodon')).toBeInTheDocument();
    expect(screen.getByText('Threads')).toBeInTheDocument();
    
    // Should show counts
    expect(screen.getByText('150/300')).toBeInTheDocument();
    expect(screen.getByText('400/500')).toBeInTheDocument();
    expect(screen.getByText('550/500')).toBeInTheDocument();
  });
  
  it('should display different styling for counts that exceed the limit', () => {
    renderWithProviders(<CharacterStats stats={mockStats} />);
    
    // The Threads platform exceeds its limit, so it should have a warning style
    const threadsCount = screen.getByText('550/500');
    expect(threadsCount).toHaveClass('text-red-500');
    
    // The Bluesky platform is well within its limit
    const blueskyCount = screen.getByText('150/300');
    expect(blueskyCount).not.toHaveClass('text-red-500');
  });
  
  it('should handle empty stats array', () => {
    renderWithProviders(<CharacterStats stats={[]} />);
    
    // Should show a message or at least not crash
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });
});