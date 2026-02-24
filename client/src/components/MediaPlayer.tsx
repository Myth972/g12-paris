import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { AlertCircle, Play } from 'lucide-react';
import { YouTubePlayer } from './YouTubePlayer';

interface MediaPlayerProps {
  url?: string | null;
  type?: 'auto' | 'youtube' | 'mp4';
  title?: string;
  className?: string;
}

/**
 * Composant MediaPlayer - Détecte et affiche:
 * - Vidéos YouTube (liens ou IDs)
 * - Vidéos MP4 (liens directs)
 * - Fallback si pas de contenu
 */
export function MediaPlayer({ 
  url, 
  type = 'auto',
  title = "Média",
  className = ""
}: MediaPlayerProps) {
  if (!url) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Aucun média disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Déterminer le type de média
  let mediaType = type;
  if (type === 'auto') {
    if (url.includes('youtube') || url.includes('youtu.be')) {
      mediaType = 'youtube';
    } else if (url.endsWith('.mp4')) {
      mediaType = 'mp4';
    } else {
      mediaType = 'youtube'; // Par défaut, essayer YouTube
    }
  }

  // Afficher vidéo YouTube
  if (mediaType === 'youtube') {
    return <YouTubePlayer url={url} title={title} className={className} />;
  }

  // Afficher vidéo MP4
  if (mediaType === 'mp4') {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <AspectRatio ratio={16 / 9}>
            <video
              controls
              width="100%"
              height="100%"
              className="w-full h-full object-contain bg-black"
              title={title}
            >
              <source src={url} type="video/mp4" />
              Votre navigateur ne supporte pas la vidéo HTML5.
            </video>
          </AspectRatio>
        </CardContent>
      </Card>
    );
  }

  // Format invalide
  return (
    <Card className={className}>
      <CardContent className="flex items-center justify-center h-80">
        <div className="text-center text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>Format média non supporté</p>
        </div>
      </CardContent>
    </Card>
  );
}
