/**
 * Typography Customizer Component
 * Allows users to customize fonts, sizes, and text properties
 */

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Type } from "lucide-react";

const GOOGLE_FONTS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Playfair Display",
  "Lora",
  "Merriweather",
  "Poppins",
  "Montserrat",
];

const SERIF_FONTS = ["Playfair Display", "Lora", "Merriweather"];
const SANS_FONTS = ["Inter", "Roboto", "Open Sans", "Poppins", "Montserrat"];

export interface TypographyConfig {
  baseFont: string;
  serifFont: string;
  fontSizeBase: number;
  lineHeight: number;
  headingScale: number;
}

const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  baseFont: "Inter",
  serifFont: "Playfair Display",
  fontSizeBase: 16,
  lineHeight: 1.6,
  headingScale: 1.25,
};

const STORAGE_KEY = "typography-config";

export function useTypography() {
  const [config, setConfig] = useState<TypographyConfig>(DEFAULT_TYPOGRAPHY);
  const [mounted, setMounted] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        // Failed to parse config - use default
      }
    }
    setMounted(true);
  }, []);

  // Apply to DOM
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.style.setProperty("--font-sans", config.baseFont);
    root.style.setProperty("--font-serif", config.serifFont);
    root.style.setProperty("--font-size-base", `${config.fontSizeBase}px`);
    root.style.setProperty("--line-height", String(config.lineHeight));
    root.style.setProperty("--heading-scale", String(config.headingScale));

    // Calculate heading sizes
    const h6 = config.fontSizeBase * config.headingScale;
    const h5 = h6 * config.headingScale;
    const h4 = h5 * config.headingScale;
    const h3 = h4 * config.headingScale;
    const h2 = h3 * config.headingScale;
    const h1 = h2 * config.headingScale;

    root.style.setProperty("--font-size-h1", `${h1}px`);
    root.style.setProperty("--font-size-h2", `${h2}px`);
    root.style.setProperty("--font-size-h3", `${h3}px`);
    root.style.setProperty("--font-size-h4", `${h4}px`);
    root.style.setProperty("--font-size-h5", `${h5}px`);
    root.style.setProperty("--font-size-h6", `${h6}px`);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }, [config, mounted]);

  const updateConfig = (key: keyof TypographyConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => {
    setConfig(DEFAULT_TYPOGRAPHY);
  };

  return { config, updateConfig, reset, mounted };
}

export function TypographyCustomizer() {
  const { config, updateConfig, reset } = useTypography();

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Font Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Polices de caractères</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sans-serif font */}
          <div>
            <Label className="mb-3 block">Police sans-serif (Corps du texte)</Label>
            <Select value={config.baseFont} onValueChange={(v) => updateConfig("baseFont", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SANS_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2" style={{ fontFamily: config.baseFont }}>
              Aperçu: The quick brown fox jumps over the lazy dog
            </p>
          </div>

          {/* Serif font */}
          <div>
            <Label className="mb-3 block">Police serif (Titres)</Label>
            <Select value={config.serifFont} onValueChange={(v) => updateConfig("serifFont", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SERIF_FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p 
              className="text-sm text-muted-foreground mt-2 text-2xl" 
              style={{ fontFamily: config.serifFont }}
            >
              Aperçu: Titre Principal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Size & Spacing */}
      <Card>
        <CardHeader>
          <CardTitle>Tailles et espacements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Base Font Size */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Taille de base</Label>
              <span className="text-sm font-semibold text-primary">{config.fontSizeBase}px</span>
            </div>
            <Slider
              value={[config.fontSizeBase]}
              onValueChange={(value) => updateConfig("fontSizeBase", value[0])}
              min={12}
              max={20}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Affecte la taille du texte du corps et des éléments
            </p>
          </div>

          {/* Line Height */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Hauteur de ligne</Label>
              <span className="text-sm font-semibold text-primary">{config.lineHeight.toFixed(2)}</span>
            </div>
            <Slider
              value={[config.lineHeight * 100]}
              onValueChange={(value) => updateConfig("lineHeight", value[0] / 100)}
              min={120}
              max={200}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Espace vertical entre les lignes (1.2 - 2.0)
            </p>
          </div>

          {/* Heading Scale */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Échelle des titres</Label>
              <span className="text-sm font-semibold text-primary">{config.headingScale.toFixed(2)}x</span>
            </div>
            <Slider
              value={[config.headingScale * 100]}
              onValueChange={(value) => updateConfig("headingScale", value[0] / 100)}
              min={110}
              max={150}
              step={5}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Proportion entre les tailles de titres (1.1 - 1.5)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-xs text-muted-foreground mb-2">H1</p>
            <h1 
              style={{ fontFamily: config.serifFont }}
              className="font-bold mb-4"
            >
              Ceci est un titre H1
            </h1>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">H2</p>
            <h2 
              style={{ fontFamily: config.serifFont }}
              className="font-bold mb-4 text-2xl"
            >
              Ceci est un titre H2
            </h2>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Paragraphe</p>
            <p style={{ fontFamily: config.baseFont }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
          </div>

          <div className="border-t pt-6">
            <p className="text-xs text-muted-foreground mb-4">Hiérarchie des titres</p>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((level) => (
                <div key={level}>
                  <p className="text-xs text-muted-foreground mb-1">H{level}</p>
                  <h3 style={{ fontFamily: config.serifFont, fontSize: `calc(var(--font-size-h${level}, 16px))` }}>
                    Titre niveau {level}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      <div className="flex gap-3">
        <Button 
          onClick={reset}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réinitialiser
        </Button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          ℹ️ Les polices Google Fonts sont chargées automatiquement. Vos préférences sont enregistrées dans votre navigateur.
        </p>
      </div>
    </div>
  );
}
