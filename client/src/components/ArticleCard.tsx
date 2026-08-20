import { Calendar, Play, Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { memo } from "react";
import TiltCard from "@/components/TiltCard";

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

function estimateReadingTime(title: string, excerpt: string | null): string {
  const text = `${title} ${excerpt || ""}`;
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

const ArticleCard = memo(function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="block">
      <TiltCard
        as="article"
        maxTilt={8}
        scale={1.02}
        shine
        className={`group relative rounded-2xl overflow-hidden border border-border/60 hover:border-border hover:shadow-md transition-all duration-300 bg-card touch-manipulation ${
          featured ? "md:col-span-2 md:row-span-2" : ""
        }`}
      >
        {/* Image */}
        <div
          className={`relative overflow-hidden bg-muted ${featured ? "aspect-[21/9] md:aspect-[21/9]" : "aspect-[16/10]"}`}
        >
          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 group-active:scale-105 transition-transform duration-500 select-none"
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
              loading="lazy"
              decoding="async"
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
            <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-lg z-10">
              <Play className="w-4 h-4 text-white fill-white ml-0.5" />
            </div>
          )}

          {/* Category badge (sobre, sans bordure) */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${getCategoryColor(article.category)}`}
            >
              {article.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className={`${featured ? "p-5 md:p-6" : "p-5"}`}>
          <h3
            className={`font-serif font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 ${
              featured ? "text-lg md:text-xl lg:text-2xl" : "text-base"
            }`}
          >
            {article.title}
          </h3>

          {article.excerpt && (
            <p
              className={`mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words ${featured ? "text-sm" : ""}`}
            >
              {article.excerpt}
            </p>
          )}

          {/* Meta with · separators */}
          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.createdAt)}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {estimateReadingTime(article.title, article.excerpt)}
            </span>
            {article.authorName && (
              <>
                <span>·</span>
                <span className="truncate max-w-[100px]">
                  {article.authorName}
                </span>
              </>
            )}
          </div>

          {/* CTA toujours visible */}
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Lire l'article
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
});

export default ArticleCard;
