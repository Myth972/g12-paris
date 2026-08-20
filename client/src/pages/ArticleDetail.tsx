import { trpc } from "@/lib/trpc";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import ArticleCard from "@/components/ArticleCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Calendar,
  User,
  Share2,
  Clock,
  ChevronRight,
  List,
} from "lucide-react";
import { useLocation, useParams, Link } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import {
  extractHeadings,
  injectHeadingIds,
  type TocSection,
} from "@/lib/articleHeadings";

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
    "actualité": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    "culte": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    "enseignement": "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    "témoignage": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    "musique": "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    "prière": "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    "événement": "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    "annonce": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  };
  return colors[category.toLowerCase()] || "bg-primary/10 text-primary";
}

/* ---------- Proposition 4 : sommaire auto-généré ---------- */
function ArticleToc({ sections }: { sections: TocSection[] }) {
  if (sections.length === 0) return null;
  return (
    <nav
      aria-label="Sommaire"
      className="hidden lg:block sticky top-24 self-start"
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        <List className="w-3.5 h-3.5" />
        Sommaire
      </p>
      <ul className="space-y-2.5 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={`text-muted-foreground hover:text-primary transition-colors leading-snug ${
                section.level === 3 ? "ml-3 text-[13px]" : ""
              }`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
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

  const sections = article ? extractHeadings(article.content) : [];
  const contentHtml = article
    ? injectHeadingIds(article.content, sections)
    : "";

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

  const hasToc = sections.length > 0;

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

      {/* ---------- Proposition 1 : héros épuré ---------- */}
      <header className="container max-w-5xl mx-auto pt-4 pb-8 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${getCategoryColor(article.category)}`}
          >
            {article.category}
          </span>

          <h1 className="mt-5 font-serif font-bold leading-tight text-[clamp(1.75rem,4vw,3.5rem)] text-foreground">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose mx-auto whitespace-pre-wrap break-words">
              {article.excerpt}
            </p>
          )}

          {/* Méta centrée avec points · */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-muted-foreground">
            {article.authorName && (
              <>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {article.authorName}
                </span>
                <span>·</span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(article.createdAt)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {estimateReadingTime(article.title, article.content)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="ml-2 rounded-full text-muted-foreground"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Partager
            </Button>
          </div>
        </div>
      </header>

      {/* Séparateur décoratif */}
      <div className="container max-w-5xl mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="border-t border-border/60" />
        </div>
      </div>

      {/* Cover image (micro-détail : ombre douce, coins arrondis) */}
      {article.coverImageUrl && (
        <div className="container max-w-5xl mx-auto mt-8 mb-10 px-4">
          <figure>
            <div className="rounded-2xl overflow-hidden shadow-sm select-none">
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

      {/* ---------- Propositions 3 & 4 : typographie premium + sommaire ---------- */}
      <div className="container max-w-5xl mx-auto px-4">
        <div
          className={
            hasToc
              ? "grid lg:grid-cols-[220px_1fr] gap-8 items-start"
              : ""
          }
        >
          {hasToc && <ArticleToc sections={sections} />}

          <div className="prose-article break-words">
            <Streamdown>{contentHtml}</Streamdown>
          </div>
        </div>
      </div>

      {/* ---------- Proposition 5 : articles similaires + fin épurée ---------- */}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((ra: any) => (
                <ArticleCard key={ra.id} article={ra} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fin d'article : navigation discrète */}
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