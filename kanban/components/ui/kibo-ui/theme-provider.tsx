"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mounted, setMounted] = useState(false);

  // Function to update theme
  const applyTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(newTheme);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Add transition prevention class if enabled
    if (disableTransitionOnChange) {
      document.documentElement.classList.add("disable-transitions");
      window.setTimeout(() => {
        document.documentElement.classList.remove("disable-transitions");
      }, 0);
    }

    applyTheme(theme);

    // Update the attribute
    const attr = attribute === "class" ? "className" : attribute;
    if (attr !== "className") {
      document.documentElement.setAttribute(attr, theme);
    }
  }, [theme, mounted, attribute, disableTransitionOnChange]);

  // Listen for system preference changes
  useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [enableSystem, theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => setTheme(newTheme),
  };

  // This prevents the UI flashing on first render
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}; 