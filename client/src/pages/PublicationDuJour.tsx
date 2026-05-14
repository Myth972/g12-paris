import { trpc } from "@/lib/trpc";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import PageContentDisplay from "@/components/PageContentDisplay";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import FloatingVignette from "@/components/FloatingVignette";

// Chaque section gère son propre scroll-trigger (plus robuste que whileInView sur un grand conteneur)
const sectionEntry: any = {
  hidden: { y: 28, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function PublicationDuJour() {
  const motionEnabled = useMotionEnabled();
  const { data: galleryData, isLoading: galleryLoading } =
    trpc.gallery.featured.useQuery();
  const { data: latestVerse } = trpc.verses.latest.useQuery();
  const items = galleryData ?? [];

  const imageItems = items.filter((i: any) => i.type === "image");
  const videoItems = items.filter((i: any) => i.type !== "image");
  const verseItem = items.find((i: any) => i.verse);
  const verse = verseItem?.verse || latestVerse;
  const isLoading = galleryLoading;
  const pairCount = Math.max(imageItems.length, videoItems.length);
  const pairedItems = Array.from({ length: pairCount }).map((_, idx) => ({
    image: imageItems[idx],
    video: videoItems[idx],
    index: idx,
  }));

  // Images de démonstration pour la Galerie Flottante si la galerie est vide
  const DEMO_IMAGES: import("@/components/FloatingVignette").VignetteImage[] = [
    {
      src: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop",
      alt: "Publication du jour 1",
      title: "Parole du Jour",
    },
    {
      src: "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=600&auto=format&fit=crop",
      alt: "Publication du jour 2",
      title: "Message d'Espoir",
    },
    {
      src: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=600&auto=format&fit=crop",
      alt: "Publication du jour 3",
      title: "Méditation",
    },
  ];

  const vignetteImages = imageItems.length > 0
    ? imageItems.slice(0, 3).map((item: any): import("@/components/FloatingVignette").VignetteImage => ({
        src: item.mediaUrl,
        alt: item.title || "Publication du jour",
        title: item.title,
      }))
    : DEMO_IMAGES;

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

      <div>
        {/* Admin-managed page content */}
        <motion.section
          variants={sectionEntry}
          initial={motionEnabled ? "hidden" : "visible"}
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="container pb-16"
        >
          <PageContentDisplay pageId="publication-du-jour" mode="cards" />
        </motion.section>

        {/* Verset du Jour - Redesigned for Premium glassmorphism feel */}
        {verse && (
          <motion.section
            variants={sectionEntry}
            initial={motionEnabled ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="container pb-16"
          >
            <div className="relative overflow-hidden bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl p-8 md:p-12 max-w-4xl mx-auto shadow-xl shadow-primary/5">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col items-center text-center z-10">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Quote className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-6">
                  Verset du Jour
                </h3>

                <p className="text-xl md:text-2xl italic text-foreground/80 font-serif leading-relaxed mb-6 max-w-3xl">
                  « {verse.text} »
                </p>

                <p className="text-sm md:text-base font-bold text-primary tracking-wider uppercase mb-10">
                  {verse.reference}
                </p>

                {verse.summary && (
                  <div className="text-left w-full max-w-2xl pt-8 border-t border-primary/10">
                    <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-4">
                      Résumé Biblique
                    </h4>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                      {verse.summary}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {/* ✨ Vignettes Flottantes — parallaxe magnétique (toujours visible) */}
        {!isLoading && (
          <motion.section
            variants={sectionEntry}
            initial={motionEnabled ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="container pb-32"
          >
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Galerie Flottante
                </h2>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-xs text-muted-foreground font-medium tracking-wide">
                  Survolez pour animer
                </span>
              </div>
              <div className="relative rounded-3xl bg-gradient-to-br from-primary/5 via-white/60 to-accent/10 backdrop-blur-sm border border-white/60 shadow-xl shadow-primary/5 overflow-visible">
                <FloatingVignette
                  images={vignetteImages}
                  layout={vignetteImages.length >= 3 ? "trio" : "duo"}
                  className="py-8"
                />
              </div>
            </div>
          </motion.section>
        )}

        {/* Vidéos */}
        {(isLoading || videoItems.length > 0) && (
          <motion.section
            variants={sectionEntry}
            initial={motionEnabled ? "hidden" : "visible"}
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="container pb-24"
          >
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Vidéos du Jour
                </h2>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[0, 1].map(i => (
                    <Skeleton key={i} className="w-full aspect-video rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {videoItems.map((video: any) => (
                    <div key={video.id} className="rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md p-4">
                      {video.youtubeUrl ? (
                        <YouTubeEmbed url={video.youtubeUrl} />
                      ) : video.mediaUrl ? (
                        <video
                          src={video.mediaUrl}
                          controls
                          muted
                          className="w-full rounded-lg aspect-video object-contain bg-black/5"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
