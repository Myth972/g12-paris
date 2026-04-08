import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CulteHeroBackgroundSettings() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => toast.success("Paramètres mis à jour"),
    onError: error => toast.error("Erreur: " + error.message),
  });
  const uploadMutation =
    trpc.siteSettings.uploadCulteHeroBackground.useMutation({
      onSuccess: result => {
        toast.success("Image mise à jour");
        setSetting.mutate({ key: "culteHeroBgUrl", value: result.url });
      },
      onError: error => toast.error("Erreur: " + error.message),
    });

  const currentUrl = settingsQuery.data?.culteHeroBgUrl ?? "";
  const currentOpacityRaw = settingsQuery.data?.culteHeroBgOpacity ?? "18";
  const currentOpacity = Number(currentOpacityRaw) || 18;
  const [opacity, setOpacity] = useState(currentOpacity);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async event => {
      const base64 = (event.target?.result as string).split(",")[1];
      uploadMutation.mutate({
        base64,
        filename: file.name,
        contentType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const saveOpacity = () => {
    const value = Math.max(0, Math.min(60, opacity));
    setOpacity(value);
    setSetting.mutate({ key: "culteHeroBgOpacity", value: String(value) });
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
        <Input type="file" accept="image/*" onChange={handleFileUpload} />
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
    </div>
  );
}
