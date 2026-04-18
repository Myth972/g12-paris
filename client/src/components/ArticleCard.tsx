import { Badge } from "@/components/ui/badge";
import { Calendar, Play } from "lucide-react";
import { Link } from "wouter";

interface ArticleCardProps {
  article: {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImageUrl: string | null;
    youtubeUrl: string | null;
    category: string;
    createdAt: Date;
    authorName: string | null;
  };
  featured?: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="block">
      <article
        className={`group relative bg-card rounded-xl overflow-hidden border border-border/50 hover:border-border hover:shadow-lg active:shadow-lg active:scale-[0.99] transition-all duration-300 touch-manipulation ${
          featured ? "md:col-span-2 md:row-span-2" : ""
        }`}
      >
        {/* Image */}
        <div
          className={`relative overflow-hidden bg-muted ${featured ? "aspect-[16/9]" : "aspect-[16/10]"}`}
        >
          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-secondary">
              <span className="text-4xl font-serif text-muted-foreground/30">
                G12
              </span>
            </div>
          )}

          {/* YouTube indicator */}
          {article.youtubeUrl && (
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm text-foreground font-medium text-xs shadow-sm"
            >
              {article.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div
          className={`p-4 group-active:max-h-48 group-active:overflow-y-auto group-active:pr-1 ${
            featured ? "p-6" : ""
          }`}
        >
          <h3
            className={`font-serif font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 group-active:line-clamp-none ${
              featured ? "text-xl md:text-2xl" : "text-base"
            }`}
          >
            {article.title}
          </h3>

          {article.excerpt && (
            <p
              className={`mt-2 text-muted-foreground leading-relaxed line-clamp-2 group-active:line-clamp-none ${featured ? "text-sm" : "text-xs"}`}
            >
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.createdAt)}
            </span>
            {article.authorName && (
              <>
                <span className="text-border">|</span>
                <span>{article.authorName}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
