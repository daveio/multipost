import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { UIIcon } from "./SocialIcons";
import { MediaFile } from "../types";
import { cn } from "@/lib/utils";

interface MediaUploaderProps {
  mediaFiles: MediaFile[];
  isPendingUpload: boolean;
  onUpload: (files: File[]) => void;
  onRemove: (fileId: string) => void;
}

export function MediaUploader({ 
  mediaFiles, 
  isPendingUpload, 
  onUpload, 
  onRemove 
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUpload(files);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onUpload(files);
    }
  };

  return (
    <div 
      className={cn(
        "border-2 border-dashed rounded-lg p-4 mb-6",
        isDragging ? "border-primary bg-primary/5" : "border-gray-300",
        isPendingUpload && "opacity-70 pointer-events-none"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {mediaFiles.length === 0 ? (
        <div className="text-center" id="uploadPrompt">
          <UIIcon.Upload className="mx-auto text-gray-400 h-12 w-12 mb-2" />
          <p className="text-gray-500 mb-2">Drag and drop media files here or</p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleUploadClick}
            disabled={isPendingUpload}
          >
            <UIIcon.Upload className="mr-1 h-4 w-4" /> Upload Files
          </Button>
        </div>
      ) : (
        <div id="mediaPreviews">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium">Media to upload ({mediaFiles.length})</h4>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handleUploadClick}
              disabled={isPendingUpload}
            >
              <UIIcon.Upload className="mr-1 h-4 w-4" /> Add More
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3 media-preview">
            {mediaFiles.map((file) => (
              <div className="relative group" key={file.id}>
                <img 
                  src={file.previewUrl || file.url} 
                  alt={file.name} 
                  className="h-20 w-full rounded-md object-cover" 
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-md flex items-center justify-center">
                  <button 
                    type="button" 
                    className="opacity-0 group-hover:opacity-100 text-white text-lg"
                    onClick={() => onRemove(file.id)}
                    disabled={isPendingUpload}
                  >
                    <UIIcon.Close className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        multiple 
        accept="image/*,video/*" 
        onChange={handleFileChange}
        disabled={isPendingUpload}
      />
    </div>
  );
}
