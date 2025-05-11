import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThreadPost } from "../types";
import { AlignJustify, ArrowLeft, ArrowRight, Maximize2, Minimize2, Pencil, Plus, Trash2, XCircle } from "lucide-react";

interface ThreadPostsManagerProps {
  threadPosts: ThreadPost[];
  activeIndex: number;
  onSwitchPost: (index: number) => void;
  onAddPost: (content?: string) => void;
  onRemovePost: (index: number) => void;
  onContentChange: (content: string) => void;
  onExit: () => void;
}

export function ThreadPostsManager({
  threadPosts,
  activeIndex,
  onSwitchPost,
  onAddPost,
  onRemovePost,
  onContentChange,
  onExit
}: ThreadPostsManagerProps) {
  const [expandedView, setExpandedView] = useState(false);
  
  // Handle content change for the active post
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    onContentChange(newContent);
    
    // Also update the thread post content
    const updatedPost = {
      ...threadPosts[activeIndex],
      content: newContent
    };
  };
  
  return (
    <div className="space-y-4">
      {/* Thread header and controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs">
            <AlignJustify className="mr-1 h-3 w-3" />
            Thread Mode
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            {threadPosts.length} {threadPosts.length === 1 ? 'post' : 'posts'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
          >
            {expandedView ? (
              <>
                <Minimize2 className="mr-1 h-4 w-4" />
                Collapse
              </>
            ) : (
              <>
                <Maximize2 className="mr-1 h-4 w-4" />
                Expand
              </>
            )}
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onAddPost()}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Post
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={onExit}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Exit Thread
          </Button>
        </div>
      </div>
      
      {/* Post navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {threadPosts.map((post, index) => (
          <Button
            key={`thread-post-${index}`}
            variant={activeIndex === index ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0"
            onClick={() => onSwitchPost(index)}
          >
            Post {index + 1}
            {index === 0 && (
              <span className="ml-1 text-xs opacity-75">(first)</span>
            )}
            {index === threadPosts.length - 1 && index > 0 && (
              <span className="ml-1 text-xs opacity-75">(last)</span>
            )}
          </Button>
        ))}
      </div>
      
      {/* Expanded view of all posts */}
      {expandedView && (
        <div className="space-y-3 mt-4 rounded-lg border p-4 bg-muted/30">
          <h3 className="text-sm font-medium mb-2">All Posts in Thread</h3>
          {threadPosts.map((post, index) => (
            <Card 
              key={`expanded-post-${index}`}
              className={`p-3 relative ${activeIndex === index ? 'border-primary' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant={activeIndex === index ? "default" : "outline"}>
                  Post {index + 1}/{threadPosts.length}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onSwitchPost(index)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => onRemovePost(index)}
                    disabled={threadPosts.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {post.content || <span className="text-muted-foreground italic">Empty post</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Current post editor */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="bg-background">
            Editing Post {activeIndex + 1}/{threadPosts.length}
          </Badge>
        </div>
        <Textarea
          value={threadPosts[activeIndex]?.content || ''}
          onChange={handleContentChange}
          placeholder={`Write content for post ${activeIndex + 1}...`}
          className="min-h-[150px]"
        />
        {threadPosts.length > 1 && (
          <div className="flex justify-end mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemovePost(activeIndex)}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove This Post
            </Button>
          </div>
        )}
      </div>
      
      {/* Post navigator (bottom) */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={activeIndex === 0}
          onClick={() => onSwitchPost(activeIndex - 1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Previous Post
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={activeIndex >= threadPosts.length - 1}
          onClick={() => onSwitchPost(activeIndex + 1)}
        >
          Next Post
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}