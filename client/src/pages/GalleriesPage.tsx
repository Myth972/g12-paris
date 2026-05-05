import { trpc } from "@/lib/trpc";
import PageContentDisplay from "@/components/PageContentDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export default function GalleriesPage() {
  const [page, setPage] = useState(0);
  const limit = 12;
  const offset = useMemo(() => page * limit, [page]);

  const { data, isLoading } = trpc.gallery.list.useQuery({ limit, offset });
  const items = data?.items ?? [];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Galeries
              </span>
            </div>
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
      </section>

      {/* Custom content section */}
      <section className="container py-10 border-t border-border/30">
        <h3 className="text-xl font-serif font-bold text-foreground mb-6">
          Contenus en vedette
        </h3>
        <PageContentDisplay pageId="galeries" mode="grid" />
      </section>

      {/* Gallery grid */}
      <section className="container pb-16 border-t border-border/30 pt-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-border/50"
              >
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className="group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-border hover:shadow-lg active:shadow-lg active:scale-[0.99] transition-all duration-300 touch-manipulation"
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
                      <span className="inline-block bg-white/90 backdrop-blur-sm text-foreground font-medium text-xs px-3 py-1 rounded-full shadow-sm">
                        {item.type === "image" ? "📷 Image" : "🎥 Vidéo"}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-serif font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3">
                      {item.title}
                    </h3>

                    {/* Verse preview */}
                    {item.verse && (
                      <div className="space-y-2 pt-3 border-t border-border/50 group-active:max-h-28 group-active:overflow-y-auto group-active:pr-1">
                        <p className="text-xs font-semibold text-primary">
                          Verset associé
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 group-active:line-clamp-none italic">
                          "{item.verse.text}"
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {item.verse.reference}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

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
        ) : null}
      </section>
    </div>
  );
}
