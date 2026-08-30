import { trpc } from "@/lib/trpc";
import { getImageUrl } from "@/lib/imageUrl";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { ChevronRight, Quote, Heart, Sparkles, BookOpen, ImageIcon, Pencil, Save, X, Loader2, Upload } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import Autoplay from "embla-carousel-autoplay";
import { useAuth } from "@/_core/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useBlobUpload } from "@/hooks/useBlobUpload";
import FloatingParticles from "@/components/FloatingParticles";

function getYouTubeThumbnail(url: string) {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

const CATEGORIES = [
  { key: "", label: "Toutes", icon: ImageIcon },
  { key: "foi", label: "Foi", icon: Heart },
  { key: "louange", label: "Louange", icon: Sparkles },
  { key: "esperance", label: "Espérance", icon: BookOpen },
] as const;

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVars: any = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

const getMosaicSpan = (index: number) => {
  const cycle = index % 6;
  if (cycle === 0) return "lg:col-span-2";
  return "";
};

export default function GalleriesPage() {
  const motionEnabled = useMotionEnabled();
  const [page, setPage] = useState(0);
  const [activeCategory, setActiveCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const limit = 12;

  const offset = useMemo(() => page * limit, [page]);
  const carouselPlugin = useMemo(() => Autoplay({ delay: 4000, stopOnInteraction: true }), []);

  const { data, isLoading } = trpc.gallery.list.useQuery({
    limit,
    offset,
    category: activeCategory || undefined,
  });
  const { data: featuredData } = trpc.gallery.featured.useQuery();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const featured = featuredData ?? [];
  const carouselItems = featured.filter((i: any) => i.verse).slice(0, 8);
  const pictureOfDay = featured.find((i: any) => i.type === "image" && i.verse) ?? featured.find((i: any) => i.verse) ?? featured[0] ?? null;

  const handleCategoryChange = useCallback((key: string) => {
    setActiveCategory(prev => prev === key ? "" : key);
    setPage(0);
  }, []);

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { uploadFile, isUploading } = useBlobUpload();

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCategory, setDraftCategory] = useState("");
  const [draftVerseText, setDraftVerseText] = useState("");
  const [draftVerseRef, setDraftVerseRef] = useState("");
  const [draftVerseSummary, setDraftVerseSummary] = useState("");
  const [draftMediaUrl, setDraftMediaUrl] = useState("");
  const [draftMediaKey, setDraftMediaKey] = useState("");

  const updateGalleryMutation = trpc.gallery.update.useMutation({
    onSuccess: () => {
      utils.gallery.featured.invalidate();
      utils.gallery.list.invalidate();
      toast.success("Image du Jour mise à jour");
      setEditing(false);
    },
    onError: err => toast.error("Erreur : " + err.message),
  });

  const updateVerseMutation = trpc.verses.update.useMutation({
    onSuccess: () => {
      utils.gallery.featured.invalidate();
    },
    onError: err => toast.error("Erreur verset : " + err.message),
  });

  const createVerseMutation = trpc.verses.create.useMutation({
    onSuccess: () => {
      utils.gallery.featured.invalidate();
    },
    onError: err => toast.error("Erreur création verset : " + err.message),
  });

  const startEditing = useCallback(() => {
    if (!pictureOfDay) return;
    setDraftTitle(pictureOfDay.title || "");
    setDraftCategory(pictureOfDay.category || "general");
    setDraftVerseText(pictureOfDay.verse?.text || "");
    setDraftVerseRef(pictureOfDay.verse?.reference || "");
    setDraftVerseSummary(pictureOfDay.verse?.summary || "");
    setDraftMediaUrl(pictureOfDay.mediaUrl || "");
    setDraftMediaKey(pictureOfDay.mediaKey || "");
    setEditing(true);
  }, [pictureOfDay]);

  const handleSave = useCallback(async () => {
    if (!pictureOfDay) return;

    let verseId: number | null = pictureOfDay.verse?.id ?? null;

    if (draftVerseRef.trim() && draftVerseText.trim()) {
      if (verseId) {
        await updateVerseMutation.mutateAsync({
          id: verseId,
          text: draftVerseText,
          reference: draftVerseRef,
          summary: draftVerseSummary,
        });
      } else {
        const newVerse = await createVerseMutation.mutateAsync({
          text: draftVerseText,
          reference: draftVerseRef,
          summary: draftVerseSummary,
        });
        verseId = newVerse.id;
      }
    } else {
      verseId = null;
    }

    updateGalleryMutation.mutate({
      id: pictureOfDay.id,
      title: draftTitle,
      category: draftCategory,
      mediaUrl: draftMediaUrl || undefined,
      mediaKey: draftMediaKey || undefined,
      verseId,
    });
  }, [pictureOfDay, draftTitle, draftCategory, draftVerseText, draftVerseRef, draftVerseSummary, draftMediaUrl, draftMediaKey, updateGalleryMutation, updateVerseMutation, createVerseMutation]);

  const cancelEditing = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <div className="min-h-screen relative">
      <FloatingParticles
        className="fixed inset-0 w-full h-full z-0"
        particleCount={30}
        speed={0.2}
        shape="star"
        color="#FCD34D"
      />
      {/* Hero section */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-16"
      >
        <div className="container">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Galeries
              </span>
            </motion.div>
            <PageTitleEditor
              pageKey="galeries"
              defaultH1={"Galerie d'Images\net Vidéos"}
              defaultH2=""
              h1ClassName="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight"
            />
            <PageTextEditor
              pageKey="galeries"
              textKey="hero"
              defaultText="Explorez notre collection complète d'images inspirantes et de vidéos édifiantes avec leurs versets bibliques associés."
              className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg"
            />
          </div>
        </div>
      </motion.section>

      {/* Picture of the Day */}
      {pictureOfDay && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="container pb-12"
        >
          <div className="relative rounded-2xl overflow-hidden border border-amber-400/30 shadow-[0_0_30px_rgba(251,191,36,0.1)] bg-gradient-to-br from-amber-50/50 via-background to-blue-50/30">
            {isAdmin && !editing && (
              <Button
                variant="secondary"
                size="sm"
                className="absolute right-4 top-4 z-20 h-8 px-3 text-xs shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
                onClick={startEditing}
              >
                <Pencil className="w-3 h-3 mr-1" />
                Modifier
              </Button>
            )}
            <div className="flex flex-col md:flex-row">
              <div className="md:w-3/5 relative aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden">
                <img
                  src={getImageUrl(pictureOfDay.mediaUrl)}
                  alt={pictureOfDay.title}
                  className="w-full h-full absolute inset-0 object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <Badge variant="secondary" className="bg-amber-500/90 text-white border-0 text-xs">
                    Image du Jour
                  </Badge>
                </div>
              </div>
              <div className="md:w-2/5 p-6 md:p-8 flex flex-col justify-center relative">
                {editing ? (
                  <div className="w-full space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Image</label>
                      {draftMediaUrl && (
                        <img src={getImageUrl(draftMediaUrl)} alt="Aperçu" className="w-full h-28 object-contain rounded-lg border border-border/50 bg-muted" />
                      )}
                      <div className="flex items-center gap-2">
                        <Input value={draftMediaUrl} onChange={e => setDraftMediaUrl(e.target.value)} placeholder="URL de l'image" className="flex-1 text-xs" />
                        <Button variant="outline" size="icon" type="button" disabled={isUploading} className="relative shrink-0" aria-label="Uploader une image">
                          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={async e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const result = await uploadFile({ file, folder: "gallery" });
                              setDraftMediaUrl(result.url);
                              setDraftMediaKey(result.key || "");
                              toast.success("Image uploadée");
                            } catch {
                              toast.error("Erreur lors de l'upload");
                            }
                          }} />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Titre</label>
                      <Input
                        value={draftTitle}
                        onChange={e => setDraftTitle(e.target.value)}
                        placeholder="Titre de l'image"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Catégorie</label>
                      <select
                        value={draftCategory}
                        onChange={e => setDraftCategory(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="general">Général</option>
                        <option value="foi">Foi</option>
                        <option value="louange">Louange</option>
                        <option value="esperance">Espérance</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Référence du verset</label>
                      <Input
                        value={draftVerseRef}
                        onChange={e => setDraftVerseRef(e.target.value)}
                        placeholder="Jean 3:16"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Texte du verset</label>
                      <Textarea
                        value={draftVerseText}
                        onChange={e => setDraftVerseText(e.target.value)}
                        rows={3}
                        placeholder="Car Dieu a tant aimé le monde..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">Résumé / Méditation</label>
                      <Textarea
                        value={draftVerseSummary}
                        onChange={e => setDraftVerseSummary(e.target.value)}
                        rows={3}
                        placeholder="Méditation optionnelle..."
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateGalleryMutation.isPending || updateVerseMutation.isPending}
                      >
                        {(updateGalleryMutation.isPending || updateVerseMutation.isPending) ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5 mr-1" />
                        )}
                        Enregistrer
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEditing}>
                        <X className="w-3.5 h-3.5 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute top-4 right-4 text-amber-400/20">
                      <Quote className="w-16 h-16" />
                    </div>
                    <p className="text-xs uppercase tracking-[0.2em] font-bold text-amber-600/80 mb-3">
                      Verset du Jour
                    </p>
                    <p className="text-lg md:text-xl italic text-foreground/90 font-serif leading-relaxed mb-4">
                      « {pictureOfDay.verse.text} »
                    </p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {pictureOfDay.verse.reference}
                    </p>
                    {pictureOfDay.verse.summary && (
                      <p className="text-xs text-muted-foreground mt-3 leading-relaxed italic">
                        {pictureOfDay.verse.summary}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Auto-carousel */}
      {carouselItems.length >= 3 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="container pb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-serif font-bold text-foreground">
              Galerie inspirante
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <Carousel
            opts={{ align: "start", loop: true }}
            plugins={[carouselPlugin]}
            className="w-full"
          >
            <CarouselContent>
              {carouselItems.map((item: any) => (
                <CarouselItem key={item.id} className="md:basis-1/3 lg:basis-1/4 pl-4">
                  <div
                    className="group rounded-xl overflow-hidden border border-border/50 bg-card cursor-pointer hover:border-amber-400/30 transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.1)]"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      {item.type === "image" ? (
                        <img
                          src={getImageUrl(item.mediaUrl)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          {(() => {
                            const thumb = item.coverImageUrl || (item.youtubeUrl ? getYouTubeThumbnail(item.youtubeUrl) : null);
                            if (thumb) return (
                              <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            );
                            if (item.mediaUrl && !item.youtubeUrl) return (
                              <video src={getImageUrl(item.mediaUrl)} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                            );
                            return null;
                          })()}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                              <svg className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium line-clamp-1">{item.title}</p>
                      {item.verse && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic line-clamp-1">
                          {item.verse.reference}
                        </p>
                      )}
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="-left-4 size-8" />
              <CarouselNext className="-right-4 size-8" />
            </div>
          </Carousel>
        </motion.section>
      )}

      {/* Gallery grid */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="container pb-16 border-t border-border/30 pt-12"
      >
        {/* Category filter */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-xl overflow-hidden border border-border/50 ${i % 3 === 0 ? "lg:col-span-2" : ""}`}
              >
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : items.length > 0 ? (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              variants={containerVars}
              initial={motionEnabled ? "hidden" : "visible"}
              whileInView={motionEnabled ? "visible" : undefined}
              animate={motionEnabled ? undefined : "visible"}
              viewport={motionEnabled ? { once: true, margin: "-100px" } : undefined}
            >
              {items.map((item: any, idx: number) => {
                const spanClass = getMosaicSpan(idx);
                return (
                  <motion.div
                    key={item.id}
                    variants={itemVars}
                    className={`group bg-card rounded-xl overflow-hidden border border-border/50 hover:border-amber-400/30 transition-all duration-500 touch-manipulation cursor-pointer ${spanClass}`}
                    whileHover={motionEnabled ? { y: -6, scale: 1.02, zIndex: 10 } : undefined}
                    onClick={() => setSelectedItem(item)}
                  >
                    {/* Media */}
                    <div className="relative overflow-hidden bg-muted aspect-[4/3]">
                      {item.type === "image" ? (
                        <img
                          src={getImageUrl(item.mediaUrl)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 select-none"
                          onContextMenu={(e) => e.preventDefault()}
                          draggable={false}
                          loading="lazy"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          {(() => {
                            const thumb = item.coverImageUrl || (item.youtubeUrl ? getYouTubeThumbnail(item.youtubeUrl) : null);
                            if (thumb) return (
                              <img src={thumb} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 select-none" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            );
                            if (item.mediaUrl && !item.youtubeUrl) return (
                              <video src={getImageUrl(item.mediaUrl)} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                            );
                            return null;
                          })()}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <svg className="w-6 h-6 text-foreground ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Type badge */}
                      <div className="absolute top-3 left-3 pointer-events-none z-10">
                        <span className="inline-block bg-background/80 backdrop-blur-sm text-foreground font-medium text-[10px] px-2.5 py-1 rounded-full shadow-sm border border-border/30">
                          {item.type === "image" ? "📷" : "🎥"}
                        </span>
                      </div>

                      {/* Category badge */}
                      {item.category && item.category !== "general" && (
                        <div className="absolute top-3 right-3 pointer-events-none z-10">
                          <span className="inline-block bg-amber-500/80 backdrop-blur-sm text-white text-[10px] px-2.5 py-1 rounded-full shadow-sm">
                            {item.category === "foi" && "🙏"}
                            {item.category === "louange" && "🎵"}
                            {item.category === "esperance" && "✨"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content below image */}
                    <div className="p-3.5 bg-card border-t border-border/30">
                      <h3 className="font-serif font-semibold leading-snug text-card-foreground line-clamp-1 text-sm mb-2">
                        {item.title}
                      </h3>

                      {/* Verse below the image */}
                      {item.verse && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Quote className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600/70 dark:text-amber-400/70">
                              Verset
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground italic leading-relaxed line-clamp-2">
                            "{item.verse.text}"
                          </p>
                          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                            {item.verse.reference}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page + 1} / {Math.ceil(total / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={offset + limit >= total}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">
              {activeCategory ? "Aucun média dans cette catégorie" : "Aucun média pour le moment"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {activeCategory
                ? "Essayez de sélectionner une autre catégorie ou revenez plus tard."
                : "Les images et vidéos de la galerie apparaîtront ici une fois ajoutées."}
            </p>
          </motion.div>
        )}
      </motion.section>

      {/* Verse detail modal */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">
                  {selectedItem.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="rounded-xl overflow-hidden border border-border/50 bg-muted">
                  {selectedItem.type === "image" ? (
                    <img
                      src={getImageUrl(selectedItem.mediaUrl)}
                      alt={selectedItem.title}
                      className="w-full h-auto max-h-[50vh] object-contain"
                    />
                  ) : selectedItem.youtubeUrl ? (
                    <YouTubeEmbed url={selectedItem.youtubeUrl} />
                  ) : (
                    <video
                      src={getImageUrl(selectedItem.mediaUrl)}
                      controls
                      muted
                      loop={selectedItem.loop}
                      className="w-full aspect-video"
                    />
                  )}
                </div>

                {selectedItem.verse && (
                  <div className="relative bg-gradient-to-br from-amber-50/50 via-background to-blue-50/30 dark:from-amber-950/20 dark:to-blue-950/20 rounded-xl border border-amber-200/30 dark:border-amber-800/30 p-6">
                    <Quote className="absolute top-4 right-4 w-10 h-10 text-amber-400/20" />
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs uppercase tracking-widest font-bold text-amber-600/80 dark:text-amber-400/80">
                        Verset biblique
                      </span>
                    </div>
                    <p className="text-lg italic text-foreground/90 font-serif leading-relaxed mb-3">
                      « {selectedItem.verse.text} »
                    </p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                      {selectedItem.verse.reference}
                    </p>
                    {selectedItem.verse.summary && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">
                          Méditation
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {selectedItem.verse.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedItem.category && selectedItem.category !== "general" && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-xs uppercase tracking-wider font-medium">Catégorie :</span>
                    <span>
                      {selectedItem.category === "foi" && "🙏 Foi"}
                      {selectedItem.category === "louange" && "🎵 Louange"}
                      {selectedItem.category === "esperance" && "✨ Espérance"}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}