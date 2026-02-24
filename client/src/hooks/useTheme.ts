/**
 * Theme management hook with localStorage persistence
 * Supports dark/light mode and custom color palettes
 */

import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  background: string;
  foreground: string;
}

const DEFAULT_PALETTES: Record<string, ColorPalette> = {
  default: {
    primary: "hsl(215, 100%, 50%)",
    secondary: "hsl(215, 20%, 90%)",
    accent: "hsl(55, 100%, 50%)",
    muted: "hsl(0, 0%, 95%)",
    background: "hsl(0, 0%, 100%)",
    foreground: "hsl(0, 0%, 0%)",
  },
  ocean: {
    primary: "hsl(200, 100%, 45%)",
    secondary: "hsl(200, 70%, 85%)",
    accent: "hsl(160, 100%, 45%)",
    muted: "hsl(200, 30%, 90%)",
    background: "hsl(200, 20%, 98%)",
    foreground: "hsl(200, 20%, 10%)",
  },
  sunset: {
    primary: "hsl(15, 100%, 50%)",
    secondary: "hsl(35, 100%, 60%)",
    accent: "hsl(55, 100%, 50%)",
    muted: "hsl(35, 50%, 90%)",
    background: "hsl(20, 30%, 98%)",
    foreground: "hsl(20, 30%, 10%)",
  },
  forest: {
    primary: "hsl(120, 70%, 40%)",
    secondary: "hsl(120, 40%, 80%)",
    accent: "hsl(80, 100%, 50%)",
    muted: "hsl(120, 30%, 90%)",
    background: "hsl(120, 20%, 98%)",
    foreground: "hsl(120, 20%, 10%)",
  },
};

const STORAGE_KEY = "theme-config";

interface ThemeConfig {
  mode: ThemeMode;
  palette: string;
  customPalette?: Partial<ColorPalette>;
}

export function useTheme() {
  const [config, setConfig] = useState<ThemeConfig>({
    mode: "system",
    palette: "default",
  });

  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        // Failed to parse theme config - use default
      }
    }
    setMounted(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const isDark =
      config.mode === "dark" ||
      (config.mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    // Apply theme mode
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply color palette
    const palette =
      config.customPalette || DEFAULT_PALETTES[config.palette] || DEFAULT_PALETTES.default;

    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config, mounted]);

  // Listen to system theme changes
  useEffect(() => {
    if (config.mode !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Re-apply theme when system preference changes
      const root = document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [config.mode]);

  const setMode = (mode: ThemeMode) => {
    setConfig((prev) => ({ ...prev, mode }));
  };

  const setPalette = (palette: string) => {
    setConfig((prev) => ({ ...prev, palette, customPalette: undefined }));
  };

  const setCustomColor = (color: keyof ColorPalette, value: string) => {
    setConfig((prev) => ({
      ...prev,
      customPalette: {
        ...prev.customPalette,
        [color]: value,
      },
    }));
  };

  const resetPalette = () => {
    setConfig((prev) => ({ ...prev, customPalette: undefined }));
  };

  return {
    config,
    mode: config.mode,
    palette: config.palette,
    customPalette: config.customPalette,
    setMode,
    setPalette,
    setCustomColor,
    resetPalette,
    palettes: DEFAULT_PALETTES,
    mounted,
  };
}
