import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import PageContentDisplay from "@/components/PageContentDisplay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { Newspaper, ChevronRight } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function Home() {
  const [page, setPage] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);
  const limit = 12;
  const offset = useMemo(() => page * limit, [page]);

  const { data, isLoading } = trpc.articles.list.useQuery({ limit, offset });
  const settingsQuery = trpc.siteSettings.getAll.useQuery();

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = offset + limit < total;
  const heroBgUrl = settingsQuery.data?.homeHeroBgUrl as string | undefined;
  const heroOpacityRaw = settingsQuery.data?.homeHeroBgOpacity as
    | string
    | undefined;
  const heroOpacityPercent = Math.max(
    0,
    Math.min(60, Number(heroOpacityRaw ?? 18))
  );
  const heroOpacity = heroOpacityPercent / 100;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || 0;
      const offset = y * 0.3;
      setHeroOffset(Math.max(-60, Math.min(180, offset)));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-[180px] min-h-[420px] md:min-h-[520px] overflow-hidden flex items-center">
        {heroBgUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url(${heroBgUrl})`,
              opacity: heroOpacity,
              backgroundAttachment: "scroll",
              backgroundPosition: `center calc(50% + ${heroOffset + 40}px)`,
              backgroundSize: "85%",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-transparent pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Dernières nouvelles
              </span>
            </div>
            <PageTitleEditor
              pageKey="home"
              defaultH1={"L'actualité qui compte,\nracontée avec rigueur."}
              defaultH2=""
              h1ClassName="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight"
            />
            <PageTextEditor
              pageKey="home"
              textKey="hero"
              defaultText="Restez informé avec les dernières nouvelles de Paris et d'ailleurs. Articles, reportages et vidéos au quotidien."
              className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Custom content section */}
      <section className="container py-16 border-t border-border/30">
        <div className="mb-8">
          <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
            Contenu en vedette
          </h3>
          <p className="text-muted-foreground">
            Sélection d'images et vidéos à travers le site
          </p>
        </div>
        <PageContentDisplay featuredOnly />
      </section>

      {/* Articles grid */}
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
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              Aucun article pour le moment
            </h3>
            <p className="text-sm text-muted-foreground">
              Les articles apparaîtront ici dès leur publication.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: any, index: number) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  featured={index === 0 && page === 0}
                />
              ))}
            </div>

            {/* Pagination */}
            {total > limit && (
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
                  Page {page + 1} sur {Math.ceil(total / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
