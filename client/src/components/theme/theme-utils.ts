import { flavors } from "@catppuccin/palette";
import type { CatppuccinTheme } from "./catppuccin-theme-provider";

// Convert HSL to CSS HSL value
const hslToVar = (hsl: { h: number; s: number; l: number }): string => {
  return `${Math.round(hsl.h)} ${Math.round(hsl.s * 100)}% ${Math.round(hsl.l * 100)}%`;
};

// Convert RGB to HSL
const rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h = h / 6;
  }

  return { 
    h: h * 360, 
    s: s, 
    l: l 
  };
};

// Convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// Create a mapping of Catppuccin colors to CSS variables
export const createTheme = (flavor: CatppuccinTheme): Record<string, string> => {
  const flavorData = flavors[flavor];
  const themeVars: Record<string, string> = {};
  
  // Base colors
  themeVars["--background"] = hslToVar(flavorData.colors.base.hsl);
  themeVars["--foreground"] = hslToVar(flavorData.colors.text.hsl);
  
  // Primary colors
  themeVars["--primary"] = hslToVar(flavorData.colors.blue.hsl);
  themeVars["--primary-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.surface0.hsl);
  
  // Secondary colors
  themeVars["--secondary"] = hslToVar(flavorData.colors.mauve.hsl);
  themeVars["--secondary-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.surface0.hsl);
  
  // Accent colors
  themeVars["--accent"] = hslToVar(flavorData.colors.pink.hsl);
  themeVars["--accent-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.surface0.hsl);
  
  // UI colors
  themeVars["--card"] = hslToVar(flavorData.colors.mantle.hsl);
  themeVars["--card-foreground"] = hslToVar(flavorData.colors.text.hsl);
  
  themeVars["--popover"] = hslToVar(flavorData.colors.surface0.hsl);
  themeVars["--popover-foreground"] = hslToVar(flavorData.colors.text.hsl);
  
  themeVars["--muted"] = hslToVar(flavorData.colors.surface1.hsl);
  themeVars["--muted-foreground"] = hslToVar(flavorData.colors.subtext1.hsl);
  
  themeVars["--border"] = hslToVar(flavorData.colors.surface1.hsl);
  themeVars["--input"] = hslToVar(flavorData.colors.surface1.hsl);
  
  // Destructive/error colors
  themeVars["--destructive"] = hslToVar(flavorData.colors.red.hsl);
  themeVars["--destructive-foreground"] = flavor === "latte" 
    ? hslToVar(flavorData.colors.crust.hsl) 
    : hslToVar(flavorData.colors.surface0.hsl);
  
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
  return prefersDark ? "mocha" : "latte";
};