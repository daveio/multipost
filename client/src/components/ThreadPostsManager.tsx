import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ThreadPost } from "../types";
import { AlignJustify, ArrowLeft, ArrowRight, Maximize2, Minimize2, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Add a unique key for local storage
const THREAD_STORAGE_KEY = "multipost_thread_state";

interface ThreadPostsManagerProps {
  threadPosts: ThreadPost[];
  activeIndex: number;
  onSwitchPost: (index: number) => void;
  onAddPost: (content?: string) => void;
  onRemovePost: (index: number) => void;
  onContentChange: (content: string) => void;
  onExit: () => void;
}

interface ThreadState {
  posts: ThreadPost[];
  activeIndex: number;
  currentContent: string;
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
  
  // Initialize or restore thread state from localStorage
  const initializeThreadState = (): ThreadState => {
    try {
      // Try to get stored state
      const savedState = localStorage.getItem(THREAD_STORAGE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState) as ThreadState;
        
        // Only use saved state if the post count is the same, otherwise use props
        if (parsedState.posts.length === threadPosts.length) {
          console.log("Restored thread state from localStorage");
          return parsedState;
        }
      }
    } catch (error) {
      console.error("Error retrieving thread state:", error);
    }
    
    // Default to props if no saved state or error
    return {
      posts: JSON.parse(JSON.stringify(threadPosts)),
      activeIndex: activeIndex,
      currentContent: threadPosts[activeIndex]?.content || ""
    };
  };
  
  // Unified thread state
  const [threadState, setThreadState] = useState<ThreadState>(initializeThreadState);
  
  // Save thread state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(threadState));
    } catch (error) {
      console.error("Error saving thread state:", error);
    }
  }, [threadState]);
  
  // Handle syncing with parent component
  useEffect(() => {
    // Only reset completely if length changes (new thread or exit)
    if (threadPosts.length !== threadState.posts.length) {
      console.log("Thread posts count changed, reinitializing", {
        threadPosts: threadPosts.length,
        threadState: threadState.posts.length
      });
      setThreadState(initializeThreadState());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadPosts.length]);
  
  // When switching posts, save content for previous post first
  const handleSwitchPost = (newIndex: number) => {
    try {
      if (newIndex < 0 || newIndex >= threadState.posts.length) {
        return; // Invalid index
      }
      
      // Update the thread state with current content before switching
      setThreadState(prev => {
        const updatedPosts = [...prev.posts];
        
        // Save current content to current post
        updatedPosts[prev.activeIndex] = {
          ...updatedPosts[prev.activeIndex],
          content: prev.currentContent
        };
        
        // Get content from target post
        const newContent = updatedPosts[newIndex].content || "";
        
        // Update parent state
        onContentChange(newContent);
        onSwitchPost(newIndex);
        
        return {
          posts: updatedPosts,
          activeIndex: newIndex,
          currentContent: newContent
        };
      });
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
    
    // Update thread state with new content
    setThreadState(prev => {
      // Also update the posts array
      const updatedPosts = [...prev.posts];
      updatedPosts[prev.activeIndex] = {
        ...updatedPosts[prev.activeIndex],
        content: newContent
      };
      
      // Update parent state
      onContentChange(newContent);
      
      return {
        ...prev,
        posts: updatedPosts,
        currentContent: newContent
      };
    });
  };
  
  // Handle adding a new post with proper data synchronization
  const handleAddPost = () => {
    try {
      // Save current state to localStorage before adding new post
      setThreadState(prev => {
        const updatedPosts = [...prev.posts];
        updatedPosts[prev.activeIndex] = {
          ...updatedPosts[prev.activeIndex],
          content: prev.currentContent
        };
        
        // Let parent handle the actual post creation
        // but pass the current content to ensure it's preserved
        onAddPost(prev.currentContent);
        
        return {
          ...prev,
          posts: updatedPosts
        };
      });
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
      // Save the current state before removing
      setThreadState(prev => {
        const updatedPosts = [...prev.posts];
        updatedPosts[prev.activeIndex] = {
          ...updatedPosts[prev.activeIndex],
          content: prev.currentContent
        };
        
        // Let parent handle the actual post removal
        onRemovePost(index);
        
        return {
          ...prev,
          posts: updatedPosts
        };
      });
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
      // Save the current content before exiting
      if (threadState.posts[threadState.activeIndex]) {
        // Create a final snapshot that will be saved to localStorage
        const finalState = {
          ...threadState,
          posts: threadState.posts.map((post, idx) => ({
            ...post,
            content: idx === threadState.activeIndex 
              ? threadState.currentContent 
              : post.content
          }))
        };
        
        // Save to localStorage before exit
        localStorage.setItem(THREAD_STORAGE_KEY, JSON.stringify(finalState));
        
        // Tell parent the final content to maintain
        onContentChange(threadState.currentContent);
        
        // Now exit
        onExit();
      } else {
        onExit();
      }
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
            {threadState.posts.length} {threadState.posts.length === 1 ? 'post' : 'posts'}
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
        {threadState.posts.map((post, index) => (
          <Button
            key={`thread-post-${index}`}
            variant={threadState.activeIndex === index ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0"
            onClick={() => handleSwitchPost(index)}
          >
            Post {index + 1}
            {index === 0 && (
              <span className="ml-1 text-xs opacity-75">(first)</span>
            )}
            {index === threadState.posts.length - 1 && index > 0 && (
              <span className="ml-1 text-xs opacity-75">(last)</span>
            )}
          </Button>
        ))}
      </div>
      
      {/* Expanded view of all posts */}
      {expandedView && (
        <div className="space-y-3 mt-4 rounded-lg border p-4 bg-muted/30">
          <h3 className="text-sm font-medium mb-2">All Posts in Thread</h3>
          {threadState.posts.map((post, index) => (
            <Card 
              key={`expanded-post-${index}`}
              className={`p-3 relative ${threadState.activeIndex === index ? 'border-primary' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <Badge variant={threadState.activeIndex === index ? "default" : "outline"}>
                  Post {index + 1}/{threadState.posts.length}
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
                    disabled={threadState.posts.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <div className="text-sm whitespace-pre-wrap break-words">
                {index === threadState.activeIndex 
                  ? threadState.currentContent 
                  : (post.content || <span className="text-muted-foreground italic">Empty post</span>)
                }
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* Current post editor */}
      <div className="relative">
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="outline" className="bg-background">
            Editing Post {threadState.activeIndex + 1}/{threadState.posts.length}
          </Badge>
        </div>
        <Textarea
          value={threadState.currentContent}
          onChange={handleContentChange}
          placeholder={`Write content for post ${threadState.activeIndex + 1}...`}
          className="min-h-[150px]"
        />
        {threadState.posts.length > 1 && (
          <div className="flex justify-end mt-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemovePost(threadState.activeIndex)}
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
          disabled={threadState.activeIndex === 0}
          onClick={() => handleSwitchPost(threadState.activeIndex - 1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Previous Post
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={threadState.activeIndex >= threadState.posts.length - 1}
          onClick={() => handleSwitchPost(threadState.activeIndex + 1)}
        >
          Next Post
          <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}