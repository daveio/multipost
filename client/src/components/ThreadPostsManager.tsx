import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThreadPost } from "../types";
import { AlignJustify, ArrowLeft, ArrowRight, Maximize2, Minimize2, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

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
  const { toast } = useToast();
  const [expandedView, setExpandedView] = useState(false);
  const [localPosts, setLocalPosts] = useState<ThreadPost[]>([]);
  const [localContent, setLocalContent] = useState("");
  
  // Keep track of our own synchronized copy of the posts
  useEffect(() => {
    // Only do a full reset when needed
    const needsReset = threadPosts.length !== localPosts.length || 
                       !localPosts[activeIndex] || 
                       (localPosts[activeIndex] && localPosts[activeIndex].order !== activeIndex);
    
    if (needsReset) {
      console.log("Resetting local posts state", { threadPosts, activeIndex });
      const freshLocalPosts = JSON.parse(JSON.stringify(threadPosts));
      setLocalPosts(freshLocalPosts);
      
      // Set the local content to match the active post
      if (freshLocalPosts[activeIndex]) {
        setLocalContent(freshLocalPosts[activeIndex].content || "");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadPosts, activeIndex]); // Deliberately excluding localPosts to prevent loops
  
  // When switching posts, save content for previous post first
  const handleSwitchPost = (newIndex: number) => {
    try {
      // Save current content to local posts first
      const updatedPosts = [...localPosts];
      if (updatedPosts[activeIndex]) {
        updatedPosts[activeIndex] = {
          ...updatedPosts[activeIndex],
          content: localContent
        };
      }
      
      // Update local content to the new post
      const newContent = updatedPosts[newIndex]?.content || "";
      setLocalContent(newContent);
      setLocalPosts(updatedPosts);
      
      // Notify parent component
      onContentChange(newContent);
      onSwitchPost(newIndex);
    } catch (error) {
      console.error("Error switching posts:", error);
      toast({
        title: "Error Switching Posts",
        description: "There was a problem switching between posts.",
        variant: "destructive"
      });
    }
  };
  
  // Handle content change for the active post
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    
    // Save to local state first
    setLocalContent(newContent);
    
    // Update the local posts array
    const updatedPosts = [...localPosts];
    if (updatedPosts[activeIndex]) {
      updatedPosts[activeIndex] = {
        ...updatedPosts[activeIndex],
        content: newContent
      };
      setLocalPosts(updatedPosts);
    }
    
    // Update the global content state which triggers re-renders
    onContentChange(newContent);
  };
  
  // Handle adding a new post with proper data synchronization
  const handleAddPost = () => {
    try {
      // Save current content first
      const updatedPosts = [...localPosts];
      if (updatedPosts[activeIndex]) {
        updatedPosts[activeIndex] = {
          ...updatedPosts[activeIndex],
          content: localContent
        };
      }
      setLocalPosts(updatedPosts);
      
      // Let parent handle the actual post creation
      onAddPost();
    } catch (error) {
      console.error("Error adding post:", error);
      toast({
        title: "Error Adding Post",
        description: "There was a problem adding a new post.",
        variant: "destructive"
      });
    }
  };
  
  // Handle removing a post with proper data synchronization
  const handleRemovePost = (index: number) => {
    try {
      // Save current content first
      const updatedPosts = [...localPosts];
      if (updatedPosts[activeIndex]) {
        updatedPosts[activeIndex] = {
          ...updatedPosts[activeIndex],
          content: localContent
        };
      }
      setLocalPosts(updatedPosts);
      
      // Let parent handle the post removal
      onRemovePost(index);
    } catch (error) {
      console.error("Error removing post:", error);
      toast({
        title: "Error Removing Post",
        description: "There was a problem removing the post.",
        variant: "destructive"
      });
    }
  };
  
  // Handle exiting thread mode with proper data synchronization
  const handleExit = () => {
    try {
      // Save current content first
      const updatedPosts = [...localPosts];
      if (updatedPosts[activeIndex]) {
        updatedPosts[activeIndex] = {
          ...updatedPosts[activeIndex],
          content: localContent
        };
      }
      setLocalPosts(updatedPosts);
      
      // Let parent handle exiting thread mode
      onExit();
    } catch (error) {
      console.error("Error exiting thread mode:", error);
      toast({
        title: "Error Exiting Thread Mode",
        description: "There was a problem exiting thread mode.",
        variant: "destructive"
      });
    }
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
            {localPosts.length} {localPosts.length === 1 ? 'post' : 'posts'}
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
            onClick={handleAddPost}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Post
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleExit}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Exit Thread
          </Button>
        </div>
      </div>
      
      {/* Post navigator */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {localPosts.map((post, index) => (
          <Button
            key={`thread-post-${index}`}
            variant={activeIndex === index ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0"
            onClick={() => handleSwitchPost(index)}
          >
            Post {index + 1}
            {index === 0 && (
              <span className="ml-1 text-xs opacity-75">(first)</span>
            )}
            {index === localPosts.length - 1 && index > 0 && (
              <span className="ml-1 text-xs opacity-75">(last)</span>
            )}
          </Button>
        ))}
      </div>
      
      {/* Expanded view of all posts */}
      {expandedView && (
        <div className="space-y-3 mt-4 rounded-lg border p-4 bg-muted/30">
          <h3 className="text-sm font-medium mb-2">All Posts in Thread</h3>
          {localPosts.map((post, index) => (
            <Card 
              key={`expanded-post-${index}`}
              className={`p-3 relative ${activeIndex === index ? 'border-primary' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant={activeIndex === index ? "default" : "outline"}>
                  Post {index + 1}/{localPosts.length}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleSwitchPost(index)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemovePost(index)}
                    disabled={localPosts.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {index === activeIndex ? localContent : (post.content || <span className="text-muted-foreground italic">Empty post</span>)}
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Current post editor */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="bg-background">
            Editing Post {activeIndex + 1}/{localPosts.length}
          </Badge>
        </div>
        <Textarea
          value={localContent}
          onChange={handleContentChange}
          placeholder={`Write content for post ${activeIndex + 1}...`}
          className="min-h-[150px]"
        />
        {localPosts.length > 1 && (
          <div className="flex justify-end mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemovePost(activeIndex)}
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
          onClick={() => handleSwitchPost(activeIndex - 1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Previous Post
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={activeIndex >= localPosts.length - 1}
          onClick={() => handleSwitchPost(activeIndex + 1)}
        >
          Next Post
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}