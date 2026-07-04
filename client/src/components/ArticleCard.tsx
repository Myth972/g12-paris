import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    "actualité": "bg-blue-500/90 backdrop-blur-sm",
    "culte": "bg-purple-500/90 backdrop-blur-sm",
    "enseignement": "bg-emerald-500/90 backdrop-blur-sm",
    "témoignage": "bg-amber-500/90 backdrop-blur-sm",
    "musique": "bg-rose-500/90 backdrop-blur-sm",
    "prière": "bg-indigo-500/90 backdrop-blur-sm",
    "événement": "bg-orange-500/90 backdrop-blur-sm",
    "annonce": "bg-teal-500/90 backdrop-blur-sm",
  };
  return colors[category.toLowerCase()] || "bg-primary/90 backdrop-blur-sm";
}

const ArticleCard = memo(function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  return (
    <Link href={`/article/${article.slug}`} className="block">
      <TiltCard
        as="article"
        maxTilt={10}
        scale={1.03}
        shine={true}
        className={`group relative rounded-xl overflow-hidden border border-border/50 hover:border-border hover:shadow-xl active:shadow-lg active:scale-[0.99] transition-all duration-300 touch-manipulation bg-card ${
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

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

          {/* YouTube indicator */}
          {article.youtubeUrl && (
            <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg z-10">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant="secondary"
              className={`text-white font-bold uppercase tracking-widest text-[9px] shadow-sm border-0 ${getCategoryColor(article.category)}`}
            >
              {article.category}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className={`relative ${featured ? "p-5 md:p-6" : "p-4"}`}>
          <h3
            className={`font-serif font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 ${
              featured ? "text-lg md:text-xl lg:text-2xl" : "text-sm md:text-base"
            }`}
          >
            {article.title}
          </h3>

          {article.excerpt && (
            <p
              className={`mt-1.5 text-muted-foreground leading-relaxed line-clamp-2 break-words ${featured ? "text-xs md:text-sm" : "text-xs"}`}
            >
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(article.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {estimateReadingTime(article.title, article.excerpt)}
            </span>
            {article.authorName && (
              <>
                <span className="text-border/50">|</span>
                <span className="truncate max-w-[100px]">{article.authorName}</span>
              </>
            )}
          </div>

          {/* CTA hover */}
          <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-primary text-xs font-semibold gap-1 hover:bg-transparent hover:text-primary/80"
            >
              Lire l'article
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </TiltCard>
    </Link>
  );
});

export default ArticleCard;
