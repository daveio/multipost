import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CatppuccinThemeProvider } from "@/components/theme";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Check localStorage for saved Catppuccin theme preference
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("catppuccin-theme");
    // Default to mocha (dark theme) if no preference is saved
    return (savedTheme as "latte" | "frappe" | "macchiato" | "mocha") || "mocha";
  };

  return (
    <CatppuccinThemeProvider defaultTheme={getInitialTheme()}>
      <TooltipProvider>
        <Router />
      </TooltipProvider>
    </CatppuccinThemeProvider>
  );
}

export default App;
