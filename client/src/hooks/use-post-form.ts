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
  Draft,
  ThreadPost
} from '../types';
import { DEFAULT_PLATFORMS, PLATFORM_CHARACTER_LIMITS, getCharacterLimit } from '../lib/platform-config';

// Load settings from localStorage if available
const savedShowRawJson = localStorage.getItem('showRawJson');
const savedShowReasoning = localStorage.getItem('showReasoning');
const savedSplittingConfigs = localStorage.getItem('savedSplittingConfigs');
const savedMastodonLimit = localStorage.getItem('customMastodonLimit');

const initialAdvancedOptions: AdvancedOptions = {
  useThreadNotation: false,
  threadNotationFormat: "🧵 x of y", // Default to new format
  schedulePost: false,
  scheduledTime: undefined,
  showRawJson: savedShowRawJson ? JSON.parse(savedShowRawJson) : false, // Default to false, but load from localStorage if available
  showReasoning: savedShowReasoning !== null ? JSON.parse(savedShowReasoning) : true, // Default to true, but load from localStorage if available
  savedSplittingConfigs: savedSplittingConfigs ? JSON.parse(savedSplittingConfigs) : [], // Load saved configurations from localStorage
  customMastodonLimit: savedMastodonLimit ? parseInt(savedMastodonLimit) : 500 // Default to 500, but load from localStorage if available
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
    activePreviewTab: DEFAULT_PLATFORMS[0].id,
    threadPosts: [],
    isThreadMode: false,
    activeThreadIndex: 0
  });
  
  // Fetch platform character limits
  const { data: platformLimits } = useQuery({
    queryKey: ['/api/platforms/character-limits', formState.advancedOptions.customMastodonLimit],
    queryFn: async ({ queryKey }) => {
      const [path, customMastodonLimit] = queryKey;
      // Add customMastodonLimit as a query parameter if defined
      const url = typeof customMastodonLimit === 'number'
        ? `${path}?customMastodonLimit=${customMastodonLimit}`
        : String(path);
      const response = await fetch(url);
      return response.json();
    },
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
        // Use custom Mastodon limit if available
        const actualLimit = platform === 'mastodon' && formState.advancedOptions.customMastodonLimit 
          ? formState.advancedOptions.customMastodonLimit 
          : (limit as number);
          
        stats.push({
          platform,
          current: contentLength,
          limit: actualLimit,
          percentage: Math.min(100, (contentLength / actualLimit) * 100)
        });
      }
    });
    
    setFormState(prev => ({
      ...prev,
      characterStats: stats
    }));
  }, [formState.content, platformLimits, formState.advancedOptions.customMastodonLimit]);
  
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
      activePreviewTab: formState.activePreviewTab,
      threadPosts: [],
      isThreadMode: false,
      activeThreadIndex: 0
    });
  };
  
  // Set active preview tab
  const setActivePreviewTab = (tab: string) => {
    setFormState(prev => ({
      ...prev,
      activePreviewTab: tab
    }));
  };
  
  // Set up a thread with the given posts
  const setupThread = (posts: string[]) => {
    if (!posts || posts.length === 0) return;
    
    // Create thread posts from the array of content strings
    const threadPosts = posts.map((postContent, index) => ({
      content: postContent,
      order: index,
      isActive: index === 0 // First post is active by default
    }));
    
    // Update content with the first post
    setFormState(prev => ({
      ...prev,
      content: posts[0],
      threadPosts,
      isThreadMode: true,
      activeThreadIndex: 0
    }));
    
    toast({
      title: "Thread Created",
      description: `Created a thread with ${posts.length} posts`,
    });
  };
  
  // Switch to a different post in the thread
  const switchThreadPost = (index: number) => {
    if (index < 0 || index >= formState.threadPosts.length) return;
    
    // First, save the current content to the current thread post
    const currentIndex = formState.activeThreadIndex;
    const updatedPosts = [...formState.threadPosts];
    
    // Save current content to current post
    if (currentIndex >= 0 && currentIndex < updatedPosts.length) {
      updatedPosts[currentIndex] = {
        ...updatedPosts[currentIndex],
        content: formState.content,
        isActive: false
      };
    }
    
    // Set the new post as active
    updatedPosts[index] = {
      ...updatedPosts[index],
      isActive: true
    };
    
    // Update the form state
    setFormState(prev => ({
      ...prev,
      content: updatedPosts[index].content,
      threadPosts: updatedPosts,
      activeThreadIndex: index,
      isThreadMode: true // Ensure we stay in thread mode
    }));
  };
  
  // Add a new post to the thread
  const addThreadPost = (content: string = '') => {
    // First, save the current content to the current thread post
    const currentIndex = formState.activeThreadIndex;
    const updatedPosts = [...formState.threadPosts];
    
    // Save current content to current post if we're in thread mode
    if (formState.isThreadMode && currentIndex >= 0 && currentIndex < updatedPosts.length) {
      updatedPosts[currentIndex] = {
        ...updatedPosts[currentIndex],
        content: formState.content,
        isActive: false
      };
    }
    
    // Create a new post
    const newPost: ThreadPost = {
      content: content || '',
      order: updatedPosts.length,
      isActive: true
    };
    
    // Add the new post to the thread
    updatedPosts.push(newPost);
    const newIndex = updatedPosts.length - 1;
    
    // Update the form state
    setFormState(prev => ({
      ...prev,
      content: newPost.content,
      threadPosts: updatedPosts,
      activeThreadIndex: newIndex,
      isThreadMode: true
    }));
    
    toast({
      title: "Post Added",
      description: "Added a new post to the thread",
    });
  };
  
  // Remove a post from the thread
  const removeThreadPost = (index: number) => {
    if (formState.threadPosts.length <= 1) {
      // If this is the only post, exit thread mode but keep the content
      const content = formState.threadPosts[0]?.content || formState.content;
      setFormState(prev => ({
        ...prev,
        content,
        isThreadMode: false,
        threadPosts: [],
        activeThreadIndex: 0
      }));
      
      toast({
        title: "Thread Mode Exited",
        description: "Returned to single post mode",
      });
      return;
    }
    
    // First, save the current content to the current thread post if it's not the one being removed
    const currentIndex = formState.activeThreadIndex;
    let updatedPosts = [...formState.threadPosts];
    
    if (currentIndex !== index && currentIndex >= 0 && currentIndex < updatedPosts.length) {
      updatedPosts[currentIndex] = {
        ...updatedPosts[currentIndex],
        content: formState.content
      };
    }
    
    // Now remove the post and reorder
    updatedPosts = updatedPosts
      .filter((_, i) => i !== index)
      .map((post, i) => ({
        ...post,
        order: i,
        isActive: false // We'll set the active post below
      }));
    
    // Determine the new active index
    const newActiveIndex = index === currentIndex 
      ? Math.min(index, updatedPosts.length - 1) // If removing active post, move to same position or last
      : index < currentIndex 
        ? currentIndex - 1  // If removing post before active, adjust index down
        : currentIndex;     // If removing post after active, keep same index
    
    // Set the new active post
    updatedPosts[newActiveIndex].isActive = true;
        
    setFormState(prev => ({
      ...prev,
      content: updatedPosts[newActiveIndex].content,
      threadPosts: updatedPosts,
      activeThreadIndex: newActiveIndex,
      isThreadMode: true
    }));
    
    toast({
      title: "Post Removed",
      description: `Removed post ${index + 1} from thread`,
    });
  };
  
  // Exit thread mode
  const exitThreadMode = () => {
    // When exiting thread mode, keep the content of the current active post
    const activePost = formState.threadPosts[formState.activeThreadIndex];
    const content = activePost?.content || formState.content;
    
    setFormState(prev => ({
      ...prev,
      content,
      isThreadMode: false,
      threadPosts: [],
      activeThreadIndex: 0
    }));
    
    toast({
      title: "Exited Thread Mode",
      description: "Returned to single post mode with the content from the active post.",
    });
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
    setActivePreviewTab,
    setupThread,
    switchThreadPost,
    addThreadPost,
    removeThreadPost,
    exitThreadMode
  };
}
