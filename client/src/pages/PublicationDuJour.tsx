import { trpc } from "@/lib/trpc";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import PageContentDisplay from "@/components/PageContentDisplay";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";

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
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
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

      <motion.div
        variants={containerVars}
        initial={motionEnabled ? "hidden" : "visible"}
        whileInView={motionEnabled ? "visible" : undefined}
        animate={motionEnabled ? undefined : "visible"}
        viewport={motionEnabled ? { once: true } : undefined}
      >
        {/* Admin-managed page content */}
        <motion.section variants={sectionVars} className="container pb-16">
          <PageContentDisplay pageId="publication-du-jour" mode="cards" />
        </motion.section>

        {/* Verset du Jour - Redesigned for Premium glassmorphism feel */}
        {verse && (
          <motion.section variants={sectionVars} className="container pb-16">
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

        {/* Publications du Jour (Image 1 + Video 1, etc.) */}
        {(isLoading || pairedItems.length > 0) && (
          <motion.section variants={sectionVars} className="container pb-24">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Publications du Jour
                </h2>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {isLoading ? (
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
              ) : (
                <div className="space-y-8">
                  {pairedItems.map(pair => (
                    <motion.div
                      key={`pair-${pair.index}`}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      {/* Image */}
                      <div className="group rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl hover:border-primary/10 transition-all duration-300">
                        {pair.image ? (
                          <>
                            <div className="overflow-hidden relative">
                              <img
                                src={pair.image.mediaUrl}
                                alt={pair.image.title}
                                className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                              />
                            </div>
                            <div className="py-3 px-4 text-center border-t border-border/10 bg-white/20 backdrop-blur-lg">
                              <p className="text-sm font-medium text-primary/80 tracking-tight">
                                {pair.image.title || `Image ${pair.index + 1}`}
                              </p>
                            </div>
                          </>
                        ) : (
                          <div className="w-full aspect-[16/10] flex items-center justify-center text-xs text-muted-foreground">
                            Aucune image
                          </div>
                        )}
                      </div>

                      {/* Video */}
                      <div className="rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl hover:border-primary/10 transition-all duration-300">
                        <div className="px-5 py-3 bg-white/10 backdrop-blur-lg flex items-center justify-between border-b border-border/10">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                            Vidéo {pair.index + 1}
                          </span>
                        </div>
                        <div className="p-4">
                          {pair.video ? (
                            pair.video.youtubeUrl ? (
                              <YouTubeEmbed url={pair.video.youtubeUrl} />
                            ) : pair.video.mediaUrl ? (
                              <video
                                src={pair.video.mediaUrl}
                                controls
                                muted
                                className="w-full rounded-lg aspect-video object-contain bg-black/5"
                              />
                            ) : null
                          ) : (
                            <div className="w-full aspect-video flex items-center justify-center text-xs text-muted-foreground bg-black/5 rounded-lg">
                              Aucune vidéo
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}
      </motion.div>
    </div>
  );
}
