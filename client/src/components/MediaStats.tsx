import { MediaFile } from "../types";
import { SocialIcon, UIIcon } from "./SocialIcons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatFileSize } from "../lib/platform-config";

interface MediaStatsProps {
  mediaFiles: MediaFile[];
}

export function MediaStats({ mediaFiles }: MediaStatsProps) {
  if (mediaFiles.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Media Status</h2>
        <p className="text-sm text-muted-foreground">No media files attached to this post.</p>
      </div>
    );
  }

  // For demo purposes, we'll assume all files are compatible with all platforms
  const platforms = ["bluesky", "mastodon", "threads"];

  return (
    <div className="bg-card rounded-xl shadow-sm p-6 border border-border">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Media Status</h2>
      <div className="space-y-4">
        {mediaFiles.map((file) => (
          <Card key={file.id} className="border border-border bg-muted">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-card">
                  <img 
                    src={file.previewUrl || file.url} 
                    alt={file.name} 
                    className="object-cover w-full h-full" 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-foreground">{file.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.type}
                  </p>
                </div>
              </div>
              
              {/* Platform Compatibility */}
              <div className="mt-2">
                <h4 className="text-xs font-medium mb-1 text-foreground">Platform Compatibility</h4>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((platform) => (
                    <Badge key={platform} variant="success" className="gap-1 text-xs">
                      <UIIcon.Check className="h-3 w-3 platform-badge-check" />
                      <span className="capitalize">{platform}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* Platform Media Requirements */}
        <Accordion type="single" collapsible className="mt-4 border border-border rounded-lg bg-muted">
          <AccordionItem value="requirements" className="border-0">
            <AccordionTrigger className="text-sm font-medium px-4 text-foreground">
              Platform Media Requirements
            </AccordionTrigger>
            <AccordionContent className="text-xs px-4 pb-4">
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <SocialIcon platform="bluesky" className="text-primary mt-1" />
                  <div>
                    <span className="font-medium text-foreground">Bluesky:</span>
                    <p className="text-muted-foreground">Up to 4 images, max 10MB each. JPG, PNG, GIF. No video support.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <SocialIcon platform="mastodon" className="text-secondary mt-1" />
                  <div>
                    <span className="font-medium text-foreground">Mastodon:</span>
                    <p className="text-muted-foreground">Up to 4 images, max 16MB each. JPG, PNG, GIF, WebP. Videos up to 40MB.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <SocialIcon platform="threads" className="text-accent mt-1" />
                  <div>
                    <span className="font-medium text-foreground">Threads:</span>
                    <p className="text-muted-foreground">Up to 10 images, JPG, PNG. Videos up to 2 minutes.</p>
                  </div>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
