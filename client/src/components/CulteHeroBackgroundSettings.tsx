import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useBlobUpload } from "@/hooks/useBlobUpload";

export default function CulteHeroBackgroundSettings() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => {
      utils.siteSettings.getAll.invalidate();
      toast.success("Paramètres mis à jour");
    },
    onError: error => toast.error("Erreur: " + error.message),
  });
  const { uploadFile, isUploading } = useBlobUpload();
  const utils = trpc.useUtils();

  const currentUrl = settingsQuery.data?.culteHeroBgUrl ?? "";
  const currentOpacityRaw = settingsQuery.data?.culteHeroBgOpacity ?? "18";
  const currentOpacity = Number(currentOpacityRaw) || 18;
  const [opacity, setOpacity] = useState(currentOpacity);
  const liveEnabledRaw = settingsQuery.data?.culteLiveEnabled;
  const liveEnabled = liveEnabledRaw !== "false";
  const currentTextColor = (settingsQuery.data?.["culte.textColor"] as string) || "";

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadFile({
        file,
        folder: "site",
      });
      toast.success("Image mise à jour");
      setSetting.mutate({ key: "culteHeroBgUrl", value: result.url });
    } catch (error) {
      toast.error(
        "Erreur: " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  };

  const saveOpacity = () => {
    const value = Math.max(0, Math.min(60, opacity));
    setOpacity(value);
    setSetting.mutate({ key: "culteHeroBgOpacity", value: String(value) });
  };

  const toggleLiveBadge = (value: boolean) => {
    setSetting.mutate({
      key: "culteLiveEnabled",
      value: value ? "true" : "false",
    });
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Fond de la Section Culte en ligne (Hero)
        </h3>
        <p className="text-xs text-muted-foreground">
          Ajoutez une image subtile en arrière-plan et réglez son opacité.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
        {currentUrl && (
          <div className="mt-2 rounded-lg overflow-hidden border border-border/60">
            <img src={currentUrl} alt="" className="w-full h-32 object-cover" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Opacité (0–60%)</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            max={60}
            value={opacity}
            onChange={e => setOpacity(Number(e.target.value))}
            className="w-24"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={saveOpacity}
            disabled={setSetting.isPending}
          >
            Appliquer
          </Button>
        </div>
      </div>

      <div className="space-y-2 border-t border-border/40 pt-4">
        <Label className="text-xs">Statut "En direct"</Label>
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            Afficher ou masquer le badge "En direct" sur la page Culte en ligne.
          </div>
          <Switch
            checked={liveEnabled}
            onCheckedChange={toggleLiveBadge}
            disabled={setSetting.isPending}
          />
        </div>
      </div>

      <div className="space-y-2 border-t border-border/40 pt-4">
        <Label className="text-xs">Couleur du texte (hero)</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={currentTextColor || "#374151"}
            onChange={(e) => setSetting.mutate({ key: "culte.textColor", value: e.target.value })}
            className="w-10 h-10 rounded-lg cursor-pointer border-0"
          />
          <div className="flex items-center gap-2">
            {currentTextColor && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSetting.mutate({ key: "culte.textColor", value: "" })}
                className="text-destructive hover:text-destructive text-xs h-7"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Couleur personnalisée pour le paragraphe sous le titre.</p>
      </div>
    </div>
  );
}
