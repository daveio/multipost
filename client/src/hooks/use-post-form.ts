import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  MediaFile, 
  Platform, 
  CharacterStat, 
  UsePostFormProps, 
  PostFormState, 
  AdvancedOptions,
  Account,
  Draft
} from '../types';
import { DEFAULT_PLATFORMS, PLATFORM_CHARACTER_LIMITS } from '../lib/platform-config';

// Load settings from localStorage if available
const savedShowRawJson = localStorage.getItem('showRawJson');
const savedSplittingConfigs = localStorage.getItem('savedSplittingConfigs');

const initialAdvancedOptions: AdvancedOptions = {
  useThreadNotation: false,
  threadNotationFormat: "🧵 x of y", // Default to new format
  schedulePost: false,
  scheduledTime: undefined,
  showRawJson: savedShowRawJson ? JSON.parse(savedShowRawJson) : false, // Default to false, but load from localStorage if available
  savedSplittingConfigs: savedSplittingConfigs ? JSON.parse(savedSplittingConfigs) : [] // Load saved configurations from localStorage
};

export function usePostForm({ 
  initialContent = '', 
  initialMediaFiles = [], 
  initialPlatforms = DEFAULT_PLATFORMS.map(p => ({ id: p.id, isSelected: p.isSelected }))
}: UsePostFormProps = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for form
  const [formState, setFormState] = useState<PostFormState>({
    content: initialContent,
    mediaFiles: initialMediaFiles,
    selectedPlatforms: initialPlatforms,
    advancedOptions: initialAdvancedOptions,
    characterStats: [],
    activePreviewTab: DEFAULT_PLATFORMS[0].id
  });
  
  // Fetch platform character limits
  const { data: platformLimits } = useQuery({
    queryKey: ['/api/platforms/character-limits'],
    staleTime: Infinity, // This rarely changes, so cache it for a long time
  });
  
  // Fetch accounts
  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['/api/accounts'],
    staleTime: 60000, // Cache for 1 minute
  });
  
  // Query for drafts
  const { data: drafts = [] } = useQuery<Draft[]>({
    queryKey: ['/api/drafts'],
    staleTime: 30000, // Cache for 30 seconds
  });
  
  // Create draft mutation
  const createDraftMutation = useMutation({
    mutationFn: async (draft: { content: string, mediaFiles: MediaFile[], platforms: { id: string, isSelected: boolean, accounts?: number[] }[] }) => {
      const response = await apiRequest('POST', '/api/drafts', draft);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });
      toast({
        title: "Draft saved",
        description: "Your draft has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to save draft",
        description: error.message || "There was an error saving your draft.",
        variant: "destructive"
      });
    }
  });
  
  // Post to platforms mutation
  const createPostMutation = useMutation({
    mutationFn: async (post: { content: string, mediaFiles: MediaFile[], platforms: { id: string, isSelected: boolean, accounts?: number[] }[] }) => {
      const response = await apiRequest('POST', '/api/posts', post);
      return response.json();
    },
    onSuccess: () => {
      resetForm();
      toast({
        title: "Post published",
        description: "Your post has been published to the selected platforms.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to publish post",
        description: error.message || "There was an error publishing your post.",
        variant: "destructive"
      });
    }
  });
  
  // Upload media mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const filesData = files.map(file => ({
        name: file.name,
        type: file.type,
        size: file.size
      }));
      
      const response = await apiRequest('POST', '/api/upload', { files: filesData });
      return response.json();
    },
    onSuccess: (data) => {
      setFormState(prev => ({
        ...prev,
        mediaFiles: [...prev.mediaFiles, ...data]
      }));
      
      toast({
        title: "Files uploaded",
        description: `Successfully uploaded ${data.length} file(s).`,
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload files. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Calculate character stats whenever content or platform limits change
  useEffect(() => {
    if (!platformLimits) return;
    
    const stats: CharacterStat[] = [];
    const contentLength = formState.content.length;
    
    Object.entries(platformLimits).forEach(([platform, limit]) => {
      const platformObject = DEFAULT_PLATFORMS.find(p => p.id === platform);
      if (platformObject) {
        stats.push({
          platform,
          current: contentLength,
          limit: limit as number,
          percentage: Math.min(100, (contentLength / (limit as number)) * 100)
        });
      }
    });
    
    setFormState(prev => ({
      ...prev,
      characterStats: stats
    }));
  }, [formState.content, platformLimits]);
  
  // Update platforms with accounts data when it's available
  useEffect(() => {
    if (accounts.length === 0) return;
    
    const platformsWithAccounts = formState.selectedPlatforms.map(platform => {
      const platformAccounts = accounts.filter((acc: Account) => acc.platformId === platform.id);
      return {
        ...platform,
        accounts: platform.accounts || platformAccounts.filter((acc: Account) => acc.isActive).map((acc: Account) => acc.id)
      };
    });
    
    setFormState(prev => ({
      ...prev,
      selectedPlatforms: platformsWithAccounts
    }));
  }, [accounts]);
  
  // Check if form is valid
  const isFormValid = useMemo(() => {
    const hasContent = formState.content.trim().length > 0;
    const hasPlatformSelected = formState.selectedPlatforms.some(p => p.isSelected);
    
    return hasContent && hasPlatformSelected;
  }, [formState.content, formState.selectedPlatforms]);
  
  // Update content
  const updateContent = (content: string) => {
    setFormState(prev => ({
      ...prev,
      content
    }));
  };
  
  // Update advanced options
  const updateAdvancedOptions = (options: Partial<AdvancedOptions>) => {
    setFormState(prev => ({
      ...prev,
      advancedOptions: {
        ...prev.advancedOptions,
        ...options
      }
    }));
  };
  
  // Toggle platform selection
  const togglePlatform = (platformId: string) => {
    setFormState(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.map(p => 
        p.id === platformId ? { ...p, isSelected: !p.isSelected } : p
      )
    }));
  };
  
  // Toggle account selection
  const toggleAccount = (platformId: string, accountId: number) => {
    setFormState(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.map(p => {
        if (p.id === platformId) {
          const currentAccounts = p.accounts || [];
          const newAccounts = currentAccounts.includes(accountId)
            ? currentAccounts.filter(id => id !== accountId)
            : [...currentAccounts, accountId];
          
          return { ...p, accounts: newAccounts };
        }
        return p;
      })
    }));
  };
  
  // Upload files
  const uploadFiles = (files: File[]) => {
    if (files.length === 0) return;
    uploadMediaMutation.mutate(files);
  };
  
  // Remove media file
  const removeMediaFile = (fileId: string) => {
    setFormState(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter(file => file.id !== fileId)
    }));
  };
  
  // Save as draft
  const saveAsDraft = () => {
    if (!isFormValid) {
      toast({
        title: "Cannot save draft",
        description: "Please add some content and select at least one platform.",
        variant: "destructive"
      });
      return;
    }
    
    createDraftMutation.mutate({
      content: formState.content,
      mediaFiles: formState.mediaFiles,
      platforms: formState.selectedPlatforms
    });
  };
  
  // Submit post
  const submitPost = () => {
    if (!isFormValid) {
      toast({
        title: "Cannot publish post",
        description: "Please add some content and select at least one platform.",
        variant: "destructive"
      });
      return;
    }
    
    createPostMutation.mutate({
      content: formState.content,
      mediaFiles: formState.mediaFiles,
      platforms: formState.selectedPlatforms
    });
  };
  
  // Load a draft
  const loadDraft = (draftId: number) => {
    const draft = drafts.find((d: Draft) => d.id === draftId);
    if (!draft) return;
    
    setFormState(prev => ({
      ...prev,
      content: draft.content,
      mediaFiles: draft.mediaFiles || [],
      selectedPlatforms: draft.platforms
    }));
    
    toast({
      title: "Draft loaded",
      description: "Your draft has been loaded into the editor.",
    });
  };
  
  // Delete a draft
  const deleteDraft = async (draftId: number) => {
    try {
      await apiRequest('DELETE', `/api/drafts/${draftId}`);
      queryClient.invalidateQueries({ queryKey: ['/api/drafts'] });
      
      toast({
        title: "Draft deleted",
        description: "Your draft has been deleted.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete draft",
        description: (error as Error).message || "There was an error deleting your draft.",
        variant: "destructive"
      });
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormState({
      content: '',
      mediaFiles: [],
      selectedPlatforms: DEFAULT_PLATFORMS.map(p => ({ id: p.id, isSelected: p.isSelected })),
      advancedOptions: initialAdvancedOptions,
      characterStats: formState.characterStats,
      activePreviewTab: formState.activePreviewTab
    });
  };
  
  // Set active preview tab
  const setActivePreviewTab = (tab: string) => {
    setFormState(prev => ({
      ...prev,
      activePreviewTab: tab
    }));
  };
  
  return {
    formState,
    accounts,
    drafts,
    isFormValid,
    isPendingDraft: createDraftMutation.isPending,
    isPendingPost: createPostMutation.isPending,
    isPendingUpload: uploadMediaMutation.isPending,
    updateContent,
    updateAdvancedOptions,
    togglePlatform,
    toggleAccount,
    uploadFiles,
    removeMediaFile,
    saveAsDraft,
    submitPost,
    loadDraft,
    deleteDraft,
    resetForm,
    setActivePreviewTab
  };
}
