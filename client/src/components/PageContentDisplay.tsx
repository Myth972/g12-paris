import { trpc } from "@/lib/trpc";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

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
  return (
    <motion.div
      variants={itemVars}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group rounded-xl overflow-hidden border border-border/30 bg-card/60 backdrop-blur-sm hover:shadow-xl hover:border-primary/10 transition-all duration-300"
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
          <YouTubeEmbed url={item.youtubeUrl} />
        )}
        {item.contentType === "mp4_video" && (
          <video
            src={item.mediaUrl}
            controls
            loop={item.loop}
            muted
            className="w-full aspect-video object-contain bg-black/5"
          />
        )}
      </div>

      {/* Caption */}
      <div className="py-2 px-3 text-center bg-white/30 backdrop-blur-md">
        <p className="text-xs sm:text-sm text-primary/80 font-medium tracking-tight">
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground/80 line-clamp-1 group-hover:line-clamp-none transition-all">
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
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
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
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      {items.map((item: PageContentItem) => (
        <PageContentItemDisplay key={item.id} item={item} />
      ))}
    </motion.div>
  );
}
