import { useAudioPlayer, DEFAULT_TRACKS } from "@/contexts/AudioPlayerContext";
import { useVisualEnabled } from "@/hooks/useVisualSetting";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  X,
  ChevronDown,
  ChevronUp,
  Music,
  ListMusic,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FloatingAudioPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    isOpen,
    isMinimized,
    isLoading,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    skip,
    closePlayer,
    toggleMinimize,
    playTrack,
  } = useAudioPlayer();

  const isEnabled = useVisualEnabled("visuals.audioPlayer.enabled");
  const [showVolume, setShowVolume] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Vitesse de lecture suivante
  const handleCycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const currentIndex = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackRate(nextSpeed);
  };

  const activeDuration = duration || currentTrack?.duration || 0;
  const progressPercent = activeDuration > 0 ? (currentTime / activeDuration) * 100 : 0;

  if (!isEnabled || !isOpen || !currentTrack) {
    return null;
  }

  // --- MODE RÉDUIT (Pill flottante en bas à droite) ---
  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-3 bg-card/90 dark:bg-card/95 backdrop-blur-xl border border-primary/20 shadow-2xl rounded-full pl-2 pr-3 py-1.5 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={toggleMinimize}
      >
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-primary/30">
          {currentTrack.coverImageUrl ? (
            <img
              src={currentTrack.coverImageUrl}
              alt=""
              className={`w-full h-full object-cover ${isPlaying ? "animate-spin-slow" : ""}`}
            />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <Music className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>

        <div className="flex flex-col max-w-[130px] sm:max-w-[180px]">
          <span className="text-xs font-semibold truncate text-foreground">
            {currentTrack.title}
          </span>
          <span className="text-[10px] text-muted-foreground truncate">
            {formatTime(currentTime)} / {formatTime(activeDuration)}
          </span>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="w-7 h-7 rounded-full text-primary hover:bg-primary/10"
          onClick={e => {
            e.stopPropagation();
            togglePlay();
          }}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="w-6 h-6 rounded-full text-muted-foreground hover:text-foreground"
          onClick={e => {
            e.stopPropagation();
            toggleMinimize();
          }}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </Button>
      </motion.div>
    );
  }

  // --- MODE COMPLET DOCKÉ EN BAS ---
  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Lecteur audio flottant"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 dark:bg-card/98 backdrop-blur-xl border-t border-border/50 shadow-[0_-8px_32px_rgba(0,0,0,0.15)] pb-[env(safe-area-inset-bottom)]"
      >
        {/* Barre de progression fine au sommet du player */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-muted/40 cursor-pointer group"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            seek(pos * activeDuration);
          }}
        >
          <div
            className="h-full bg-primary transition-all group-hover:h-1.5"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="container mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-2.5 md:gap-6">
          
          {/* 1. Track Info & Waveform */}
          <div className="flex items-center gap-3 w-full md:w-1/3 min-w-0 justify-between md:justify-start">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 shadow-md border border-border/50">
                {currentTrack.coverImageUrl ? (
                  <img
                    src={currentTrack.coverImageUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-4">
                      <span className="w-0.5 bg-white animate-pulse h-2" />
                      <span className="w-0.5 bg-white animate-pulse h-4 delay-75" />
                      <span className="w-0.5 bg-white animate-pulse h-3 delay-150" />
                    </div>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex flex-col">
                <h4 className="text-xs sm:text-sm font-semibold truncate text-foreground leading-snug">
                  {currentTrack.title}
                </h4>
                {currentTrack.subtitle && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {currentTrack.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Bouton Playlist/Sélection rapide */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowPlaylist(prev => !prev)}
                title="Autres méditations & messages"
              >
                <ListMusic className="w-4 h-4" />
              </Button>

              {/* Menu déroulant Playlist */}
              {showPlaylist && (
                <div className="absolute bottom-12 left-0 w-64 bg-popover/95 backdrop-blur-xl border border-border/70 rounded-xl shadow-2xl p-2 z-50">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1">
                    Méditations & Prédications
                  </div>
                  <div className="space-y-1 mt-1 max-h-48 overflow-y-auto">
                    {DEFAULT_TRACKS.map(track => (
                      <button
                        key={track.id}
                        onClick={() => {
                          playTrack(track);
                          setShowPlaylist(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs flex items-center gap-2 transition-colors ${
                          currentTrack.id === track.id
                            ? "bg-primary/15 text-primary font-medium"
                            : "hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <Music className="w-3.5 h-3.5 shrink-0 text-primary" />
                        <span className="truncate">{track.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Centre : Contrôles & Scrubber */}
          <div className="flex flex-col items-center gap-1 w-full md:w-2/5">
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Recul 15s */}
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => skip(-15)}
                title="Reculer de 15s"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>

              {/* Play / Pause Principal */}
              <Button
                size="icon"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95"
                onClick={togglePlay}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </Button>

              {/* Avance 15s */}
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => skip(15)}
                title="Avancer de 15s"
              >
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Button>

              {/* Vitesse de lecture */}
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] sm:text-xs font-semibold px-2 h-7 rounded-md text-muted-foreground hover:text-foreground"
                onClick={handleCycleSpeed}
                title="Vitesse de lecture"
              >
                {playbackRate}x
              </Button>
            </div>

            {/* Slider de scrub avec timer */}
            <div className="w-full flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground font-mono">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  max={activeDuration || 100}
                  step={1}
                  onValueChange={vals => seek(vals[0])}
                  className="cursor-pointer"
                />
              </div>
              <span className="w-10">{formatTime(activeDuration)}</span>
            </div>
          </div>

          {/* 3. Droite : Volume & Actions de fermeture */}
          <div className="flex items-center justify-end gap-2 w-full md:w-1/3">
            {/* Volume */}
            <div
              className="relative hidden sm:flex items-center gap-1.5"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setVolume(volume > 0 ? 0 : 0.85)}
              >
                {volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-destructive" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>

              <div className={`w-20 transition-all ${showVolume ? "opacity-100" : "opacity-70"}`}>
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={vals => setVolume(vals[0] / 100)}
                />
              </div>
            </div>

            {/* Réduire */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={toggleMinimize}
              title="Minimiser le lecteur"
            >
              <ChevronDown className="w-4 h-4" />
            </Button>

            {/* Fermer */}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive transition-colors"
              onClick={closePlayer}
              title="Fermer le lecteur"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
