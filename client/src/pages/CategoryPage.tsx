import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import PageContentDisplay from "@/components/PageContentDisplay";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Newspaper, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { useParams } from "wouter";

const CATEGORY_LABELS: Record<string, string> = {
  actualité: "Actualités",
  "publication du jour": "Publication du jour",
  "culte en ligne": "Culte en ligne",
  bibliothèque: "Bibliothèque",
};

export default function CategoryPage() {
  const params = useParams<{ category: string }>();
  const category = params.category ?? "actualité";
  const categoryLabel =
    CATEGORY_LABELS[category] ??
    category.charAt(0).toUpperCase() + category.slice(1);

  const [page, setPage] = useState(0);
  const limit = 12;
  const offset = useMemo(() => page * limit, [page]);

  const { data, isLoading } = trpc.articles.list.useQuery({
    limit,
    offset,
    category,
  });

  const articles = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMore = offset + limit < total;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-b from-primary/[0.03] to-transparent py-10 md:py-14">
        <div className="container">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-0.5 bg-primary rounded-full" />
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
              Rubrique
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-foreground">
            {categoryLabel}
          </h2>
        </div>
      </section>

      {/* Custom content section */}
      <section className="container py-16 border-t border-border/30">
        <div className="mb-8">
          <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
            Contenu en vedette
          </h3>
          <p className="text-muted-foreground">
            Images, vidéos et contenus spéciaux
          </p>
        </div>
        <PageContentDisplay pageId={category} />
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
              Aucun article dans cette rubrique
            </h3>
            <p className="text-sm text-muted-foreground">
              Les articles de cette catégorie apparaîtront ici.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article: any) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

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
                  className="rounded-full px-6"
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
