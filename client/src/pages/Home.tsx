import Header from "@/components/Header";
import { PostComposer } from "@/components/PostComposer";
import { AccountSelector } from "@/components/AccountSelector";
import { PlatformPreview } from "@/components/PlatformPreview";
import { CharacterStats } from "@/components/CharacterStats";
import { MediaStats } from "@/components/MediaStats";
import { DraftsList } from "@/components/DraftsList";
import { usePostForm } from "@/hooks/use-post-form";

export default function Home() {
  const {
    formState,
    accounts,
    drafts,
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

  // Create a mapping of selected accounts by platform
  const selectedAccountsByPlatform = formState.selectedPlatforms.reduce<{ [key: string]: number[] }>((acc, platform) => {
    acc[platform.id] = platform.accounts || [];
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post Composer Section */}
          <div className="lg:col-span-2">
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
          
          {/* Preview & Character Stats Section */}
          <div className="lg:col-span-1">
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
