import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { CharacterStats } from './CharacterStats';
import { renderWithProviders } from '../../../test/test-utils';

describe('CharacterStats component', () => {
  const mockStats = [
    { platform: 'bluesky', current: 150, limit: 300, percentage: 50 },
    { platform: 'mastodon', current: 400, limit: 500, percentage: 80 },
    { platform: 'threads', current: 550, limit: 500, percentage: 110 }
  ];
  
  it('should render character stats for all platforms', () => {
    renderWithProviders(<CharacterStats stats={mockStats} />);
    
    // Should show all platforms (capitalized in HTML)
    expect(screen.getByText('bluesky', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('mastodon', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('threads', { exact: false })).toBeInTheDocument();
    
    // Should show the numerical values
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('300', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('400')).toBeInTheDocument();
    expect(screen.getByText('500', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('550')).toBeInTheDocument();
  });
  
  it('should use different indicator classes for progress bars based on usage percentage', () => {
    renderWithProviders(<CharacterStats stats={mockStats} />);
    
    // Find all Progress components - look for indicators with destructive class
    const progressBars = document.querySelectorAll('[role="progressbar"]');
    
    // Verify progress bars are rendered
    expect(progressBars.length).toBe(3);
    
    // Check that the Threads progress bar (110% usage) has the destructive class in its attribute
    const threadsProgressBar = progressBars[2];
    expect(threadsProgressBar).toHaveAttribute('indicatorclassname', 'bg-destructive');
    
    // Check that the Bluesky progress bar (50% usage) has the primary class in its attribute
    const blueskyProgressBar = progressBars[0];
    expect(blueskyProgressBar).toHaveAttribute('indicatorclassname', 'bg-primary');
  });
  
  it('should handle empty stats array', () => {
    renderWithProviders(<CharacterStats stats={[]} />);
    
    // Should show a message or at least not crash
    expect(screen.queryByText(/\//)).not.toBeInTheDocument();
  });
});