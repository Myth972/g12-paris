import { trpc } from "@/lib/trpc";
import PageContentDisplay from "@/components/PageContentDisplay";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";

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
    <div className="min-h-screen bg-white">
      {/* Title */}
      <section className="py-10 text-center border-b border-border/30">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground">
            Publications du Jour
          </h1>
        </div>
      </section>

      {/* Admin-managed page content (images, videos from Contenu des pages) */}
      <section className="container py-10">
        <PageContentDisplay pageId="publication-du-jour" mode="cards" />
      </section>

      {/* Images du Jour (from gallery table) */}
      {(isLoading || imageItems.length > 0) && (
        <section className="container pb-10">
          <h2 className="text-xl font-serif font-bold text-foreground mb-6">
            Images du Jour
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map(i => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden border border-border/40"
                >
                  <Skeleton className="w-full aspect-[4/3]" />
                  <div className="py-3 px-2 text-center">
                    <Skeleton className="h-4 w-32 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {imageItems.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden border border-border/40 hover:shadow-md transition-shadow bg-card"
                >
                  <div className="overflow-hidden">
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <p className="text-center text-sm text-primary py-3 px-4">
                    {item.title || `Légende de l'image ${idx + 1}`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Verset du Jour + Résumé Biblique */}
      {verse && (
        <section className="container pb-10">
          <div className="bg-muted/50 border border-border/40 rounded-2xl px-8 py-10 max-w-4xl mx-auto flex flex-col items-center text-center">
            <h3 className="text-lg font-serif font-bold text-foreground mb-4">
              Verset du Jour
            </h3>
            <p className="text-lg italic text-muted-foreground leading-relaxed mb-4 max-w-2xl">
              « {verse.text} »
            </p>
            <p className="text-base font-semibold text-foreground mb-8">
              — {verse.reference}
            </p>

            {verse.summary && (
              <div className="text-left w-full max-w-2xl">
                <h4 className="text-base font-bold text-foreground mb-3">
                  Résumé Biblique
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {verse.summary}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Vidéos à la Une (from gallery table) */}
      {(isLoading || videoItems.length > 0) && (
        <section className="container pb-16">
          <div className="max-w-4xl mx-auto">
            {/* Section heading with red accent dots matching the image */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 inline-block" />
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground mb-6">
              Vidéos à la Une
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[0, 1].map(i => (
                  <div
                    key={i}
                    className="rounded-xl overflow-hidden border border-border/40"
                  >
                    <div className="px-4 py-3 border-b border-border/40">
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="w-full aspect-video" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {videoItems.map((item: any, idx: number) => (
                  <div
                    key={item.id}
                    className="rounded-xl overflow-hidden border border-border/40 bg-card hover:shadow-md transition-shadow"
                  >
                    {/* Card label like "Vidéo 1" */}
                    <div className="px-4 py-3 border-b border-border/40">
                      <span className="text-sm font-medium text-foreground">
                        Vidéo {idx + 1}
                      </span>
                    </div>
                    <div className="p-4">
                      {item.youtubeUrl ? (
                        <YouTubeEmbed url={item.youtubeUrl} />
                      ) : item.mediaUrl ? (
                        <video
                          src={item.mediaUrl}
                          controls
                          className="w-full rounded-lg"
                        />
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
