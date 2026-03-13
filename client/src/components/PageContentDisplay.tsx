import { trpc } from "@/lib/trpc";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import { Skeleton } from "@/components/ui/skeleton";

interface PageContentDisplayProps {
  pageId: string;
  /** "cards" = clean 2-col caption cards (default), "grid" = dense 3-col grid */
  mode?: "cards" | "grid";
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

export default function PageContentDisplay({ pageId, mode = "cards" }: PageContentDisplayProps) {
  const { data, isLoading } = trpc.pageContent.byPage.useQuery({ pageId });
  const items = data ?? [];

  const cols = mode === "grid"
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    : "grid grid-cols-1 md:grid-cols-2 gap-6";

  if (isLoading) {
    return (
      <div className={cols}>
        {Array.from({ length: mode === "grid" ? 3 : 2 }).map((_, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-border/40">
            <Skeleton className="w-full aspect-video" />
            <div className="py-3 px-4 text-center space-y-2">
              <Skeleton className="h-4 w-40 mx-auto" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cols}>
      {items.map((item: PageContentItem) => (
        <div
          key={item.id}
          className="group rounded-xl overflow-hidden border border-border/40 bg-card hover:shadow-md hover:border-border transition-all duration-300"
        >
          {/* Media */}
          <div className="overflow-hidden">
            {item.contentType === "image" && (
              <img
                src={item.mediaUrl}
                alt={item.title}
                className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            )}
            {item.contentType === "youtube_video" && item.youtubeUrl && (
              <YouTubeEmbed url={item.youtubeUrl} loop={item.loop} />
            )}
            {item.contentType === "mp4_video" && (
              <video
                src={item.mediaUrl}
                controls
                loop={item.loop}
                className="w-full"
              />
            )}
          </div>

          {/* Caption */}
          <div className="py-3 px-4 text-center">
            <p className="text-sm text-primary font-medium italic group-hover:text-primary/80 transition-colors">
              {item.title}
            </p>
            {item.description && (
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
