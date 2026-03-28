"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  forcedTheme,
}: {
  children: ReactNode;
  forcedTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (forcedTheme) return forcedTheme;
    return "light";
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This setState is intentional for mount detection and doesn't cause cascading renders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const activeTheme = forcedTheme || theme;

    if (activeTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    if (!forcedTheme) {
      localStorage.setItem("theme", activeTheme);
    }
  }, [theme, mounted, forcedTheme]);

  const toggleTheme = () => {
    if (forcedTheme) return; // Ignore toggle if theme is forced
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    if (forcedTheme) return; // Ignore set if theme is forced
    setThemeState(newTheme);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    const initialTheme = forcedTheme || "light";
    return (
      <ThemeContext.Provider
        value={{ theme: initialTheme, toggleTheme, setTheme }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider
      value={{ theme: forcedTheme || theme, toggleTheme, setTheme }}
    >
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
