import { useState, useRef, useCallback } from "react";
import html2canvas from "html2canvas";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  Share2,
  Loader2,
  Image,
  Smartphone,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type CardFormat = "square" | "story";

const FORMAT_CONFIG: Record<
  CardFormat,
  { label: string; width: number; height: number; icon: typeof Image }
> = {
  square: { label: "Post (1:1)", width: 1080, height: 1080, icon: Image },
  story: { label: "Story (9:16)", width: 1080, height: 1920, icon: Smartphone },
};

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string;
  published: boolean;
  createdAt: Date;
}

export default function StoryCardAdmin() {
  const { data: articlesData, isLoading } = trpc.articles.adminList.useQuery();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const primaryColor =
    (settingsQuery.data?.["design.primaryColor"] as string) || "#D97706";

  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [format, setFormat] = useState<CardFormat>("square");
  const [generating, setGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const articles = (articlesData?.items ?? []).filter((a: any) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

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
    } catch {
      toast.error("Erreur lors de la génération");
      return null;
    } finally {
      setGenerating(false);
    }
  }, [width, height]);

  const handleDownload = async () => {
    const article = selectedArticle;
    const blob = await generateImage();
    if (!blob || !article) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `g12-story-${article.slug}-${format}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success("Image téléchargée");
  };

  const handleShare = async () => {
    const article = selectedArticle;
    const blob = await generateImage();
    if (!blob || !article) return;
    const file = new File([blob], `g12-story-${format}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || article.title,
          files: [file],
        });
      } catch {
        toast.error("Partage annulé");
      }
    } else {
      await navigator.clipboard.writeText(
        `${window.location.origin}/article/${article.slug}`
      );
      toast.success("Lien copié dans le presse-papiers");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-serif font-bold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Story Cards
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Générez des images de partage pour les réseaux sociaux.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un article..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Article list */}
      <div className="grid gap-3">
        {articles.map((article: any) => (
          <div
            key={article.id}
            className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => setSelectedArticle(article)}
          >
            {article.coverImageUrl ? (
              <img
                src={article.coverImageUrl}
                alt=""
                className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-12 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center">
                <Image className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{article.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[10px]">
                  {article.category}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {article.published ? "Publié" : "Brouillon"}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="flex-shrink-0 gap-1">
              <Image className="w-3.5 h-3.5" />
              Créer
            </Button>
          </div>
        ))}
        {articles.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Aucun article trouvé.
          </p>
        )}
      </div>

      {/* Generator dialog */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={(open) => !open && setSelectedArticle(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Story Card — {selectedArticle?.title}</DialogTitle>
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
              {selectedArticle?.coverImageUrl ? (
                <img
                  src={selectedArticle.coverImageUrl}
                  alt=""
                  crossOrigin="anonymous"
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent" />
              <div className="relative z-10 p-6 sm:p-8 flex flex-col gap-4">
                <span
                  className="inline-flex self-start items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {selectedArticle?.category}
                </span>
                <h2
                  className="font-serif font-bold text-white leading-tight"
                  style={{
                    fontSize:
                      format === "story"
                        ? "clamp(1.5rem, 4vw, 2.5rem)"
                        : "clamp(1.25rem, 3vw, 2rem)",
                  }}
                >
                  {(selectedArticle?.title?.length ?? 0) > 80
                    ? (selectedArticle?.title ?? "").slice(0, 77) + "..."
                    : selectedArticle?.title}
                </h2>
                {selectedArticle?.excerpt && (
                  <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                    {selectedArticle.excerpt.length > 120
                      ? selectedArticle.excerpt.slice(0, 117) + "..."
                      : selectedArticle.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    G12
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold">G12 Paris</p>
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
            <Button
              onClick={handleDownload}
              disabled={generating}
              className="gap-2"
            >
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
    </div>
  );
}
