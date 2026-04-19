import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Video,
  Download,
  Copy,
  RefreshCw,
  Wand2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBlobUpload } from "@/hooks/useBlobUpload";

const ASPECT_RATIOS_IMAGE = ["16:9", "1:1", "9:16", "4:3", "3:4"] as const;
const ASPECT_RATIOS_VIDEO = ["16:9", "1:1", "9:16"] as const;

const PROMPT_SUGGESTIONS = [
  "Paysage céleste lumineux avec des rayons de soleil perçant les nuages, cinématographique",
  "Église moderne à Paris au lever du soleil, style photographique",
  "Assemblée de fidèles en prière, lumière dorée, style documentaire",
  "Croix illuminée sur fond de ciel étoilé, art numérique",
  "Lecture de la Bible près d'une fenêtre, lumière naturelle, style éditorial",
];

export default function KlingStudio() {
  const { uploadFile, isUploading } = useBlobUpload();
  const [tab, setTab] = useState<"image" | "video">("image");

  // Image state
  const [imgPrompt, setImgPrompt] = useState("");
  const [imgNegative, setImgNegative] = useState("");
  const [imgRatio, setImgRatio] =
    useState<(typeof ASPECT_RATIOS_IMAGE)[number]>("16:9");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );

  // Video state
  const [vidPrompt, setVidPrompt] = useState("");
  const [vidNegative, setVidNegative] = useState("");
  const [vidRatio, setVidRatio] =
    useState<(typeof ASPECT_RATIOS_VIDEO)[number]>("16:9");
  const [vidDuration, setVidDuration] = useState<"5" | "10">("5");
  const [vidImage, setVidImage] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(
    null
  );
  const [videoPending, setVideoPending] = useState(false);
  const [videoGenerationId, setVideoGenerationId] = useState<string | null>(
    null
  );

  const generateImageMutation = trpc.ai.generateImage.useMutation({
    onSuccess: data => {
      if (data.url) {
        setGeneratedImageUrl(data.url);
        toast.success("Image générée avec succès !");
      }
    },
    onError: e => toast.error("Erreur : " + e.message),
  });

  const generateVideoMutation = trpc.ai.generateVideo.useMutation({
    onSuccess: data => {
      if (data.url) {
        setGeneratedVideoUrl(data.url);
        setVideoPending(false);
        toast.success("Vidéo générée !");
      } else if (data.pending && data.generationId) {
        setVideoPending(true);
        setVideoGenerationId(data.generationId);
        toast.info(
          "Génération en cours (~60s). Résultat disponible ci-dessous."
        );
      }
    },
    onError: e => {
      setVideoPending(false);
      toast.error("Erreur : " + e.message);
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow">
          <Wand2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-bold">Kling AI Studio</h2>
          <p className="text-xs text-muted-foreground">
            Génération d'images et vidéos IA via Kling v1.6 Pro · Alimenté par
            AIMLAPI
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as "image" | "video")}>
        <TabsList className="mb-6">
          <TabsTrigger value="image" className="gap-2">
            <ImageIcon className="w-4 h-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video" className="gap-2">
            <Video className="w-4 h-4" />
            Vidéo
          </TabsTrigger>
        </TabsList>

        {/* ─── Image Tab ─── */}
        <TabsContent value="image">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Description de l'image *
                </Label>
                <Textarea
                  value={imgPrompt}
                  onChange={e => setImgPrompt(e.target.value)}
                  placeholder="Décrivez l'image que vous souhaitez générér..."
                  rows={4}
                  className="resize-none"
                />
                {/* Suggestions */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setImgPrompt(s)}
                      className="text-[11px] px-2 py-1 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground truncate max-w-full text-left"
                    >
                      ✦ {s.substring(0, 50)}…
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  À éviter (négatif)
                </Label>
                <Textarea
                  value={imgNegative}
                  onChange={e => setImgNegative(e.target.value)}
                  placeholder="blurry, low quality, text, watermark..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Format</Label>
                <Select
                  value={imgRatio}
                  onValueChange={v => setImgRatio(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASPECT_RATIOS_IMAGE.map(r => (
                      <SelectItem key={r} value={r}>
                        {r === "16:9"
                          ? `${r} — Paysage (YouTube, web)`
                          : r === "1:1"
                            ? `${r} — Carré (Instagram)`
                            : r === "9:16"
                              ? `${r} — Portrait (Stories, Reels)`
                              : r === "4:3"
                                ? `${r} — Standard`
                                : `${r} — Portrait standard`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full gap-2"
                disabled={!imgPrompt.trim() || generateImageMutation.isPending}
                onClick={() =>
                  generateImageMutation.mutate({
                    prompt: imgPrompt,
                    aspectRatio: imgRatio,
                    negativePrompt: imgNegative || undefined,
                  })
                }
              >
                {generateImageMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération en cours (~15s)…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer l'image
                  </>
                )}
              </Button>
            </div>

            {/* Result */}
            <div className="bg-muted/30 border border-border rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {generateImageMutation.isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-8"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 mx-auto mb-4 flex items-center justify-center">
                      <Wand2 className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <p className="text-sm font-medium">
                      Kling génère votre image…
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Généralement 10–20 secondes
                    </p>
                  </motion.div>
                ) : generatedImageUrl ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full"
                  >
                    <img
                      src={generatedImageUrl}
                      alt="Image générée"
                      className="w-full h-auto object-contain max-h-96"
                    />
                    <div className="flex gap-2 p-3 border-t border-border bg-card">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedImageUrl);
                          toast.success("URL copiée !");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copier l'URL
                      </Button>
                      <Button size="sm" className="flex-1 gap-1.5" asChild>
                        <a
                          href={generatedImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="w-3.5 h-3.5" />
                          Télécharger
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-8 text-muted-foreground"
                  >
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">L'image apparaîtra ici</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* ─── Video Tab ─── */}
        <TabsContent value="video">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg border border-violet-200 dark:border-violet-800">
                <p className="text-xs text-violet-700 dark:text-violet-300 font-medium">
                  ⚡ Kling v1.6 Pro · Texte / Image → Vidéo · Peut prendre
                  1–2 minutes
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Image (Optionnel - Image-to-Video)
                </Label>
                {vidImage ? (
                  <div className="relative border border-border rounded-lg overflow-hidden bg-muted">
                    <img src={vidImage} alt="Reference" className="w-full h-32 object-cover" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full"
                      onClick={() => setVidImage(null)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const res = await uploadFile({ file, folder: "kling-refs" });
                          if (res) setVidImage(res.url);
                        } catch (err) {
                          toast.error("Erreur d'upload de l'image");
                        }
                      }}
                      disabled={isUploading}
                      className="text-xs cursor-pointer"
                    />
                    <p className="text-[10px] text-muted-foreground">Upload depuis cet appareil vers Vercel, puis envoi à Kling.</p>
                  </div>
                )}
                {isUploading && <p className="text-xs text-primary font-medium mt-1 animate-pulse flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Upload en cours...</p>}
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Description de la vidéo *
                </Label>
                <Textarea
                  value={vidPrompt}
                  onChange={e => setVidPrompt(e.target.value)}
                  placeholder="Ex: Lever de soleil sur Paris, nuages en mouvement, style cinématographique, couleurs chaudes..."
                  rows={4}
                  className="resize-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMPT_SUGGESTIONS.slice(3).map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setVidPrompt(s)}
                      className="text-[11px] px-2 py-1 bg-muted rounded-full hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground text-left"
                    >
                      ✦ {s.substring(0, 50)}…
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  À éviter
                </Label>
                <Textarea
                  value={vidNegative}
                  onChange={e => setVidNegative(e.target.value)}
                  placeholder="blurry, shaky, low quality..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Durée
                  </Label>
                  <Select
                    value={vidDuration}
                    onValueChange={v => setVidDuration(v as "5" | "10")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 secondes</SelectItem>
                      <SelectItem value="10">10 secondes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Format
                  </Label>
                  <Select
                    value={vidRatio}
                    onValueChange={v => setVidRatio(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIOS_VIDEO.map(r => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800"
                disabled={!vidPrompt.trim() || generateVideoMutation.isPending}
                onClick={() => {
                  setGeneratedVideoUrl(null);
                  setVideoPending(false);
                  generateVideoMutation.mutate({
                    prompt: vidPrompt,
                    duration: vidDuration,
                    aspectRatio: vidRatio,
                    negativePrompt: vidNegative || undefined,
                    imageUrl: vidImage || undefined,
                  });
                }}
              >
                {generateVideoMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération (~60–90s)…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer la vidéo
                  </>
                )}
              </Button>
            </div>

            {/* Result */}
            <div className="bg-muted/30 border border-border rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {generateVideoMutation.isPending || videoPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center p-8"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 mx-auto mb-4 flex items-center justify-center">
                      <Video className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <p className="text-sm font-medium">
                      Kling génère votre vidéo…
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Peut prendre jusqu'à 90 secondes
                    </p>
                  </motion.div>
                ) : generatedVideoUrl ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full"
                  >
                    <video
                      src={generatedVideoUrl}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full max-h-80"
                    />
                    <div className="flex gap-2 p-3 border-t border-border bg-card">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1.5"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedVideoUrl);
                          toast.success("URL copiée !");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copier l'URL
                      </Button>
                      <Button size="sm" className="flex-1 gap-1.5" asChild>
                        <a
                          href={generatedVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Download className="w-3.5 h-3.5" />
                          Télécharger
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center p-8 text-muted-foreground"
                  >
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">La vidéo apparaîtra ici</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
