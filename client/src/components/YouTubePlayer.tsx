import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AlertCircle } from 'lucide-react';

interface YouTubePlayerProps {
  url?: string | null;
  title?: string;
  className?: string;
}

/**
 * Composant réutilisable pour afficher une vidéo YouTube
 * Extrait l'ID de la vidéo et crée un iframe embed
 */
export function YouTubePlayer({ url, title = "Vidéo YouTube", className = "" }: YouTubePlayerProps) {
  if (!url) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucune vidéo disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-destructive">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p>Format vidéo invalide</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <AspectRatio ratio={16 / 9}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </AspectRatio>
      </CardContent>
    </Card>
  );
}

/**
 * Extrait l'ID de vidéo YouTube depuis une URL
 * Supporte les formats:
 * - https://www.youtube.com/watch?v=dQw4w9WgXcQ
 * - https://youtu.be/dQw4w9WgXcQ
 * - https://www.youtube.com/embed/dQw4w9WgXcQ
 */
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // Format: youtube.com/watch?v=...
  let match = url.match(/(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];

  // Format: youtu.be/...
  match = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];

  // Format: youtube.com/embed/...
  match = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (match?.[1]) return match[1];

  return null;
}
