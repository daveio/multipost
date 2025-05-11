import { FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { UIIcon, SocialIcon } from "./SocialIcons";
import { MediaUploader } from "./MediaUploader";
import { PlatformCard } from "./PlatformCard";
import { SplitWithAIButton } from "./SplitWithAIButton";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { DEFAULT_PLATFORMS } from "../lib/platform-config";
import { Platform, CharacterStat, MediaFile, AdvancedOptions } from "../types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SplittingStrategy } from "@/lib/aiService";

interface PostComposerProps {
  content: string;
  mediaFiles: MediaFile[];
  characterStats: CharacterStat[];
  selectedPlatforms: { id: string; isSelected: boolean; accounts?: number[] }[];
  advancedOptions: AdvancedOptions;
  isPendingDraft: boolean;
  isPendingPost: boolean;
  isPendingUpload: boolean;
  isFormValid: boolean;
  onContentChange: (content: string) => void;
  onTogglePlatform: (platformId: string) => void;
  onAdvancedOptionsChange: (options: Partial<AdvancedOptions>) => void;
  onUploadFiles: (files: File[]) => void;
  onRemoveMediaFile: (fileId: string) => void;
  onSaveAsDraft: () => void;
  onSubmitPost: () => void;
  onResetForm: () => void;
  onApplySplit?: (strategy: SplittingStrategy, platformId: string, splitText: string[]) => void;
  accounts?: any[]; // We'll need this for the AI split preview
}

export function PostComposer({
  content,
  mediaFiles,
  characterStats,
  selectedPlatforms,
  advancedOptions,
  isPendingDraft,
  isPendingPost,
  isPendingUpload,
  isFormValid,
  onContentChange,
  onTogglePlatform,
  onAdvancedOptionsChange,
  onUploadFiles,
  onRemoveMediaFile,
  onSaveAsDraft,
  onSubmitPost,
  onResetForm,
  onApplySplit,
  accounts = []
}: PostComposerProps) {
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmitPost();
  };

  const isContentTooLong = characterStats.some(stat => stat.current > stat.limit);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Create Post</h2>
      
      <form onSubmit={handleFormSubmit}>
        {/* Text Area for Post */}
        <div className="form-control mb-4 relative">
          <Textarea 
            id="postContent" 
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            className="resize-none h-40"
            placeholder="What's on your mind? Type your message here to post across multiple platforms..."
            disabled={isPendingPost}
          />
          
          {/* Start/Continue Thread Button - Only appears when content exceeds character limit */}
          {isContentTooLong && (
            <div className="absolute bottom-3 right-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  
                  // Add thread numbering to current content if needed
                  let updatedContent = content;
                  const isFirstPost = !content.includes(advancedOptions.threadNotationFormat.replace('x', '1'));
                  
                  if (isFirstPost && advancedOptions.useThreadNotation) {
                    updatedContent = content + '\n\n' + advancedOptions.threadNotationFormat.replace('x', '1').replace('y', '2');
                  }
                  
                  // Create new post with thread numbering
                  const newPost = advancedOptions.useThreadNotation 
                    ? advancedOptions.threadNotationFormat.replace('x', '2').replace('y', '2') 
                    : '';
                  
                  // Apply the split
                  onApplySplit && onApplySplit(
                    SplittingStrategy.SEMANTIC,
                    characterStats[0]?.platform || 'bluesky',
                    [updatedContent, newPost]
                  );
                }}
                type="button"
              >
                <UIIcon.Split className="mr-2 h-4 w-4" />
                {!content.includes(advancedOptions.threadNotationFormat.replace('x', '1')) 
                  ? "Start Thread" 
                  : "Continue Thread"}
              </Button>
            </div>
          )}
          
          {/* Character Count */}
          <div className="mt-2 flex justify-between text-sm">
            <div className={
              isContentTooLong ? "char-counter-danger" : 
              content.length > 0.8 * Math.min(...characterStats.map(s => s.limit)) ? 
                "char-counter-warning" : "text-gray-500"
            }>
              {content.length} characters
            </div>
            
            {/* Post splitting options - AI Button Only */}
            <div className="flex gap-2">
              {/* AI Split Button */}
              <SplitWithAIButton 
                content={content}
                isContentTooLong={isContentTooLong}
                accounts={accounts}
                characterStats={characterStats}
                advancedOptions={advancedOptions}
                onApplySplit={onApplySplit || (() => {})}
              />
            </div>
          </div>
        </div>
        
        {/* Media Upload */}
        <MediaUploader 
          mediaFiles={mediaFiles}
          isPendingUpload={isPendingUpload}
          onUpload={onUploadFiles}
          onRemove={onRemoveMediaFile}
        />
        
        {/* Platform Selection */}
        <div className="mb-6">
          <h3 className="text-md font-medium mb-3">Post to these platforms</h3>
          
          {/* Selected Platforms Summary */}
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedPlatforms
              .filter(p => p.isSelected)
              .map((platform) => (
                <Badge key={platform.id} variant="outline" className="gap-1">
                  <UIIcon.Check className="text-success h-3 w-3" />
                  <span className="capitalize">{platform.id}</span>
                </Badge>
              ))}
          </div>
          
          {/* Platform Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {DEFAULT_PLATFORMS.map((platform) => {
              const selectedPlatform = selectedPlatforms.find(p => p.id === platform.id);
              const stat = characterStats.find(s => s.platform === platform.id);
              
              return (
                <PlatformCard 
                  key={platform.id}
                  platform={platform}
                  charCount={stat?.current || 0}
                  active={selectedPlatform?.isSelected || false}
                  onToggle={onTogglePlatform}
                />
              );
            })}
          </div>
        </div>
        
        {/* Advanced Options (Collapsible) */}
        <Accordion type="single" collapsible className="mb-6 border rounded-lg">
          <AccordionItem value="advanced-options">
            <AccordionTrigger className="px-4 py-3 text-md font-medium">
              Advanced Options
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="useThreadNotation"
                    checked={advancedOptions.useThreadNotation}
                    onCheckedChange={(checked) => 
                      onAdvancedOptionsChange({ useThreadNotation: checked as boolean })
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="useThreadNotation"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Use thread notation ({advancedOptions.threadNotationFormat})
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Adds thread numbering to each post. When using AI splitting, this will be handled automatically.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="schedulePost"
                    checked={advancedOptions.schedulePost}
                    onCheckedChange={(checked) => 
                      onAdvancedOptionsChange({ schedulePost: checked as boolean })
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="schedulePost"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Schedule this post
                    </label>
                    <Input 
                      type="datetime-local" 
                      className="mt-2 w-full max-w-xs" 
                      disabled={!advancedOptions.schedulePost}
                      onChange={(e) => onAdvancedOptionsChange({ 
                        scheduledTime: e.target.value ? new Date(e.target.value) : undefined 
                      })}
                    />
                  </div>
                </div>
                
                {/* Platform Customization */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Platform Settings</h4>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="grid gap-1.5 leading-none flex-1">
                      <label
                        htmlFor="mastodonCharLimit"
                        className="text-sm font-medium leading-none"
                      >
                        Mastodon Character Limit
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Override the default character limit for your Mastodon instance
                      </p>
                      <div className="flex items-center mt-2 gap-2">
                        <Input 
                          id="mastodonCharLimit" 
                          type="number" 
                          min="100"
                          max="10000"
                          className="w-28" 
                          placeholder="500"
                          defaultValue={advancedOptions.customMastodonLimit || 500}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value && !isNaN(value) && value >= 100) {
                              // Save to localStorage
                              localStorage.setItem('customMastodonLimit', value.toString());
                              // Update state
                              onAdvancedOptionsChange({ customMastodonLimit: value });
                            }
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Remove from localStorage
                            localStorage.removeItem('customMastodonLimit');
                            // Reset to default
                            onAdvancedOptionsChange({ customMastodonLimit: 500 });
                          }}
                        >
                          Reset to Default
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Developer Options */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-medium mb-3">Developer Options</h4>
                  <div className="flex items-start space-x-2">
                    <Checkbox 
                      id="showRawJson"
                      checked={advancedOptions.showRawJson}
                      onCheckedChange={(checked) => {
                        // Save to localStorage
                        localStorage.setItem('showRawJson', JSON.stringify(checked));
                        // Update state
                        onAdvancedOptionsChange({ showRawJson: checked as boolean });
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="showRawJson"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Show raw JSON from AI responses
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Displays the raw JSON received from OpenAI API for debugging purposes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Reset All Settings Button */}
              <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    // Clear localStorage settings
                    localStorage.removeItem('customMastodonLimit');
                    localStorage.removeItem('showRawJson');
                    localStorage.removeItem('savedSplittingConfigs');
                    
                    // Reset state
                    onAdvancedOptionsChange({
                      customMastodonLimit: 500,
                      showRawJson: false,
                      useThreadNotation: true,
                      threadNotationFormat: "(x/y)",
                      schedulePost: false,
                      scheduledTime: undefined
                    });
                    
                    // Show confirmation toast
                    // If there's a toast mechanism, use it here
                    alert('All settings have been reset to default values');
                  }}
                >
                  Reset All Settings
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        
        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSaveAsDraft}
            disabled={!isFormValid || isPendingDraft || isPendingPost}
          >
            <UIIcon.Save className="mr-1 h-4 w-4" /> Save Draft
          </Button>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={onResetForm}
              disabled={isPendingDraft || isPendingPost}
            >
              <UIIcon.Undo className="mr-1 h-4 w-4" /> Reset
            </Button>
            <Button 
              type="submit" 
              disabled={!isFormValid || isPendingDraft || isPendingPost}
            >
              <UIIcon.Send className="mr-1 h-4 w-4" /> Post Now
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
