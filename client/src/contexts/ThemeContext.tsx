import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const { isAuthenticated } = useAuth();

  // 1. Initial State from LocalStorage or defaultTheme
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  // 2. Fetch theme from DB if authenticated and theme switcher is enabled
  const { data: dbThemeData } = trpc.theme.getUserTheme.useQuery(undefined, {
    enabled: switchable && isAuthenticated,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // 3. Mutation to set theme in DB
  const setUserThemeMutation = trpc.theme.setUserTheme.useMutation();

  // 4. If we load the theme from the BDD, update local state
  useEffect(() => {
    if (dbThemeData?.theme) {
      setTheme(dbThemeData.theme as Theme);
    }
  }, [dbThemeData]);

  // 5. Apply the theme class and store in localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  // 6. Handle theme toggling
  const toggleTheme = switchable
    ? () => {
        const nextTheme = theme === "light" ? "dark" : "light";
        setTheme(nextTheme);
        if (isAuthenticated) {
          setUserThemeMutation.mutate({ theme: nextTheme });
        }
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
