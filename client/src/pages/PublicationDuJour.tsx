import { trpc } from "@/lib/trpc";
import PageContentDisplay from "@/components/PageContentDisplay";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

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
  const { data: galleryData, isLoading: galleryLoading } =
    trpc.gallery.featured.useQuery();
  const { data: latestVerse } = trpc.verses.latest.useQuery();
  const items = galleryData ?? [];

  const imageItems = items.filter((i: any) => i.type === "image");
  const videoItems = items.filter((i: any) => i.type !== "image");
  const verseItem = items.find((i: any) => i.verse);
  const verse = verseItem?.verse || latestVerse;
  const isLoading = galleryLoading;

  return (
    <div className="min-h-screen bg-slate-50/30">
      {/* Title with modern fade-in */}
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-12 md:py-20 text-center"
      >
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground tracking-tight">
            Publications du Jour
          </h1>
          <div className="w-24 h-1 bg-primary mx-auto mt-6 rounded-full opacity-60" />
        </div>
      </motion.section>

      <motion.div
        variants={containerVars}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
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

        {/* Images du Jour */}
        {(isLoading || imageItems.length > 0) && (
          <motion.section variants={sectionVars} className="container pb-16">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Images du Jour
                </h2>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[0, 1].map(i => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border/40">
                      <Skeleton className="w-full aspect-video" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {imageItems.map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="group rounded-xl overflow-hidden border border-border/30 bg-white/40 backdrop-blur-sm hover:shadow-xl hover:border-primary/10 transition-all duration-300"
                    >
                      <div className="overflow-hidden">
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-1000"
                        />
                      </div>
                      <div className="p-3 text-center border-t border-border/10 bg-white/20">
                        <p className="text-sm font-medium text-primary/80">
                          {item.title || `Légende ${idx + 1}`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Vidéos à la Une */}
        {(isLoading || videoItems.length > 0) && (
          <motion.section variants={sectionVars} className="container pb-24">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-serif font-bold text-foreground">
                  Vidéos à la Une
                </h2>
                <div className="flex-1 h-px bg-border/40" />
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[0, 1].map(i => (
                    <div key={i} className="rounded-xl overflow-hidden border border-border/40">
                      <Skeleton className="w-full aspect-video" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {videoItems.map((item: any, idx: number) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      className="rounded-xl overflow-hidden border border-border/30 bg-white/40 backdrop-blur-sm hover:shadow-xl hover:border-primary/10 transition-all duration-300"
                    >
                      <div className="px-4 py-2.5 bg-primary/5 flex items-center justify-between border-b border-border/10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                          Vidéo {idx + 1}
                        </span>
                      </div>
                      <div className="p-4 bg-white/10">
                        {item.youtubeUrl ? (
                          <YouTubeEmbed url={item.youtubeUrl} />
                        ) : item.mediaUrl ? (
                          <video
                            src={item.mediaUrl}
                            controls
                            className="w-full rounded-lg aspect-video object-cover"
                          />
                        ) : null}
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
