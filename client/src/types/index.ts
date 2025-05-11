export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  previewUrl?: string;
  status?: {
    [platform: string]: 'compatible' | 'incompatible' | 'processing';
  };
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  characterLimit: number;
  isSelected: boolean;
  accounts: Account[];
}

export interface Account {
  id: number;
  userId: number;
  platformId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  instanceUrl?: string;
  isActive: boolean;
}

export interface Draft {
  id: number;
  userId: number;
  content: string;
  mediaFiles: MediaFile[] | null;
  platforms: { id: string; isSelected: boolean; accounts?: number[] }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterStat {
  platform: string;
  current: number;
  limit: number;
  percentage: number;
}

export interface UsePostFormProps {
  initialContent?: string;
  initialMediaFiles?: MediaFile[];
  initialPlatforms?: { id: string; isSelected: boolean; accounts?: number[] }[];
}

export interface SplittingConfig {
  name: string;
  strategies: string[]; // Array of selected strategies
  createdAt: Date;
}

export interface AdvancedOptions {
  useThreadNotation: boolean;
  threadNotationFormat: string; // Format for thread notation: "🧵 x/y" or "🧵 x of y"
  schedulePost: boolean;
  scheduledTime?: Date;
  showRawJson: boolean; // Option to show raw JSON from OpenAI API responses
  savedSplittingConfigs?: SplittingConfig[]; // Saved splitting configurations for quick reuse
}

export interface PostFormState {
  content: string;
  mediaFiles: MediaFile[];
  selectedPlatforms: { id: string; isSelected: boolean; accounts?: number[] }[];
  advancedOptions: AdvancedOptions;
  characterStats: CharacterStat[];
  activePreviewTab: string;
}
