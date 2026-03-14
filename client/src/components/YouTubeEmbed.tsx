import { useMemo } from "react";

interface YouTubeEmbedProps {
  url: string;
  loop?: boolean;
  className?: string;
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default function YouTubeEmbed({
  url,
  loop = false,
  className = "",
}: YouTubeEmbedProps) {
  const videoId = useMemo(() => extractYouTubeId(url), [url]);

  if (!videoId) return null;

  const baseUrl = `https://www.youtube.com/embed/${videoId}?rel=0`;
  const loopParams = loop ? `&loop=1&playlist=${videoId}` : "";
  const embedUrl = baseUrl + loopParams;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg shadow-md ${className}`}
      style={{ paddingBottom: "56.25%" }}
    >
      <iframe
        className="absolute inset-0 w-full h-full"
        src={embedUrl}
        title="Vidéo YouTube"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  );
}

export { extractYouTubeId };
