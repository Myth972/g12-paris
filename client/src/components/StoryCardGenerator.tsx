import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Share2, Loader2, Image, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface StoryCardGeneratorProps {
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string;
  slug: string;
}

type CardFormat = "square" | "story";

const FORMAT_CONFIG: Record<
  CardFormat,
  { label: string; width: number; height: number; icon: typeof Image }
> = {
  square: { label: "Post (1:1)", width: 1080, height: 1080, icon: Image },
  story: { label: "Story (9:16)", width: 1080, height: 1920, icon: Smartphone },
};

export default function StoryCardGenerator({
  title,
  excerpt,
  coverImageUrl,
  category,
  slug,
}: StoryCardGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<CardFormat>("square");
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(false);

  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const primaryColor =
    (settingsQuery.data?.["design.primaryColor"] as string) || "#D97706";

  const { width, height } = FORMAT_CONFIG[format];

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        width,
        height,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#0f172a",
      });
      return new Promise((resolve) =>
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0)
      );
    } catch (err) {
      toast.error("Erreur lors de la génération");
      return null;
    } finally {
      setGenerating(false);
    }
  }, [width, height]);

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `g12-story-${slug}-${format}.png`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Image téléchargée");
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], `g12-story-${format}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title,
          text: excerpt || title,
          files: [file],
        });
      } catch {
        toast.error("Partage annulé");
      }
    } else {
      await navigator.clipboard.writeText(
        `${window.location.origin}/article/${slug}`
      );
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  const truncatedTitle =
    title.length > 80 ? title.slice(0, 77) + "..." : title;
  const truncatedExcerpt =
    excerpt && excerpt.length > 120
      ? excerpt.slice(0, 117) + "..."
      : excerpt || "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Image className="w-3.5 h-3.5" />
          Story Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer une Story Card</DialogTitle>
        </DialogHeader>

        {/* Format selector */}
        <div className="flex gap-2">
          {(Object.keys(FORMAT_CONFIG) as CardFormat[]).map((f) => {
            const cfg = FORMAT_CONFIG[f];
            const Icon = cfg.icon;
            return (
              <Button
                key={f}
                variant={format === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFormat(f)}
                className="gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" />
                {cfg.label}
              </Button>
            );
          })}
        </div>

        {/* Card preview */}
        <div className="flex justify-center overflow-hidden rounded-xl border border-border">
          <div
            ref={cardRef}
            className="relative overflow-hidden flex flex-col justify-end"
            style={{
              width: Math.min(width, 540),
              height: Math.min(height, 960),
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            }}
          >
            {/* Cover image */}
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt=""
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-4">
              {/* Category badge */}
              <span
                className="inline-flex self-start items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {category}
              </span>

              {/* Title */}
              <h2
                className="font-serif font-bold text-white leading-tight"
                style={{
                  fontSize:
                    format === "story"
                      ? "clamp(1.5rem, 4vw, 2.5rem)"
                      : "clamp(1.25rem, 3vw, 2rem)",
                }}
              >
                {truncatedTitle}
              </h2>

              {/* Excerpt */}
              {truncatedExcerpt && (
                <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                  {truncatedExcerpt}
                </p>
              )}

              {/* Footer */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: primaryColor }}
                >
                  G12
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">
                    G12 Paris
                  </p>
                  <p className="text-white/50 text-[10px]">
                    g12-paris.vercel.app
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={generating}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            Partager
          </Button>
          <Button onClick={handleDownload} disabled={generating} className="gap-2">
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Télécharger PNG
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
