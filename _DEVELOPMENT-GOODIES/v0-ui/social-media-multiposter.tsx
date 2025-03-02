"use client";

import type React from "react";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Platform character limits
const PLATFORM_LIMITS = {
  bluesky: 300,
  mastodon: 500,
  threads: 500,
  facebook: 63206,
  x: 280,
};

export default function SocialMediaMultiposter() {
  const [content, setContent] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    bluesky: true,
    mastodon: true,
    threads: true,
    facebook: true,
    x: true,
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const togglePlatform = (platform: keyof typeof PLATFORM_LIMITS) => {
    setSelectedPlatforms({
      ...selectedPlatforms,
      [platform]: !selectedPlatforms[platform],
    });
  };

  const getProgressColor = (count: number, limit: number) => {
    const percentage = (count / limit) * 100;
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 90) return "bg-amber-500";
    return "bg-primary";
  };

  const canPost = () => {
    return (
      Object.keys(selectedPlatforms).some(
        (platform) =>
          selectedPlatforms[platform as keyof typeof selectedPlatforms],
      ) &&
      content.length > 0 &&
      Object.keys(selectedPlatforms).every(
        (platform) =>
          !selectedPlatforms[platform as keyof typeof selectedPlatforms] ||
          content.length <=
            PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS],
      )
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Social Media Multiposter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          className="min-h-[150px] text-base"
          value={content}
          onChange={handleContentChange}
        />

        <div className="grid gap-4 pt-4">
          <h3 className="text-lg font-medium">Platforms</h3>
          <div className="grid gap-6">
            {Object.entries(PLATFORM_LIMITS).map(([platform, limit]) => {
              const count = content.length;
              const isOverLimit = count > limit;
              const percentage = Math.min((count / limit) * 100, 100);

              return (
                <div key={platform} className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={platform}
                        checked={
                          selectedPlatforms[
                            platform as keyof typeof selectedPlatforms
                          ]
                        }
                        onCheckedChange={() =>
                          togglePlatform(
                            platform as keyof typeof PLATFORM_LIMITS,
                          )
                        }
                      />
                      <Label
                        htmlFor={platform}
                        className="capitalize font-medium"
                      >
                        {platform}
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`text-sm ${isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}`}
                      >
                        {count}/{limit}
                      </span>
                      {isOverLimit ? (
                        <X className="w-4 h-4 ml-1 text-destructive" />
                      ) : (
                        <Check className="w-4 h-4 ml-1 text-green-500" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2"
                    indicatorClassName={getProgressColor(count, limit)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg" disabled={!canPost()}>
          Post to Selected Platforms
        </Button>
      </CardFooter>
    </Card>
  );
}
