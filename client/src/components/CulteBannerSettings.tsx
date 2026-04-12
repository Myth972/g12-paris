import React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Image as ImageIcon, Upload, Trash2, Maximize } from "lucide-react";
import { toast } from "sonner";
import { useBlobUpload } from "@/hooks/useBlobUpload";

export default function CulteBannerSettings() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const utils = trpc.useContext();
  const { uploadFile, isUploading } = useBlobUpload();

  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => {
      utils.siteSettings.getAll.invalidate();
      toast.success("Paramètres mis à jour");
    },
    onError: error => toast.error("Erreur: " + error.message),
  });

  const settings = settingsQuery.data || {};
  const bannerUrl = settings.culteBannerUrl || "";
  const bannerWidth = parseInt(settings.culteBannerWidth || "600");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile({
        file,
        folder: "site",
      });
      setSetting.mutate({ key: "culteBannerUrl", value: result.url });
      toast.success("Bannière mise à jour");
    } catch (error) {
      toast.error(
        "Erreur d'upload: " +
          (error instanceof Error ? error.message : "Erreur inconnue")
      );
    }
  };

  const handleWidthChange = (value: number[]) => {
    setSetting.mutate({ key: "culteBannerWidth", value: value[0].toString() });
  };

  const removeBanner = () => {
    setSetting.mutate({ key: "culteBannerUrl", value: "" });
    toast.success("Bannière supprimée");
  };

  return (
    <Card className="border-primary/20 bg-background/50 backdrop-blur-sm shadow-xl overflow-hidden group hover:border-primary/40 transition-all duration-300">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary group-hover:scale-110 transition-transform">
            <ImageIcon size={20} />
          </div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Petite Bannière Culte
            </CardTitle>
            <CardDescription>
              Gérez l'image et la taille de la bannière au-dessus de la vidéo
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <div className="space-y-4">
          <Label className="text-sm font-semibold flex items-center gap-2">
            <Upload size={14} className="text-primary" />
            Image de la bannière
          </Label>

          {bannerUrl ? (
            <div className="relative group/preview rounded-xl overflow-hidden border border-white/10 bg-black/20 aspect-[3/1] max-w-[400px]">
              <img
                src={bannerUrl}
                alt="Bannière prévisualisation"
                className="w-full h-full object-contain p-2"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center gap-2 transition-all">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={removeBanner}
                  className="gap-2 shadow-lg"
                >
                  <Trash2 size={16} />
                  Supprimer
                </Button>
                <Label
                  htmlFor="banner-upload"
                  className="cursor-pointer bg-primary text-primary-foreground h-9 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-primary/90 shadow-lg"
                >
                  <Upload size={16} /> Remplacer
                </Label>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center bg-black/10 hover:bg-black/20 hover:border-primary/30 transition-all group/empty">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover/empty:scale-110 transition-transform">
                <Upload size={24} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Aucune image configurée
              </p>
              <Label
                htmlFor="banner-upload"
                className="cursor-pointer bg-primary text-primary-foreground h-10 px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                Uploader une image
              </Label>
            </div>
          )}
          <Input
            id="banner-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </div>

        {bannerUrl && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Maximize size={14} className="text-primary" />
                Largeur de la bannière
              </Label>
              <span className="text-xs font-mono bg-primary/20 px-2 py-0.5 rounded text-primary">
                {bannerWidth}px
              </span>
            </div>

            <div className="px-2 pt-2">
              <Slider
                value={[bannerWidth]}
                min={200}
                max={1200}
                step={10}
                onValueChange={handleWidthChange}
                className="py-4"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium pt-1">
                <span>Petit (200px)</span>
                <span>Large (1200px)</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
