import { useCatppuccinTheme } from "./catppuccin-theme-provider";
import type { CatppuccinTheme } from "@/lib/theme-utils";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Check, Coffee, Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { theme, setTheme, allThemes, lightThemes, darkThemes } = useCatppuccinTheme();

  // Get friendly display name for theme
  const getThemeDisplayName = (themeName: string) => {
    return themeName.charAt(0).toUpperCase() + themeName.slice(1);
  };

  // Get icon based on theme category
  const getThemeIcon = (themeName: string) => {
    if (themeName === "latte") return <Sun className="h-4 w-4" />;
    if (themeName === "mocha") return <Moon className="h-4 w-4" />;
    return <Coffee className="h-4 w-4" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn("w-8 h-8 rounded-full", className)}
          title="Change theme"
        >
          <Palette className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Catppuccin Themes</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Light Themes */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Light Theme
        </DropdownMenuLabel>
        {lightThemes.map((themeName) => (
          <DropdownMenuItem 
            key={themeName}
            onClick={() => setTheme(themeName)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {getThemeIcon(themeName)}
              <span>{getThemeDisplayName(themeName)}</span>
            </div>
            {theme === themeName && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Dark Themes */}
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Dark Themes
        </DropdownMenuLabel>
        {darkThemes.map((themeName) => (
          <DropdownMenuItem 
            key={themeName}
            onClick={() => setTheme(themeName)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {getThemeIcon(themeName)}
              <span>{getThemeDisplayName(themeName)}</span>
            </div>
            {theme === themeName && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}