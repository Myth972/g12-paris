import { trpc } from "@/lib/trpc";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import ArticleCard from "@/components/ArticleCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Share2, Clock, ChevronRight } from "lucide-react";
import { useLocation, useParams, Link } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import ScrollToTopButton from "@/components/ScrollToTopButton";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function estimateReadingTime(title: string, content: string): string {
  const text = `${title} ${content || ""}`;
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 150));
  return `${minutes} min`;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    "actualité": "bg-blue-500/90",
    "culte": "bg-purple-500/90",
    "enseignement": "bg-emerald-500/90",
    "témoignage": "bg-amber-500/90",
    "musique": "bg-rose-500/90",
    "prière": "bg-indigo-500/90",
    "événement": "bg-orange-500/90",
    "annonce": "bg-teal-500/90",
  };
  return colors[category.toLowerCase()] || "bg-primary/90";
}

export default function ArticleDetail() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();

  const {
    data: article,
    isLoading,
    error,
  } = trpc.articles.bySlug.useQuery(
    { slug: params.slug ?? "" },
    { enabled: !!params.slug }
  );

  const { data: relatedData } = trpc.articles.list.useQuery(
    {
      limit: 4,
      offset: 0,
      category: article?.category ?? undefined,
    },
    { enabled: !!article }
  );

  const relatedArticles = (relatedData?.items ?? []).filter(
    (a: any) => a.slug !== params.slug
  ).slice(0, 3);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-10 w-3/4 mb-3" />
        <Skeleton className="h-5 w-1/3 mb-8" />
        <Skeleton className="aspect-video w-full rounded-xl mb-8" />
        <div className="space-y-3 max-w-2xl mx-auto">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container max-w-4xl mx-auto py-20 text-center px-4">
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">
          Article introuvable
        </h2>
        <p className="text-muted-foreground mb-6">
          Cet article n'existe pas ou a été supprimé.
        </p>
        <Button variant="outline" onClick={() => setLocation("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <article className="pb-16">
      <ReadingProgressBar />
      <ScrollToTopButton />

      {/* Back button */}
      <div className="container max-w-5xl mx-auto pt-6 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
      </div>

      {/* Header */}
      <header className="container max-w-5xl mx-auto pt-4 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Badge
            variant="secondary"
            className={`mb-4 font-bold uppercase tracking-widest text-[10px] text-white border-0 shadow-sm ${getCategoryColor(article.category)}`}
          >
            {article.category}
          </Badge>

          <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 text-sm text-muted-foreground">
            {article.authorName && (
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {article.authorName}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(article.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {estimateReadingTime(article.title, article.content)}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="ml-auto text-muted-foreground"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Partager
            </Button>
          </div>
        </div>
      </header>

      {/* Separator */}
      <div className="container max-w-5xl mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="border-t border-border/60" />
        </div>
      </div>

      {/* Cover image */}
      {article.coverImageUrl && (
        <div className="container max-w-5xl mx-auto mt-8 mb-10 px-4">
          <figure>
            <div className="rounded-xl overflow-hidden shadow-lg select-none">
              <img
                src={article.coverImageUrl}
                alt={article.title}
                className="w-full max-h-[560px] object-cover"
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
                fetchPriority="high"
                loading="eager"
                decoding="async"
              />
            </div>
          </figure>
        </div>
      )}

      {/* YouTube video */}
      {article.youtubeUrl && (
        <div className="container max-w-4xl mx-auto mb-10 px-4">
          <YouTubeEmbed url={article.youtubeUrl} />
        </div>
      )}

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4">
        <div className="prose-article break-words">
          <Streamdown>{article.content}</Streamdown>
        </div>
      </div>

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <section className="container max-w-5xl mx-auto mt-16 px-4">
          <div className="border-t border-border/60 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-foreground">
                Articles similaires
              </h2>
              <Link
                href={`/categorie/${article.category}`}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                Voir tout
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {relatedArticles.map((ra: any) => (
                <ArticleCard key={ra.id} article={ra} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom navigation */}
      <div className="container max-w-5xl mx-auto mt-12 px-4">
        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/categorie/actualité">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Tous les articles
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare} className="text-muted-foreground">
            <Share2 className="w-4 h-4 mr-1" />
            Partager
          </Button>
        </div>
      </div>
    </article>
  );
}
