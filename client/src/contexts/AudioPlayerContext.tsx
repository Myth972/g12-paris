import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  audioUrl: string;
  coverImageUrl?: string;
  duration?: number;
}

export const DEFAULT_TRACKS: AudioTrack[] = [
  {
    id: "meditation-paix",
    title: "Méditation Quotidienne : La Paix du Cœur",
    subtitle: "Pasteur G12 Paris · Épisode 12",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    coverImageUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&q=80",
    duration: 372,
  },
  {
    id: "culte-foi",
    title: "Message du Dimanche : La Puissance de la Prière",
    subtitle: "Culte Principal · G12 Paris",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    coverImageUrl: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=400&q=80",
    duration: 423,
  },
  {
    id: "louange-adoration",
    title: "Moment d'Adoration : Cœur Adorateur",
    subtitle: "Équipe de Louange G12",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    coverImageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80",
    duration: 345,
  },
];

interface AudioPlayerContextType {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  playTrack: (track: AudioTrack) => void;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setPlaybackRate: (rate: number) => void;
  skip: (seconds: number) => void;
  closePlayer: () => void;
  toggleMinimize: () => void;
  openWithTrackList: (track?: AudioTrack) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialisation de l'instance Audio unique et persistante
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoading(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, []);

  const playTrack = useCallback((track: AudioTrack) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (currentTrack?.id === track.id) {
      if (audio.paused) {
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
      setIsOpen(true);
      return;
    }

    setCurrentTrack(track);
    setIsOpen(true);
    setIsLoading(true);
    setCurrentTime(0);

    audio.src = track.audioUrl;
    audio.playbackRate = playbackRate;
    audio.volume = volume;

    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      })
      .catch(err => {
        console.warn("Autoplay restreint ou erreur audio :", err);
        setIsLoading(false);
      });
  }, [currentTrack, playbackRate, volume]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;

    if (!currentTrack) {
      playTrack(DEFAULT_TRACKS[0]);
      return;
    }

    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [currentTrack, playTrack]);

  const seek = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const clamped = Math.max(0, Math.min(audio.duration || duration, seconds));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const skip = useCallback((deltaSeconds: number) => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    const newTime = Math.max(0, Math.min(audio.duration || duration, audio.currentTime + deltaSeconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  const openWithTrackList = useCallback((track?: AudioTrack) => {
    const selected = track || currentTrack || DEFAULT_TRACKS[0];
    playTrack(selected);
  }, [currentTrack, playTrack]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        isOpen,
        isMinimized,
        isLoading,
        playTrack,
        togglePlay,
        seek,
        setVolume,
        setPlaybackRate,
        skip,
        closePlayer,
        toggleMinimize,
        openWithTrackList,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer doit être utilisé dans un AudioPlayerProvider");
  }
  return context;
}
