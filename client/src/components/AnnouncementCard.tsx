import { useRef, useEffect } from "react";
import { Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Announcement {
  imageUrl: string;
  title: string;
  description: string;
  date?: string;
  location?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
  variant?: "default" | "compact" | "poster";
  textColor?: string;
  titleColor?: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  className?: string;
}

export default function AnnouncementCard({
  announcement,
  className = "",
}: AnnouncementCardProps) {
  const { imageUrl, title, description, date, location, badge, ctaLabel, ctaHref, variant = "default", textColor, titleColor } = announcement;

  const posterTitleRef = useRef<HTMLHeadingElement>(null);
  const posterDescRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (posterTitleRef.current) {
      const el = posterTitleRef.current;
      if (titleColor) {
        el.style.setProperty("color", titleColor, "important");
      } else {
        el.style.setProperty("color", "white", "important");
      }
    }
    if (!posterDescRef.current) return;
    const el = posterDescRef.current;
    if (textColor) {
      el.style.setProperty("color", textColor, "important");
      el.style.setProperty("text-shadow", "0 0 6px rgba(0,0,0,0.7), 0 0 2px rgba(255,255,255,0.3)", "important");
    } else {
      el.style.color = "rgba(255,255,255,0.8)";
      el.style.textShadow = "";
    }
  }, [textColor, titleColor]);

  const defaultTitleRef = useRef<HTMLHeadingElement>(null);
  const defaultDescRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (defaultTitleRef.current) {
      const el = defaultTitleRef.current;
      if (titleColor) {
        el.style.setProperty("color", titleColor, "important");
      } else {
        el.style.color = "";
      }
    }
    if (!defaultDescRef.current) return;
    const el = defaultDescRef.current;
    if (textColor) {
      el.style.setProperty("color", textColor, "important");
    } else {
      el.style.color = "var(--foreground)";
      el.style.opacity = "0.75";
    }
  }, [textColor, titleColor]);

  if (variant === "poster") {
    return (
      <div className={`relative group rounded-lg overflow-hidden bg-card border border-border/50 shadow-sm hover:shadow-lg transition-all duration-300 ${className}`}>
        <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          {badge && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-black font-bold uppercase tracking-widest text-[8px] shadow-sm px-1.5 py-0.5">
                {badge}
              </Badge>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
            <h3 ref={posterTitleRef} className="text-white text-xs sm:text-sm font-bold font-serif leading-snug drop-shadow">
              {title}
            </h3>
            <p ref={posterDescRef} className="text-[10px] sm:text-[11px] mt-0.5 line-clamp-2 whitespace-pre-line">
              {description}
            </p>
            {ctaLabel && ctaHref && (
              <Button
                asChild
                size="sm"
                className="mt-1.5 bg-white text-black hover:bg-white/90 border-0 rounded-full text-[9px] sm:text-[10px] px-2.5 sm:px-3 h-6 sm:h-7"
              >
                <a href={ctaHref}>{ctaLabel}</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex flex-col sm:flex-row gap-2 p-2 sm:p-3 rounded-lg bg-card border border-border/50 shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300 group ${className}`}>
      {/* Image */}
      <div className="relative w-full sm:w-24 h-28 sm:h-20 rounded-md overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        {badge && (
          <Badge variant="secondary" className="bg-primary/10 text-primary font-bold uppercase tracking-widest text-[7px] mb-1 px-1.5 py-0">
            {badge}
          </Badge>
        )}
        <h3 ref={defaultTitleRef} className="font-serif font-bold text-foreground text-xs sm:text-sm leading-snug">
          {title}
        </h3>
        <p ref={defaultDescRef} className="text-[10px] sm:text-[11px] mt-0.5 line-clamp-2 whitespace-pre-line">
          {description}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[10px] text-foreground/60">
          {date && (
            <span className="flex items-center gap-0.5">
              <Calendar className="w-2.5 h-2.5" />
              {date}
            </span>
          )}
          {location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {location}
            </span>
          )}
        </div>
        {ctaLabel && ctaHref && (
          <Button
            asChild
            variant="link"
            size="sm"
            className="mt-1 h-auto p-0 text-primary text-[10px] font-semibold"
          >
            <a href={ctaHref}>{ctaLabel} &rarr;</a>
          </Button>
        )}
      </div>
    </div>
  );
}
