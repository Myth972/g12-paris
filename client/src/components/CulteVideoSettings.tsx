import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Play, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CulteVideoSettings() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const setSetting = trpc.siteSettings.set.useMutation({
    onSuccess: () => {
      toast.success("Vidéo YouTube enregistrée");
    },
  });

  const [videoId, setVideoId] = useState(settingsQuery.data?.culteYoutubeVideoId || "");
  const [liveEnabled, setLiveEnabled] = useState(settingsQuery.data?.culteLiveEnabled !== "false");

  const handleSave = () => {
    setSetting.mutate({ key: "culteYoutubeVideoId", value: videoId });
    setSetting.mutate({ key: "culteLiveEnabled", value: String(liveEnabled) });
  };

  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return "";
  };

  const handleUrlChange = (url: string) => {
    const videoId = extractVideoId(url);
    setVideoId(videoId);
    if (videoId) {
      toast.success(`Vidéo détectée: ${videoId}`);
    }
  };

  const previewUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          Vidéo YouTube du Culte
        </CardTitle>
        <CardDescription>
          Configurez la vidéo YouTube à afficher sur la page Culte en ligne
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="youtubeUrl">URL ou ID de la vidéo YouTube</Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="youtubeUrl"
              placeholder="https://youtube.com/watch?v=... ou ID vidéo"
              value={videoId}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="flex-1 h-11"
            />
            <Button
              onClick={handleSave}
              disabled={setSetting.isPending}
              className="w-full sm:w-auto h-11"
            >
              {setSetting.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Collez l&apos;URL complète ou juste l&apos;ID de la vidéo (ex: dQw4w9WgXcQ)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="liveEnabled"
            checked={liveEnabled}
            onChange={(e) => setLiveEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="liveEnabled" className="cursor-pointer">
            Afficher le badge &quot;En direct&quot; (pour lives)
          </Label>
        </div>

        {previewUrl && (
          <div className="space-y-3">
            <Label>Aperçu</Label>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <iframe
                src={previewUrl}
                title="Aperçu vidéo YouTube"
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <a
              href={`https://youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <Play className="w-4 h-4" />
              Ouvrir sur YouTube
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}