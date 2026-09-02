import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Play,
  Calendar,
  Sparkles,
  Volume2,
  Copy,
  Check,
  Radio,
  ArrowUpRight,
  Clock,
  Flame,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAudioPlayer, DEFAULT_TRACKS } from "@/contexts/AudioPlayerContext";
import { useVisualEnabled } from "@/hooks/useVisualSetting";
import { toast } from "sonner";

interface BentoGridProps {
  className?: string;
}

export default function BentoGrid({ className = "" }: BentoGridProps) {
  const isEnabled = useVisualEnabled("visuals.bentoGrid.enabled");
  const { playTrack } = useAudioPlayer();
  const [copied, setCopied] = useState(false);

  // Données dynamiques depuis tRPC
  const { data: homeContent } = trpc.pageContent.featuredHome.useQuery();
  const { data: latestVerse } = trpc.verses.latest.useQuery();
  const { data: announcementsData } = trpc.announcements.list.useQuery({ type: "announcement" });
  const { data: flashEventsData } = trpc.announcements.list.useQuery({ type: "flash-event" });
  const settingsQuery = trpc.siteSettings.getAll.useQuery();

  // Flagship (Élément à la une : paramètres personnalisés admin ou premier slide)
  const flagship = useMemo(() => {
    const customTitle = settingsQuery.data?.["bento.flagship.title"] as string | undefined;
    const customDesc = settingsQuery.data?.["bento.flagship.description"] as string | undefined;
    const customImage = settingsQuery.data?.["bento.flagship.imageUrl"] as string | undefined;
    const customLink = settingsQuery.data?.["bento.flagship.link"] as string | undefined;
    const customCta = settingsQuery.data?.["bento.flagship.ctaLabel"] as string | undefined;

    const featured = (homeContent ?? []).find((item: any) => item.mediaUrl);
    return {
      title: customTitle || featured?.title || "G12 Paris — Culte en Ligne",
      description:
        customDesc ||
        featured?.description ||
        "Vivez des temps de louange passionnés, d'édification spirituelle et de communion fraternelle.",
      imageUrl: customImage || featured?.mediaUrl || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
      link: customLink || featured?.ctaHref || "/culte-en-ligne",
      ctaLabel: customCta || featured?.ctaLabel || "Participer au culte",
    };
  }, [homeContent, settingsQuery.data]);

  // Tuile 2 : Verset du jour & audio avec fallback inspirant ou personnalisation admin
  const verse = useMemo(() => {
    const customVerseRef = settingsQuery.data?.["bento.verse.reference"] as string | undefined;
    const customVerseText = settingsQuery.data?.["bento.verse.text"] as string | undefined;
    const customAudioTitle = settingsQuery.data?.["bento.verse.audioTitle"] as string | undefined;
    const customAudioUrl = settingsQuery.data?.["bento.verse.audioUrl"] as string | undefined;

    if (customVerseText) {
      return {
        reference: customVerseRef || "Verset du Jour",
        text: customVerseText,
        audioTitle: customAudioTitle || `Verset : ${customVerseRef || "Méditation"}`,
        audioUrl: customAudioUrl || DEFAULT_TRACKS[0].audioUrl,
      };
    }
    if (latestVerse) {
      return {
        reference: customVerseRef || latestVerse.reference,
        text: latestVerse.text,
        audioTitle: customAudioTitle || `Verset : ${customVerseRef || latestVerse.reference}`,
        audioUrl: customAudioUrl || DEFAULT_TRACKS[0].audioUrl,
      };
    }
    return {
      reference: customVerseRef || "Jean 14:27",
      text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s'alarme point.",
      audioTitle: customAudioTitle || "Méditation Quotidienne : La Paix du Cœur",
      audioUrl: customAudioUrl || DEFAULT_TRACKS[0].audioUrl,
    };
  }, [latestVerse, settingsQuery.data]);

  // Tuile 4 : Événement flash ou convention avec personnalisation admin
  const event = useMemo(() => {
    const customBadge = settingsQuery.data?.["bento.event.badge"] as string | undefined;
    const customTitle = settingsQuery.data?.["bento.event.title"] as string | undefined;
    const customDate = settingsQuery.data?.["bento.event.date"] as string | undefined;
    const customImage = settingsQuery.data?.["bento.event.imageUrl"] as string | undefined;
    const customLink = settingsQuery.data?.["bento.event.link"] as string | undefined;

    if (customTitle) {
      return {
        title: customTitle,
        badge: customBadge || "Événement",
        date: customDate || "Prochainement",
        imageUrl: customImage || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
        link: customLink || "/convention-g12-france",
      };
    }

    const flash = flashEventsData?.[0] || announcementsData?.[0];
    if (flash) {
      return {
        title: flash.title,
        badge: customBadge || flash.badge || "Événement",
        date: customDate || flash.eventDate || "Prochainement",
        imageUrl: customImage || flash.mediaUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
        link: customLink || flash.ctaHref || "/convention-g12-france",
      };
    }
    return {
      title: "Convention G12 France 2026",
      badge: customBadge || "Inscriptions ouvertes",
      date: customDate || "Octobre 2026",
      imageUrl: customImage || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
      link: customLink || "/convention-g12-france",
    };
  }, [flashEventsData, announcementsData, settingsQuery.data]);

  // Tuile 3 : Calcul du compte à rebours ou forçage en direct
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isLive: boolean;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isLive: false });

  const radarSettings = useMemo(() => {
    return {
      forceLive: (settingsQuery.data?.["bento.radar.forceLive"] as string | undefined) || "auto",
      day: Number(settingsQuery.data?.["bento.radar.day"] ?? 0),
      hour: Number(settingsQuery.data?.["bento.radar.hour"] ?? 10),
      label: (settingsQuery.data?.["bento.radar.label"] as string | undefined) || "Prochain Direct",
      link: (settingsQuery.data?.["bento.radar.link"] as string | undefined) || "/culte-en-ligne",
    };
  }, [settingsQuery.data]);

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();

      let isLiveNow = false;
      if (radarSettings.forceLive === "true") {
        isLiveNow = true;
      } else if (radarSettings.forceLive === "false") {
        isLiveNow = false;
      } else {
        isLiveNow =
          currentDay === radarSettings.day &&
          currentHour >= radarSettings.hour &&
          currentHour < radarSettings.hour + 3;
      }

      let target = new Date(now);
      if (currentDay === radarSettings.day && currentHour < radarSettings.hour) {
        target.setHours(radarSettings.hour, 0, 0, 0);
      } else {
        const daysUntil = (radarSettings.day - currentDay + 7) % 7 || 7;
        target.setDate(now.getDate() + daysUntil);
        target.setHours(radarSettings.hour, 0, 0, 0);
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isLive: isLiveNow });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [radarSettings]);

  const handleCopyVerse = async () => {
    const textToCopy = `"${verse.text}" — ${verse.reference}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success("Verset copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayVerseAudio = () => {
    playTrack({
      id: "verset-jour",
      title: verse.audioTitle,
      subtitle: `Méditation & Lecture (${verse.reference})`,
      audioUrl: verse.audioUrl,
      coverImageUrl: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=400&q=80",
      duration: 180,
    });
    toast.info("Lecture audio de la méditation démarrée");
  };

  const handleOpenAiQuestion = (question: string) => {
    window.dispatchEvent(new CustomEvent("open-ai-search", { detail: question }));
  };

  if (!isEnabled) {
    return null;
  }

  return (
    <section className={`container py-6 sm:py-8 ${className}`}>
      {/* En-tête de section Bento */}
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-primary rounded-full" />
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-primary font-sans">
            En un coup d'œil
          </span>
        </div>
        <span className="text-xs text-muted-foreground hidden sm:inline-block">
          Actualités, méditations et rendez-vous de la semaine
        </span>
      </div>

      {/* Grille Bento Asymétrique */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 auto-rows-[minmax(180px,auto)]">
        
        {/* TUILE 1 : LE FLAGSHIP (Grand format 2 cols × 2 rows sur Desktop) */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="md:col-span-2 lg:col-span-2 lg:row-span-2 relative rounded-2xl sm:rounded-3xl overflow-hidden group shadow-md hover:shadow-xl border border-border/50 bg-card flex flex-col justify-end min-h-[300px] sm:min-h-[380px]"
        >
          {/* Image de fond avec zoom doux */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{ backgroundImage: `url(${flagship.imageUrl})` }}
          />
          {/* Dégradé immersif pour lisibilité maximale */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

          {/* Badge haut gauche */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md px-3 py-1 font-medium text-xs shadow-sm">
              À la une
            </Badge>
            <span className="text-[11px] font-medium text-white/80 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full">
              Dimanche 10h00
            </span>
          </div>

          {/* Contenu bas */}
          <div className="relative z-10 p-5 sm:p-7 text-white">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif leading-tight mb-2 group-hover:text-primary-foreground/90 transition-colors">
              {flagship.title}
            </h3>
            <p className="text-xs sm:text-sm text-white/80 line-clamp-2 max-w-xl mb-4 leading-relaxed">
              {flagship.description}
            </p>
            <div className="flex items-center gap-3">
              <Button
                asChild
                size="sm"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 h-9 shadow-lg shadow-primary/20 gap-2"
              >
                <Link href={flagship.link}>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {flagship.ctaLabel}
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="rounded-full text-white hover:text-white hover:bg-white/10 text-xs h-9 px-3 gap-1"
              >
                <Link href="/publication-du-jour">
                  Publication du jour
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* TUILE 2 : VERSET & MÉDITATION DU JOUR */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-1 rounded-2xl sm:rounded-3xl p-5 border border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-md shadow-sm hover:shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                Verset du Jour
              </div>
              <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">
                {verse.reference}
              </Badge>
            </div>
            <blockquote className="text-xs sm:text-sm italic text-foreground/90 leading-relaxed font-serif line-clamp-4">
              « {verse.text} »
            </blockquote>
          </div>

          <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 gap-1.5"
              onClick={handleCopyVerse}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copié" : "Copier"}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              className="rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs h-7 px-3 gap-1.5"
              onClick={handlePlayVerseAudio}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Écouter
            </Button>
          </div>
        </motion.div>

        {/* TUILE 3 : RADAR DIRECT & COMPTE À REBOURS */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-1 rounded-2xl sm:rounded-3xl p-5 border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card dark:from-primary/10 dark:to-card backdrop-blur-md shadow-sm hover:shadow-lg flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${timeLeft.isLive ? "text-red-500 animate-pulse" : "text-primary"}`} />
                {timeLeft.isLive ? "En direct maintenant" : "Prochain Direct"}
              </span>
              {timeLeft.isLive && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                </span>
              )}
            </div>

            <div className="my-2">
              {timeLeft.isLive ? (
                <div className="text-center py-2">
                  <p className="text-base font-bold text-red-600 dark:text-red-400">Le culte a commencé !</p>
                  <p className="text-xs text-muted-foreground mt-1">Rejoignez la louange en temps réel</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground block">{timeLeft.days}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">Jours</span>
                  </div>
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground block">{timeLeft.hours}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">Heures</span>
                  </div>
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground block">{timeLeft.minutes}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">Min</span>
                  </div>
                  <div className="bg-background/80 rounded-lg p-1.5 border border-border/40">
                    <span className="text-base sm:text-lg font-bold font-mono text-primary block">{timeLeft.seconds}</span>
                    <span className="text-[9px] uppercase text-muted-foreground">Sec</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button
            asChild
            size="sm"
            className="w-full mt-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-8"
          >
            <Link href={radarSettings.link}>
              {timeLeft.isLive ? "Rejoindre le Direct ▶" : (radarSettings.label || "Accéder à l'espace Culte")}
            </Link>
          </Button>
        </motion.div>

        {/* TUILE 4 : ÉVÉNEMENT FLASH / CONVENTION */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="lg:col-span-1 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/50 bg-card/80 backdrop-blur-md shadow-sm hover:shadow-lg flex items-center gap-3 relative overflow-hidden group"
        >
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-cover bg-center shrink-0 border border-border/40 group-hover:scale-105 transition-transform"
            style={{ backgroundImage: `url(${event.imageUrl})` }}
          />
          <div className="min-w-0 flex-1 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block truncate">
                {event.badge}
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-foreground truncate mt-0.5">
                {event.title}
              </h4>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-primary/70" />
                {event.date}
              </p>
            </div>
            <Link
              href={event.link}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 mt-2"
            >
              En savoir plus
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* TUILE 5 : ASSISTANT IA & RECHERCHE GUIDÉE */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="md:col-span-2 lg:col-span-3 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-border/50 bg-card/80 dark:bg-card/90 backdrop-blur-md shadow-sm hover:shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
                Assistant Spirituel & Recherche Intelligente
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary">
                  IA
                </Badge>
              </h4>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Posez une question sur la foi, un thème biblique ou les activités de l'église
              </p>
            </div>
          </div>

          {/* Suggestions cliquables */}
          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => handleOpenAiQuestion("Comment grandir dans la foi chrétienne ?")}
              className="text-[11px] bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors text-foreground px-2.5 py-1 rounded-full border border-border/40"
            >
              Grandir dans la foi
            </button>
            <button
              onClick={() => handleOpenAiQuestion("Quels sont les horaires des réunions de prière ?")}
              className="text-[11px] bg-muted/60 hover:bg-primary/10 hover:text-primary transition-colors text-foreground px-2.5 py-1 rounded-full border border-border/40"
            >
              Horaires des cultes
            </button>
            <Button
              size="sm"
              className="rounded-full h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground px-3 gap-1"
              onClick={() => handleOpenAiQuestion("")}
            >
              Poser une question
              <Sparkles className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
