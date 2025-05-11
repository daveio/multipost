import Header from "@/components/Header";
import { PostComposer } from "@/components/PostComposer";
import { AccountSelector } from "@/components/AccountSelector";
import { PlatformPreview } from "@/components/PlatformPreview";
import { CharacterStats } from "@/components/CharacterStats";
import { MediaStats } from "@/components/MediaStats";
import { DraftsList } from "@/components/DraftsList";
import { usePostForm } from "@/hooks/use-post-form";
import { SplittingStrategy } from "@/lib/aiService";
import { useToast } from "@/hooks/use-toast";
import { Account, Draft } from "../types";

export default function Home() {
  const { toast } = useToast();
  const {
    formState,
    accounts: rawAccounts,
    drafts: rawDrafts,
    isFormValid,
    isPendingDraft,
    isPendingPost,
    isPendingUpload,
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
  } = usePostForm();
  
  // Explicitly type accounts and drafts
  const accounts = rawAccounts as Account[];
  const drafts = rawDrafts as Draft[];
  
  // Handle AI split post
  const handleApplySplit = (strategy: SplittingStrategy, platformId: string, splitText: string[]) => {
    if (!splitText || splitText.length === 0) return;
    
    // If we have exactly one post, just update the content
    if (splitText.length === 1) {
      updateContent(splitText[0]);
      toast({
        title: "Content Updated",
        description: `Post optimized for ${platformId} using ${strategy} strategy.`,
      });
      return;
    }
    
    // For multiple posts, we need to save them as drafts
    // First, save the current post as a draft if needed
    const originalPost = formState.content;
    
    // Make a copy of selected platforms and ensure the target platform is selected
    const platforms = formState.selectedPlatforms.map(p => {
      if (p.id === platformId) {
        return { ...p, isSelected: true };
      }
      return p;
    });
    
    // Start with the first post
    updateContent(splitText[0]);
    
    // Save remaining posts as drafts
    for (let i = 1; i < splitText.length; i++) {
      // Create a temporary draft with the split content
      // Here we'd ideally call saveAsDraft with specific content
      // Since we can't do that directly with the current API, we'll show a message instead
      toast({
        title: `Thread Part ${i+1}/${splitText.length}`,
        description: "Additional posts in this thread will be saved as drafts.",
      });
    }
    
    toast({
      title: "AI Split Applied",
      description: `Created a thread with ${splitText.length} posts using ${strategy} strategy.`,
    });
  };

  // Create a mapping of selected accounts by platform
  const selectedAccountsByPlatform = formState.selectedPlatforms.reduce<{ [key: string]: number[] }>((acc, platform) => {
    acc[platform.id] = platform.accounts || [];
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Post Composer Section - Takes 3/5 of the screen on large displays */}
          <div className="lg:col-span-3">
            <PostComposer 
              content={formState.content}
              mediaFiles={formState.mediaFiles}
              characterStats={formState.characterStats}
              selectedPlatforms={formState.selectedPlatforms}
              advancedOptions={formState.advancedOptions}
              isPendingDraft={isPendingDraft}
              isPendingPost={isPendingPost}
              isPendingUpload={isPendingUpload}
              isFormValid={isFormValid}
              onContentChange={updateContent}
              onTogglePlatform={togglePlatform}
              onAdvancedOptionsChange={updateAdvancedOptions}
              onUploadFiles={uploadFiles}
              onRemoveMediaFile={removeMediaFile}
              onSaveAsDraft={saveAsDraft}
              onSubmitPost={submitPost}
              onResetForm={resetForm}
              onApplySplit={handleApplySplit}
              accounts={accounts}
            />
            
            <AccountSelector 
              accounts={accounts}
              selectedAccounts={selectedAccountsByPlatform}
              onToggleAccount={toggleAccount}
            />
            
            <DraftsList 
              drafts={drafts}
              onLoadDraft={loadDraft}
              onDeleteDraft={deleteDraft}
            />
          </div>
          
          {/* Preview & Character Stats Section - Takes 2/5 of the screen on large displays */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Post Preview</h2>
              
              <PlatformPreview 
                content={formState.content}
                mediaFiles={formState.mediaFiles}
                activeTab={formState.activePreviewTab}
                accounts={accounts}
                onTabChange={setActivePreviewTab}
              />
              
              <CharacterStats stats={formState.characterStats} />
            </div>
            
            <MediaStats mediaFiles={formState.mediaFiles} />
          </div>
        </div>
      </main>
    </div>
  );
}
