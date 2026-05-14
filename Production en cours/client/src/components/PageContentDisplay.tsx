import { trpc } from "@/lib/trpc";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { useMotionEnabled } from "@/hooks/useMotionEnabled";
import { useState } from "react";

interface PageContentDisplayProps {
  pageId?: string;
  /** "cards" = clean 2/3-col caption cards (default), "grid" = dense 3/4-col grid */
  mode?: "cards" | "grid";
  /** "split" = first item 1-col centered, others 2-col */
  layout?: "default" | "split";
  /** If true, ignore pageId and fetch all featuredHome content */
  featuredOnly?: boolean;
}

interface PageContentItem {
  id: number;
  contentType: "image" | "youtube_video" | "mp4_video";
  title: string;
  mediaUrl: string;
  youtubeUrl?: string | null;
  description?: string | null;
  loop: boolean;
}

const containerVars = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVars: any = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

function PageContentItemDisplay({ item }: { item: PageContentItem }) {
  const motionEnabled = useMotionEnabled();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      variants={itemVars}
      whileHover={motionEnabled ? { y: -4, scale: 1.01 } : undefined}
      className="group rounded-xl overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md hover:shadow-xl hover:border-primary/10 active:shadow-xl active:border-primary/10 transition-all duration-300 touch-manipulation cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Media */}
      <div className="overflow-hidden relative">
        {item.contentType === "image" && (
          <img
            src={item.mediaUrl}
            alt={item.title}
            className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
          />
        )}
        {item.contentType === "youtube_video" && item.youtubeUrl && (
          <div onClick={(e) => e.stopPropagation()}>
            <YouTubeEmbed url={item.youtubeUrl} />
          </div>
        )}
        {item.contentType === "mp4_video" && (
          <video
            src={item.mediaUrl}
            controls
            loop={item.loop}
            muted
            className="w-full aspect-video object-contain bg-black/5"
            onClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {/* Caption */}
      <div className="py-3 px-4 text-center bg-white/20 backdrop-blur-lg border-t border-border/10">
        <p className={`text-xs sm:text-sm text-primary/80 font-medium tracking-tight ${isExpanded ? "" : "line-clamp-2"}`}>
          {item.title}
        </p>
        {item.description && (
          <p className={`mt-0.5 text-[10px] sm:text-xs text-muted-foreground/80 transition-all ${isExpanded ? "" : "line-clamp-1 group-hover:line-clamp-none"}`}>
            {item.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}

export default function PageContentDisplay({
  pageId,
  mode = "cards",
  layout = "default",
  featuredOnly = false,
}: PageContentDisplayProps) {
  const motionEnabled = useMotionEnabled();
  const byPageQuery = trpc.pageContent.byPage.useQuery(
    { pageId: pageId as string },
    { enabled: !featuredOnly && !!pageId }
  );
  const featuredQuery = trpc.pageContent.featuredHome.useQuery(undefined, {
    enabled: featuredOnly,
  });

  const { data, isLoading } = featuredOnly ? featuredQuery : byPageQuery;
  const items = data ?? [];

  const cols =
    mode === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      : "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto";

  if (isLoading) {
    return (
      <div className={cols}>
        {Array.from({ length: mode === "grid" ? 3 : 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-border/40"
          >
            <Skeleton className="w-full aspect-video" />
            <div className="py-2 px-3 text-center space-y-1">
              <Skeleton className="h-3 w-32 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  if (layout === "split") {
    const firstItem = items[0];
    const restItems = items.slice(1);

    return (
      <motion.div
        variants={containerVars}
        initial={motionEnabled ? "hidden" : "visible"}
        whileInView={motionEnabled ? "visible" : undefined}
        animate={motionEnabled ? undefined : "visible"}
        viewport={motionEnabled ? { once: true, margin: "-100px" } : undefined}
        className="space-y-16"
      >
        {firstItem && (
          <div className="max-w-3xl mx-auto w-full">
            <PageContentItemDisplay item={firstItem} />
          </div>
        )}
        {restItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {restItems.map((item: PageContentItem) => (
              <PageContentItemDisplay key={item.id} item={item} />
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cols}
      variants={containerVars}
      initial={motionEnabled ? "hidden" : "visible"}
      whileInView={motionEnabled ? "visible" : undefined}
      animate={motionEnabled ? undefined : "visible"}
      viewport={motionEnabled ? { once: true, margin: "-100px" } : undefined}
    >
      {items.map((item: PageContentItem) => (
        <PageContentItemDisplay key={item.id} item={item} />
      ))}
    </motion.div>
  );
}
