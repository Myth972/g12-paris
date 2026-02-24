/**
 * Theme Customizer Component
 * Allows users to customize dark/light mode and color palette
 */

import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Moon, Sun, Monitor, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ThemeCustomizer() {
  const {
    mode,
    palette,
    customPalette,
    setMode,
    setPalette,
    setCustomColor,
    resetPalette,
    palettes,
  } = useTheme();

  const currentPalette = customPalette || palettes[palette];

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Theme Mode Section */}
      <Card>
        <CardHeader>
          <CardTitle>Mode d'affichage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setMode("light")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                mode === "light"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <Sun className="w-6 h-6" />
              <span className="text-sm font-medium">Clair</span>
            </button>
            <button
              onClick={() => setMode("dark")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                mode === "dark"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <Moon className="w-6 h-6" />
              <span className="text-sm font-medium">Sombre</span>
            </button>
            <button
              onClick={() => setMode("system")}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                mode === "system"
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              }`}
            >
              <Monitor className="w-6 h-6" />
              <span className="text-sm font-medium">Système</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Section */}
      <Card>
        <CardHeader>
          <CardTitle>Palette de couleurs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset Palettes */}
          <div>
            <Label className="mb-3 block">Présets</Label>
            <Select value={palette} onValueChange={setPalette}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Défaut (Bleu)</SelectItem>
                <SelectItem value="ocean">Océan</SelectItem>
                <SelectItem value="sunset">Coucher de soleil</SelectItem>
                <SelectItem value="forest">Forêt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom Color Picker */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Couleurs personnalisées</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={resetPalette}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {(Object.keys(currentPalette) as Array<keyof typeof currentPalette>).map(
                (colorKey) => (
                  <div key={colorKey}>
                    <Label className="text-sm mb-2 block capitalize">{colorKey}</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={currentPalette[colorKey]}
                        onChange={(e) => setCustomColor(colorKey, e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <Input
                        value={currentPalette[colorKey]}
                        onChange={(e) => setCustomColor(colorKey, e.target.value)}
                        placeholder="#000000"
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Color Preview */}
          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">Aperçu</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(Object.entries(currentPalette)).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div
                    className="h-16 rounded-lg border"
                    style={{ backgroundColor: value }}
                  />
                  <p className="text-xs text-muted-foreground font-mono">{key}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-200">
          ℹ️ Vos préférences de thème sont enregistrées dans votre navigateur et seront conservées lors de vos prochaines visites.
        </p>
      </div>
    </div>
  );
}
