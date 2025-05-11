import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SplittingConfig } from '../types';
import { SplittingStrategy } from '@/lib/aiService';
import { UIIcon } from './SocialIcons';

interface SavedSplittingConfigsProps {
  selectedStrategies: SplittingStrategy[];
  savedConfigs: SplittingConfig[];
  onSaveConfig: (name: string) => void;
  onLoadConfig: (config: SplittingConfig) => void;
  onDeleteConfig: (configName: string) => void;
}

export function SavedSplittingConfigs({
  selectedStrategies,
  savedConfigs,
  onSaveConfig,
  onLoadConfig,
  onDeleteConfig
}: SavedSplittingConfigsProps) {
  const [configName, setConfigName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const handleSaveConfig = () => {
    // Don't save if name is empty or only whitespace
    if (!configName.trim()) return;
    
    onSaveConfig(configName);
    setConfigName('');
    setIsDialogOpen(false);
  };

  return (
    <div className="flex gap-2">
      {/* Save Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 gap-1"
            disabled={selectedStrategies.length === 0}
          >
            <UIIcon.Save className="h-3.5 w-3.5" />
            <span className="text-xs">Save Config</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Configuration</DialogTitle>
            <DialogDescription>
              Save your current splitting strategy selection for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-1">
              <Label htmlFor="configName">Configuration Name</Label>
              <Input
                id="configName"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Enter a name for this configuration"
                className="w-full"
              />
            </div>
            
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">
                Selected Strategies: {selectedStrategies.length}
              </Label>
              <div className="flex flex-wrap gap-1">
                {selectedStrategies.map(strategy => (
                  <span 
                    key={strategy} 
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                  >
                    {strategy}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              onClick={handleSaveConfig}
              disabled={!configName.trim()}
            >
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Load Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 gap-1"
            disabled={savedConfigs.length === 0}
          >
            <UIIcon.Refresh className="h-3.5 w-3.5" />
            <span className="text-xs">Load ({savedConfigs.length})</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {savedConfigs.map((config) => (
            <DropdownMenuItem 
              key={config.name}
              className="flex items-center justify-between"
              onClick={() => onLoadConfig(config)}
            >
              <span className="truncate max-w-[150px]">{config.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 rounded-full ml-2 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent click
                  onDeleteConfig(config.name);
                }}
              >
                <UIIcon.Delete className="h-3.5 w-3.5" />
                <span className="sr-only">Delete</span>
              </Button>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}