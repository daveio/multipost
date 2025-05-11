import { flavors } from "@catppuccin/palette";

// Valid theme names
export type CatppuccinFlavor = keyof typeof flavors;
export type CatppuccinTheme = "latte" | "frappe" | "macchiato" | "mocha";
export type ThemeMode = "light" | "dark";

// Convert HSL to CSS HSL value
const hslToVar = (hsl: { h: number; s: number; l: number }): string => {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%`;
};

// Create a mapping of Catppuccin colors to CSS variables
export const createTheme = (flavor: CatppuccinTheme): Record<string, string> => {
  const flavorData = flavors[flavor];
  const themeVars: Record<string, string> = {};
  
  // Base colors - use crust for backgrounds to get better contrast
  themeVars["--background"] = hslToVar(flavorData.colors.crust.hsl);
  themeVars["--foreground"] = hslToVar(flavorData.colors.text.hsl);
  
  // Primary colors - use blue for primary actions
  themeVars["--primary"] = hslToVar(flavorData.colors.blue.hsl);
  themeVars["--primary-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.mantle.hsl);
  
  // Secondary colors - use mauve for secondary elements
  themeVars["--secondary"] = hslToVar(flavorData.colors.mauve.hsl);
  themeVars["--secondary-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.mantle.hsl);
  
  // Accent colors - use pink for accent elements
  themeVars["--accent"] = hslToVar(flavorData.colors.pink.hsl);
  themeVars["--accent-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.mantle.hsl);
  
  // UI colors - use mantle (slightly lighter than crust) for cards
  themeVars["--card"] = hslToVar(flavorData.colors.mantle.hsl);
  themeVars["--card-foreground"] = hslToVar(flavorData.colors.text.hsl);
  
  // Popover is even lighter than card
  themeVars["--popover"] = hslToVar(flavorData.colors.base.hsl);
  themeVars["--popover-foreground"] = hslToVar(flavorData.colors.text.hsl);
  
  // Muted tones
  themeVars["--muted"] = hslToVar(flavorData.colors.surface0.hsl);
  themeVars["--muted-foreground"] = hslToVar(flavorData.colors.subtext0.hsl);
  
  // Form controls
  themeVars["--border"] = hslToVar(flavorData.colors.surface1.hsl);
  themeVars["--input"] = hslToVar(flavorData.colors.surface0.hsl);
  
  // Destructive/error colors
  themeVars["--destructive"] = hslToVar(flavorData.colors.red.hsl);
  themeVars["--destructive-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.mantle.hsl);
  
  // Ring/focus colors
  themeVars["--ring"] = hslToVar(flavorData.colors.blue.hsl);
  
  // Chart colors
  themeVars["--chart-1"] = hslToVar(flavorData.colors.blue.hsl);
  themeVars["--chart-2"] = hslToVar(flavorData.colors.mauve.hsl);
  themeVars["--chart-3"] = hslToVar(flavorData.colors.pink.hsl);
  themeVars["--chart-4"] = hslToVar(flavorData.colors.peach.hsl);
  themeVars["--chart-5"] = hslToVar(flavorData.colors.green.hsl);
  
  return themeVars;
};

// Get user preferred color scheme
export const getPreferredColorScheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

// Get a theme name based on user preference
export const getPreferredTheme = (): CatppuccinTheme => {
  const prefersDark = getPreferredColorScheme() === "dark";
  return prefersDark ? "frappe" : "latte";
};