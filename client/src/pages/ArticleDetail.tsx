import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
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
  Lightbulb,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useRef, useEffect, type MouseEvent } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import StoryCardGenerator from "@/components/StoryCardGenerator";
import ShareButtons from "@/components/ShareButtons";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import {
  extractHeadings,
  injectHeadingIds,
  type TocSection,
} from "@/lib/articleHeadings";
import { useSeo } from "@/lib/seo";
import { newsArticleJsonLd } from "@/lib/structuredData";

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
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "editeur";

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

  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestMutation = trpc.ai.suggestImprovements.useMutation({
    onSuccess: (data) => {
      setAiSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const sections = article ? extractHeadings(article.content) : [];
  const contentHtml = article
    ? injectHeadingIds(article.content, sections)
    : "";

  /* ---------- Lightbox sur les images du corps de l'article ---------- */
  const proseRef = useRef<HTMLDivElement>(null);
  const [contentImages, setContentImages] = useState<LightboxItem[]>([]);
  const [contentImageIndex, setContentImageIndex] = useState<number | null>(null);

  // Collecte les <img> du corps une fois le contenu rendu : chaque image de
  // l'article devient un media de la lightbox (navigation ← / → entre elles).
  useEffect(() => {
    const node = proseRef.current;
    if (!node || !article) {
      setContentImages([]);
      return;
    }
    const imgs = Array.from(node.querySelectorAll("img")).filter(img =>
      img.getAttribute("src")
    );
    setContentImages(
      imgs.map(img => ({
        type: "image",
        mediaUrl: img.getAttribute("src") ?? "",
        title: img.alt || article.title,
      }))
    );
    // Le DOM ne change que lorsque le contenu de l'article change.
  }, [contentHtml]);

  // Clic délégué sur n'importe quelle image du corps → lightbox plein écran.
  const handleContentClick = (e: MouseEvent<HTMLDivElement>) => {
    const img = (e.target as HTMLElement).closest("img");
    if (!img || !proseRef.current) return;
    // Une image-lien (dans un <a>) garde son comportement de lien.
    if (img.closest("a")) return;
    const idx = Array.from(proseRef.current.querySelectorAll("img")).indexOf(img);
    if (idx >= 0) setContentImageIndex(idx);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const articleStructuredData = useMemo(
    () =>
      article
        ? newsArticleJsonLd({
            title: article.title,
            description: article.excerpt || undefined,
            slug: article.slug,
            image: article.coverImageUrl || undefined,
            publishedTime: article.createdAt
              ? new Date(article.createdAt).toISOString()
              : undefined,
            modifiedTime: article.updatedAt
              ? new Date(article.updatedAt).toISOString()
              : undefined,
            author: (article as any)?.authorName || undefined,
          })
        : undefined,
    [article]
  );

  useSeo({
    title: article?.title,
    description: article?.excerpt || undefined,
    image: article?.coverImageUrl || undefined,
    url: article ? `/article/${article.slug}` : undefined,
    type: "article",
    publishedTime: article?.createdAt ? new Date(article.createdAt).toISOString() : undefined,
    modifiedTime: article?.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
    author: (article as any)?.authorName || undefined,
    jsonLd: articleStructuredData,
  });

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
            {/* Partage rapide WhatsApp / Facebook (OG image de l'article en aperçu) */}
            <ShareButtons
              message={article.title}
              url={typeof window !== "undefined" ? window.location.href : undefined}
              className="ml-1"
 />
            <StoryCardGenerator
              title={article.title}
              excerpt={article.excerpt}
              coverImageUrl={article.coverImageUrl}
              category={article.category}
              slug={article.slug}
            />
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

          <div
            ref={proseRef}
            onClick={handleContentClick}
            className="prose-article break-words [&_img]:cursor-zoom-in [&_img]:transition-opacity [&_img:hover]:opacity-90"
          >
            <Streamdown>{contentHtml}</Streamdown>
          </div>
        </div>
      </div>

      {/* AI Suggestions for editors/admins */}
      {isAdmin && article && (
        <div className="container max-w-5xl mx-auto mt-8 px-4">
          {!showSuggestions ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => suggestMutation.mutate({ articleId: article.id })}
              disabled={suggestMutation.isPending}
              className="gap-2"
            >
              {suggestMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
              Suggérer des améliorations IA
            </Button>
          ) : (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Suggestions d'amélioration
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                  Fermer
                </Button>
              </div>
              <div className="space-y-2">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      s.priority === "haute" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                      s.priority === "moyenne" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    }`}>
                      {s.type}
                    </span>
                    <p className="text-sm text-muted-foreground flex-1">{s.description}</p>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => suggestMutation.mutate({ articleId: article.id })}
                disabled={suggestMutation.isPending}
              >
                {suggestMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                Régénérer
              </Button>
            </div>
          )}
        </div>
      )}

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
          <ShareButtons message={article.title} className="ml-1" />
        </div>
      </div>

      {/* Lightbox des images du corps de l'article */}
      <Lightbox
        items={contentImages}
        index={contentImageIndex}
        onClose={() => setContentImageIndex(null)}
        onIndexChange={setContentImageIndex}
      />
    </article>
  );
}