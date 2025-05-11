import { createContext, useContext, useEffect, useState } from "react";
import { flavors } from "@catppuccin/palette";
import { createTheme, CatppuccinTheme as ThemeType, ThemeMode as ModeType } from "@/lib/theme-utils";

// Re-export the types with our own names
export type CatppuccinTheme = ThemeType;
export type ThemeMode = ModeType;

// Theme context interface
interface ThemeContextType {
  theme: CatppuccinTheme;
  setTheme: (theme: CatppuccinTheme) => void;
  mode: ThemeMode;
  allThemes: CatppuccinTheme[];
  lightThemes: CatppuccinTheme[];
  darkThemes: CatppuccinTheme[];
}

// Create theme context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "mocha",
  setTheme: () => {},
  mode: "dark", 
  allThemes: ["latte", "frappe", "macchiato", "mocha"],
  lightThemes: ["latte"],
  darkThemes: ["frappe", "macchiato", "mocha"]
});

// Local storage key for theme
const THEME_STORAGE_KEY = "catppuccin-theme";

// Theme provider props
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: CatppuccinTheme;
}

export function CatppuccinThemeProvider({
  children,
  defaultTheme = "mocha"
}: ThemeProviderProps) {
  // Define available themes
  const allThemes: CatppuccinTheme[] = ["latte", "frappe", "macchiato", "mocha"];
  const lightThemes: CatppuccinTheme[] = ["latte"];
  const darkThemes: CatppuccinTheme[] = ["frappe", "macchiato", "mocha"];

  // Initialize theme state
  const [theme, setThemeState] = useState<CatppuccinTheme>(() => {
    // Check for saved theme in localStorage
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme && ["latte", "frappe", "macchiato", "mocha"].includes(savedTheme)) {
      return savedTheme as CatppuccinTheme;
    }
    return defaultTheme;
  });

  // Get theme mode (light or dark)
  const mode: ThemeMode = lightThemes.includes(theme) ? "light" : "dark";
  
  // Set theme and save to localStorage
  const setTheme = (newTheme: CatppuccinTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
  };

  // Apply theme to document when theme changes
  useEffect(() => {
    // Apply the dark mode class to document
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Set theme attribute
    document.documentElement.setAttribute("data-theme", theme);
    
    // Apply theme CSS variables to document root
    const themeVars = createTheme(theme);
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [theme, mode]);

  // Context value
  const value = {
    theme,
    setTheme,
    mode,
    allThemes,
    lightThemes,
    darkThemes,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useCatppuccinTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useCatppuccinTheme must be used within a CatppuccinThemeProvider");
  }
  return context;
}