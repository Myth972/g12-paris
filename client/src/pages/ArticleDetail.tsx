import { trpc } from "@/lib/trpc";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
      <div className="container max-w-4xl mx-auto py-10">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-5 w-1/3 mb-8" />
        <Skeleton className="aspect-video w-full rounded-xl mb-8" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container max-w-4xl mx-auto py-20 text-center">
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
      {/* Back button */}
      <div className="container max-w-4xl mx-auto pt-6">
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
      <header className="container max-w-4xl mx-auto pt-4 pb-6">
        <Badge variant="secondary" className="mb-4 font-medium">
          {article.category}
        </Badge>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 mt-6 text-sm text-muted-foreground">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="ml-auto"
          >
            <Share2 className="w-4 h-4 mr-1" />
            Partager
          </Button>
        </div>
      </header>

      {/* Cover image */}
      {article.coverImageUrl && (
        <div className="container max-w-5xl mx-auto mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full max-h-[500px] object-cover"
            />
          </div>
        </div>
      )}

      {/* YouTube video */}
      {article.youtubeUrl && (
        <div className="container max-w-4xl mx-auto mb-8">
          <YouTubeEmbed url={article.youtubeUrl} />
        </div>
      )}

      {/* Content */}
      <div className="container max-w-3xl mx-auto">
        <div className="prose-article">
          <Streamdown>{article.content}</Streamdown>
        </div>
      </div>

      {/* Separator */}
      <div className="container max-w-3xl mx-auto mt-12">
        <div className="border-t border-border pt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Tous les articles
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-1" />
            Partager
          </Button>
        </div>
      </div>
    </article>
  );
}
