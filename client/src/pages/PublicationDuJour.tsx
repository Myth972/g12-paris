import { trpc } from "@/lib/trpc";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { useAuth } from "@/_core/hooks/useAuth";
import { useBlobUpload } from "@/hooks/useBlobUpload";

import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Quote,
  AlertTriangle,
  ImageIcon,
  Plus,
  Pencil,
  Save,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { useState, useCallback } from "react";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { toast } from "sonner";

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const sectionVars: any = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PublicationDuJour() {
  const motionEnabled = useMotionEnabled();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();

  const { data: galleryData, isLoading: galleryLoading, error: galleryError, refetch: refetchGallery } =
    trpc.gallery.featured.useQuery();
  const { data: latestVerse, isLoading: verseLoading, error: verseError } = trpc.verses.latest.useQuery();
  const items = galleryData ?? [];

  const updateVerseMutation = trpc.verses.update.useMutation({
    onSuccess: () => {
      utils.verses.latest.invalidate();
      toast.success("Verset mis à jour");
      setEditing(false);
    },
    onError: err => toast.error("Erreur : " + err.message),
  });

  const { uploadFile, isUploading } = useBlobUpload();

  const handleVerseImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await uploadFile({ file, folder: "verses" });
    setDraftImageUrl(result.url);
  };

  const imageItems = items.filter((i: any) => i.type === "image");
  const videoItems = items.filter((i: any) => i.type !== "image");
  const verseItem = items.find((i: any) => i.verse);
  const verse = verseItem?.verse || latestVerse;
  const verseImage = verse?.imageUrl || verseItem?.mediaUrl || null;
  const pairCount = Math.max(imageItems.length, videoItems.length);
  const pairedItems = Array.from({ length: pairCount }).map((_, idx) => ({
    image: imageItems[idx],
    video: videoItems[idx],
    index: idx,
  }));

  const openImageInNewTab = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const [editing, setEditing] = useState(false);
  const [draftRef, setDraftRef] = useState("");
  const [draftText, setDraftText] = useState("");
  const [draftSummary, setDraftSummary] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");

  const startEditing = () => {
    if (!verse) return;
    setDraftRef(verse.reference);
    setDraftText(verse.text);
    setDraftSummary(verse.summary);
    setDraftImageUrl(verse.imageUrl ?? "");
    setEditing(true);
  };

  const handleSaveVerse = () => {
    if (!verse) return;
    const payload: Record<string, unknown> = {};
    if (draftRef !== verse.reference) payload.reference = draftRef;
    if (draftText !== verse.text) payload.text = draftText;
    if (draftSummary !== verse.summary) payload.summary = draftSummary;
    if (draftImageUrl !== (verse.imageUrl ?? "")) payload.imageUrl = draftImageUrl || null;
    if (Object.keys(payload).length === 0) {
      setEditing(false);
      return;
    }
    updateVerseMutation.mutate({ id: verse.id, ...payload });
  };

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Title with modern fade-in */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 md:py-20 text-center"
      >
        <div className="container">
          <PageTitleEditor
            pageKey="publication-du-jour"
            defaultH1="Publications du Jour"
            defaultH2=""
            h1ClassName="text-4xl md:text-5xl font-bold font-serif text-foreground tracking-tight"
            alignClassName="text-center"
          />
          <div className="mt-4 max-w-2xl mx-auto">
            <PageTextEditor
              pageKey="publication-du-jour"
              textKey="hero"
              defaultText="Découvrez les publications mises en avant du jour, entre images inspirantes et vidéos édifiantes."
              className="text-muted-foreground text-base leading-relaxed"
            />
          </div>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full opacity-60" />
        </div>
      </motion.section>

      {(galleryError || verseError) && (
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container pb-6"
        >
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-6 py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-destructive text-sm">Erreur de chargement</h3>
                <p className="text-sm text-destructive/80 mt-1">
                  {galleryError
                    ? "Impossible de charger les publications du jour."
                    : "Impossible de charger le verset du jour."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => refetchGallery()}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <motion.div
        variants={containerVars}
        initial={motionEnabled ? "hidden" : "visible"}
        whileInView={motionEnabled ? "visible" : undefined}
        animate={motionEnabled ? undefined : "visible"}
        viewport={motionEnabled ? { once: true } : undefined}
      >
        {/* Verset du Jour - Redesigned for Premium glassmorphism feel */}
        {verseError ? null : verseLoading ? (
          <motion.section variants={sectionVars} className="container pb-16 relative z-50">
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
              <div className="relative flex flex-col items-center text-center z-10">
                <Skeleton className="w-12 h-12 rounded-full mb-6" />
                <Skeleton className="h-6 w-48 mb-6" />
                <Skeleton className="h-8 w-full max-w-3xl mb-2" />
                <Skeleton className="h-8 w-2/3 max-w-xl mb-6" />
                <Skeleton className="h-5 w-40 mb-10" />
                <div className="text-center w-full max-w-2xl pt-8 border-t border-primary/10">
                  <Skeleton className="h-3 w-32 mx-auto mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                </div>
              </div>
            </div>
          </motion.section>
        ) : verse ? (
          <motion.section variants={sectionVars} className="container pb-16 relative z-50">
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto shadow-xl shadow-primary/5">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col items-center text-center z-10">
                {isAdmin && !editing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute -right-4 -top-8 z-20 h-8 px-3 text-xs shadow-md bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={startEditing}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                )}

                {verseImage && !editing && (
                  <div className="w-full max-w-xl mb-8 rounded-2xl overflow-hidden border border-white/40 shadow-lg">
                    <img
                      src={verseImage}
                      alt="Verset du Jour"
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {editing ? (
                  <div className="w-full max-w-xl space-y-4">
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Image (URL ou upload)
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={draftImageUrl}
                          onChange={e => setDraftImageUrl(e.target.value)}
                          placeholder="https://..."
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          disabled={isUploading}
                          className="relative shrink-0"
                        >
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleVerseImageUpload}
                          />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Référence
                      </label>
                      <Input
                        value={draftRef}
                        onChange={e => setDraftRef(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Texte du verset
                      </label>
                      <Textarea
                        value={draftText}
                        onChange={e => setDraftText(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        Résumé biblique
                      </label>
                      <Textarea
                        value={draftSummary}
                        onChange={e => setDraftSummary(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={handleSaveVerse}
                        disabled={updateVerseMutation.isPending}
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Enregistrer
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(false)}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                      <Quote className="w-6 h-6 text-primary" />
                    </div>

                    <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-6">
                      Verset du Jour
                    </h3>

                    <p className="text-xl md:text-2xl italic text-foreground/80 font-serif leading-relaxed mb-6 max-w-3xl whitespace-pre-line">
                      « {verse.text} »
                    </p>

                    <p className="text-sm md:text-base font-bold text-primary tracking-wider uppercase mb-10">
                      {verse.reference}
                    </p>

                    {verse.summary && (
                      <div className="text-center w-full max-w-2xl pt-8 border-t border-primary/10">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-foreground/60 mb-4">
                          Résumé Biblique
                        </h4>
                    <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
                      {verse.summary}
                    </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.section>
        ) : null}


        {/* Publications du Jour (Image 1 + Video 1, etc.) */}
        <motion.section variants={sectionVars} className="container pb-24">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-serif font-bold text-foreground">
                Publications du Jour
              </h2>
              <div className="flex-1 h-px bg-border/40" />
            </div>

            {galleryLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[0, 1].map(i => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="rounded-xl overflow-hidden border border-border/40">
                      <Skeleton className="w-full aspect-[16/10]" />
                    </div>
                    <div className="rounded-xl overflow-hidden border border-border/40">
                      <Skeleton className="w-full aspect-video" />
                    </div>
                  </div>
                ))}
              </div>
            ) : pairedItems.length > 0 ? (
              <div className="space-y-16 md:space-y-32 mt-12">
                {pairedItems.map((pair, idx) => {
                  const isEven = idx % 2 === 0;
                  return (
                  <motion.div
                    key={`pair-${pair.index}`}
                    className="relative w-full h-[450px] md:h-[600px] flex items-center"
                  >
                     {/* Image (Background Layer) */}
                      {pair.image ? (
                        <motion.div
                          animate={motionEnabled ? { y: [0, -25, 0], scale: [1, 1.03, 1] } : {}}
                          whileHover={motionEnabled ? { scale: 1.08, rotate: 3, zIndex: 30 } : {}}
                          whileTap={motionEnabled ? { scale: 0.95 } : {}}
                          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                          onClick={() => openImageInNewTab(pair.image!.mediaUrl)}
                          className={`absolute ${isEven ? 'left-0 md:left-4' : 'right-0 md:right-4'} top-0 md:top-10 w-[85%] md:w-[60%] h-[75%] md:h-[80%] z-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/40 cursor-pointer group hover:shadow-primary/30 transition-shadow active:scale-[0.97]`}
                        >
                          <img
                            src={pair.image.mediaUrl}
                            alt={pair.image.title}
                            className="w-full h-full object-cover select-none group-hover:scale-110 transition-transform duration-700"
                            onContextMenu={(e) => e.preventDefault()}
                            draggable={false}
                            loading="lazy"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 text-white pointer-events-none">
                            <p className="text-sm md:text-lg font-serif font-medium tracking-wide drop-shadow-md">
                              {pair.image.title || `Image ${pair.index + 1}`}
                            </p>
                          </div>
                        </motion.div>
                     ) : (
                       <div className={`absolute ${isEven ? 'left-0' : 'right-0'} top-0 w-[85%] md:w-[60%] h-[75%] z-0 rounded-2xl border-4 border-white/40 bg-black/5 flex items-center justify-center text-muted-foreground`}>
                         Aucune image
                       </div>
                     )}

                     {/* Video (Foreground Layer) */}
                      {pair.video ? (
                        <motion.div
                          animate={motionEnabled ? { y: [0, 25, 0], scale: [1, 1.05, 1], rotate: [0, 2, 0] } : {}}
                          whileHover={motionEnabled ? { scale: 1.1, zIndex: 40 } : {}}
                          whileTap={motionEnabled ? { scale: 0.95 } : {}}
                          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                          className={`absolute ${isEven ? 'right-0 md:right-4' : 'left-0 md:left-4'} bottom-0 md:bottom-10 w-[90%] md:w-[55%] z-10 rounded-2xl overflow-hidden shadow-[0_25px_75px_rgba(0,0,0,0.4)] border-4 border-background bg-background cursor-pointer hover:shadow-primary/50 hover:border-primary/30 transition-all group active:scale-[0.97]`}
                        >
                          <div className="bg-background">
                            <div className="px-4 py-2 flex items-center justify-between border-b border-border/10 bg-muted/30 group-hover:bg-primary/5 transition-colors">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
                                Vidéo {pair.index + 1}
                              </span>
                            </div>
                            <div className="p-1 md:p-2 bg-black">
                              {pair.video.youtubeUrl ? (
                                <YouTubeEmbed url={pair.video.youtubeUrl} />
                              ) : pair.video.mediaUrl ? (
                                <video
                                  src={pair.video.mediaUrl}
                                  controls
                                  playsInline
                                  muted
                                  loop={pair.video.loop}
                                  className="w-full aspect-video object-contain"
                                />
                              ) : null}
                            </div>
                          </div>
                        </motion.div>
                     ) : (
                       <div className={`absolute ${isEven ? 'right-0' : 'left-0'} bottom-0 w-[90%] md:w-[55%] z-10 rounded-2xl border-4 border-background bg-muted flex items-center justify-center aspect-video text-muted-foreground shadow-xl`}>
                         Aucune vidéo
                       </div>
                     )}
                  </motion.div>
                )})}
              </div>
            ) : (
              <div className="text-center py-16">
                <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-serif font-bold text-foreground">
                  Aucune publication pour aujourd'hui
                </h3>
                <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
                  Aucune publication n'est actuellement marquée pour apparaître en une.
                  Rendez-vous dans l'administration pour ajouter du contenu en vedette.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  asChild
                >
                  <a href="/admin">
                    <Plus className="w-4 h-4 mr-2" />
                    Gérer la galerie
                  </a>
                </Button>
              </div>
            )}
          </div>
        </motion.section>
      </motion.div>
    </div>
  );
}
