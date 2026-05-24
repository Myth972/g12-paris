import { trpc } from "@/lib/trpc";
import PageContentDisplay from "@/components/PageContentDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVars: any = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } },
};

export default function GalleriesPage() {
  const motionEnabled = useMotionEnabled();
  const [page, setPage] = useState(0);
  const limit = 12;
  const offset = useMemo(() => page * limit, [page]);

  const { data, isLoading } = trpc.gallery.list.useQuery({ limit, offset });
  const items = data?.items ?? [];

  return (
    <div className="min-h-screen">
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

      {/* Custom content section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="container py-10 border-t border-border/30"
      >
        <h3 className="text-xl font-serif font-bold text-foreground mb-6">
          Contenus en vedette
        </h3>
        <PageContentDisplay pageId="galeries" mode="grid" />
      </motion.section>

      {/* Gallery grid */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="container pb-16 border-t border-border/30 pt-16"
      >
        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden border border-border/50"
              >
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : items.length > 0 ? (
          <>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVars}
              initial={motionEnabled ? "hidden" : "visible"}
              whileInView={motionEnabled ? "visible" : undefined}
              animate={motionEnabled ? undefined : "visible"}
              viewport={motionEnabled ? { once: true, margin: "-100px" } : undefined}
            >
              {items.map((item: any) => (
                <motion.div
                  key={item.id}
                  variants={itemVars}
                  whileHover={motionEnabled ? { y: -10, scale: 1.03, zIndex: 10 } : undefined}
                  className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-primary/40 hover:shadow-[0_15px_40px_rgba(var(--primary),0.15)] transition-all duration-300 touch-manipulation cursor-pointer"
                >
                  {/* Media */}
                  <div className="relative overflow-hidden bg-muted aspect-[16/10]">
                    {item.type === "image" ? (
                      <img
                        src={item.mediaUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-500 select-none"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full">
                        {item.youtubeUrl && (
                          <YouTubeEmbed url={item.youtubeUrl} />
                        )}
                      </div>
                    )}

                    {/* Type badge */}
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <span className="inline-block bg-background/80 backdrop-blur-sm text-foreground font-medium text-xs px-3 py-1 rounded-full shadow-sm">
                        {item.type === "image" ? "📷 Image" : "🎥 Vidéo"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 relative z-0 bg-card">
                    <h3 className="font-serif font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-1">
                      {item.title}
                    </h3>

                    {/* Verse preview - animated slide up */}
                    {item.verse && (
                      <div className="absolute left-0 right-0 bottom-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out border-t border-primary/20 backdrop-blur-sm z-20">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-primary mb-1">
                          Verset associé
                        </p>
                        <p className="text-sm text-foreground/90 italic mb-2 line-clamp-3">
                          "{item.verse.text}"
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {item.verse.reference}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {items.length >= limit && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
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
              <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">
              Aucun média pour le moment
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Les images et vidéos de la galerie apparaîtront ici une fois ajoutées.
            </p>
          </motion.div>
        )}
      </motion.section>
    </div>
  );
}
