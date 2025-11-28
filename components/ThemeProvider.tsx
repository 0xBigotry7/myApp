"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get the current theme from DOM (set by the blocking script in layout.tsx)
function getInitialResolvedTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    return (localStorage.getItem("theme") as Theme) || "system";
  } catch {
    return "system";
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with the actual current state (from the blocking script)
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(getInitialResolvedTheme);

  // Get system preference
  const getSystemTheme = (): "light" | "dark" => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement;
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;
    
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    setResolvedTheme(resolved);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", resolved === "dark" ? "#0a0a0a" : "#fafafa");
    }
  };

  // Set theme and persist
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // Sync state on mount (in case SSR/hydration mismatch)
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = savedTheme || "system";
    
    // Only update if different to avoid unnecessary re-renders
    if (initialTheme !== theme) {
      setThemeState(initialTheme);
    }
    
    // Ensure DOM is in sync
    const currentResolved = document.documentElement.classList.contains("dark") ? "dark" : "light";
    if (currentResolved !== resolvedTheme) {
      setResolvedTheme(currentResolved);
    }

    // Listen for system preference changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = localStorage.getItem("theme") as Theme || "system";
      if (currentTheme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [theme, resolvedTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

