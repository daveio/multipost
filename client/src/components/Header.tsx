import { SocialIcon, UIIcon } from "./SocialIcons";
import { Button } from "@/components/ui/button";
import { Moon, Palette, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useCatppuccinTheme } from "./theme/catppuccin-theme-provider";
import { ThemeSelector } from "./theme/theme-selector";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const { theme, setTheme, mode, lightThemes, darkThemes } = useCatppuccinTheme();

  // Toggle between light and dark mode
  const toggleDarkMode = () => {
    // If in light mode, switch to dark (mocha)
    // If in dark mode, switch to light (latte)
    const newTheme = mode === "light" ? "mocha" : "latte";
    setTheme(newTheme);
  };

  return (
    <header className="bg-card shadow-sm border-b border-border">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <SocialIcon platform="multipost" className="text-primary" size={24} />
          <h1 className="text-xl font-semibold text-foreground">Multipost</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle Button */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
            title={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
          >
            {mode === "light" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">Toggle dark mode</span>
          </Button>

          {/* Theme Selector */}
          <ThemeSelector />

          {/* Settings Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UIIcon.Settings className="mr-1 h-4 w-4" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {mode === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>Dark Mode</span>
                </div>
                <Switch 
                  checked={mode === "dark"} 
                  onCheckedChange={toggleDarkMode} 
                />
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span>Theme</span>
                </div>
                <span className="text-xs font-medium capitalize">{theme}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
