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
      <div className="container max-w-6xl mx-auto py-10">
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
      <div className="container max-w-6xl mx-auto py-20 text-center">
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
      <div className="container max-w-6xl mx-auto pt-6">
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
      <header className="container max-w-6xl mx-auto pt-4 pb-6">
        <Badge variant="secondary" className="mb-4 font-bold uppercase tracking-widest text-[10px] bg-primary/10 text-primary border-primary/20">
          {article.category}
        </Badge>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground leading-tight">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="mt-4 text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap break-words">
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
        <div className="container max-w-6xl mx-auto mb-8">
          <div className="rounded-xl overflow-hidden shadow-lg select-none">
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full max-h-[600px] object-cover"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          </div>
        </div>
      )}

      {/* YouTube video */}
      {article.youtubeUrl && (
        <div className="container max-w-6xl mx-auto mb-8">
          <YouTubeEmbed url={article.youtubeUrl} />
        </div>
      )}

      {/* Content */}
      <div className="container max-w-6xl mx-auto">
        <div className="prose-article">
          <Streamdown>{article.content}</Streamdown>
        </div>
        
        {/* Newsletter section after content */}
        <div className="mt-16 p-8 md:p-12 bg-primary/5 rounded-3xl border border-primary/10 text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 opacity-5">
            <Mail className="w-48 h-48" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-serif font-bold mb-4">Restez informé de nos publications</h3>
            <p className="text-muted-foreground mb-8">
              Inscrivez-vous à notre newsletter pour recevoir chaque semaine le meilleur de G12 Paris directement dans votre boîte mail.
            </p>
            <Button className="rounded-full px-10 py-7 h-auto text-lg bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
              <Mail className="w-5 h-5 mr-3" />
              S'abonner à la newsletter
            </Button>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="container max-w-6xl mx-auto mt-12">
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
