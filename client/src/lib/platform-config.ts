import { Platform, AdvancedOptions } from "../types";

// Character limits for each platform
export const PLATFORM_CHARACTER_LIMITS = {
  bluesky: 300,
  mastodon: 500,
  threads: 500,
  nostr: 1000
};

/**
 * Get the character limit for a platform, taking into account any custom limits
 * @param platformId The platform ID
 * @param advancedOptions Optional advanced options with custom limits
 * @returns The character limit for the platform
 */
export function getCharacterLimit(platformId: string, advancedOptions?: AdvancedOptions): number {
  if (platformId === 'mastodon' && advancedOptions?.customMastodonLimit) {
    return advancedOptions.customMastodonLimit;
  }
  
  return PLATFORM_CHARACTER_LIMITS[platformId as keyof typeof PLATFORM_CHARACTER_LIMITS] || 280; // Default to Twitter's limit as fallback
};

// Media constraints for each platform
export const PLATFORM_MEDIA_CONSTRAINTS = {
  bluesky: {
    maxImages: 4,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif'],
    supportsVideo: false
  },
  mastodon: {
    maxImages: 4,
    maxImageSize: 16 * 1024 * 1024, // 16MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportsVideo: true,
    maxVideoSize: 40 * 1024 * 1024 // 40MB
  },
  threads: {
    maxImages: 10,
    maxImageSize: 8 * 1024 * 1024, // 8MB
    allowedImageTypes: ['image/jpeg', 'image/png'],
    supportsVideo: true,
    maxVideoSize: 15 * 1024 * 1024, // 15MB
    maxVideoDuration: 120 // 2 minutes
  },
  nostr: {
    maxImages: undefined, // Depends on relay
    maxImageSize: undefined, // Depends on relay
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    supportsVideo: true,
    maxVideoSize: undefined // Depends on relay
  }
};

export const DEFAULT_PLATFORMS: Platform[] = [
  {
    id: "bluesky",
    name: "Bluesky",
    icon: "bluesky",
    characterLimit: PLATFORM_CHARACTER_LIMITS.bluesky,
    isSelected: true,
    accounts: []
  },
  {
    id: "mastodon",
    name: "Mastodon",
    icon: "mastodon",
    characterLimit: PLATFORM_CHARACTER_LIMITS.mastodon,
    isSelected: true,
    accounts: []
  },
  {
    id: "threads",
    name: "Threads",
    icon: "threads",
    characterLimit: PLATFORM_CHARACTER_LIMITS.threads,
    isSelected: true,
    accounts: []
  },
  {
    id: "nostr",
    name: "Nostr",
    icon: "nostr",
    characterLimit: PLATFORM_CHARACTER_LIMITS.nostr,
    isSelected: false,
    accounts: []
  }
];

// Check if a media file is compatible with a platform
export function isMediaCompatible(file: File, platformId: string): boolean {
  const constraints = PLATFORM_MEDIA_CONSTRAINTS[platformId as keyof typeof PLATFORM_MEDIA_CONSTRAINTS];
  
  if (!constraints) return false;
  
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  
  if (isImage) {
    return constraints.allowedImageTypes?.includes(file.type) && 
           (constraints.maxImageSize === undefined || file.size <= constraints.maxImageSize);
  }
  
  if (isVideo) {
    return constraints.supportsVideo && 
           (constraints.maxVideoSize === undefined || file.size <= constraints.maxVideoSize);
  }
  
  return false;
}

// Get the platform name from ID
export function getPlatformName(platformId: string): string {
  const platform = DEFAULT_PLATFORMS.find(p => p.id === platformId);
  return platform ? platform.name : platformId;
}

// Format relative time for display
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInHours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  
  if (diffInHours < 48) {
    return 'Yesterday';
  }
  
  const days = Math.floor(diffInHours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
