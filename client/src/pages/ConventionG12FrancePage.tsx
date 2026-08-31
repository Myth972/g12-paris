import { useState } from "react";
import PageContentDisplay from "@/components/PageContentDisplay";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { Reveal } from "@/components/Reveal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Play, Share2, ExternalLink, Check, Calendar, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function ConventionG12FrancePage() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  
  const conventionLogoUrl = (settingsQuery.data?.["convention.logoUrl"] as string) || "https://conventiong12france.com/wp-content/uploads/elementor/thumbs/g12France-rdu8vngvdwatmx6fgxu9wasglsg906xtva9qh3nrls.png";
  const bgUrl = (settingsQuery.data?.["convention.bgUrl"] as string) || "https://conventiong12france.com/wp-content/uploads/2025/10/LHERITAGE-2025-1536x861.png";
  const primaryColor = settingsQuery.data?.["convention.primaryColor"] as string;
  
  // We can reuse some settings if needed, or rely solely on PageContentDisplay
  const liveEnabledRaw = settingsQuery.data?.conventionLiveEnabled as string | undefined;
  const liveEnabled = liveEnabledRaw === "true"; // Defaults to false for convention unless set
  const youtubeVideoIdRaw = settingsQuery.data?.conventionYoutubeVideoId as string | undefined;
  const facebookVideoUrl = settingsQuery.data?.conventionFacebookVideoUrl as string | undefined;
  // Optional raw iframe code (e.g. generated from Facebook's embed configurator)
  const facebookEmbedCode = settingsQuery.data?.conventionFacebookEmbedCode as string | undefined;

  // Extract YouTube video ID from full URL if needed
  const extractYouTubeId = (input: string | undefined): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Already an ID (11 chars, alphanumeric + dash + underscore)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    // Try to extract from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const youtubeVideoId = extractYouTubeId(youtubeVideoIdRaw);

  const [copied, setCopied] = useState(false);
  const [iframeErrored, setIframeErrored] = useState(false);

  // If a custom embed code is provided, use it; otherwise build the standard embed URL.
  // This works for share URLs (https://www.facebook.com/share/v/...), Reels, and videos.
  const buildFacebookEmbedSrc = (rawUrl: string): string => {
    const params = new URLSearchParams({
      href: rawUrl,
      width: "560",
      height: "315",
      show_text: "true",
      t: "0",
    });
    if (liveEnabled) params.set("autoplay", "1");
    return `https://www.facebook.com/plugins/video.php?${params.toString()}`;
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Convention G12 France",
          text: "Participez à la Convention G12 France avec nous !",
          url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {primaryColor && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .convention-primary-bg { background-color: ${primaryColor} !important; }
            .convention-primary-text { color: ${primaryColor} !important; }
            .convention-primary-border { border-color: ${primaryColor} !important; }
            .convention-gradient { background: linear-gradient(135deg, ${primaryColor} 0%, #1e3a8a 100%) !important; }
          `
        }} />
      )}
      
      {/* Hero section */}
      <Reveal variant="fadeDown" duration={0.7}>
      <section 
        className="relative py-8 sm:py-12 md:py-16 overflow-hidden"
        style={bgUrl ? { 
          backgroundImage: `url(${bgUrl})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center' 
        } : {}}
      >
        {!bgUrl && <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 via-background to-background pointer-events-none" />}
        <div className={`absolute inset-0 ${bgUrl ? 'bg-white/80 dark:bg-black/80' : 'bg-gradient-to-br from-blue-100/50 to-red-100/30 dark:from-blue-900/20 dark:to-red-900/10'} pointer-events-none`} />
        
        <div className="container relative z-10 px-4 sm:px-0">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
              <Link href="/culte-en-ligne">← Retour au Culte en ligne</Link>
            </Button>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            <img 
              src={conventionLogoUrl} 
              alt="Convention G12 France" 
              className="w-full max-w-[280px] sm:max-w-[350px] mb-8 animate-in fade-in zoom-in duration-700"
            />

            {/* Live Badge */}
            {liveEnabled && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 bg-red-600 text-white shadow-md animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                En direct maintenant
              </div>
            )}

            <PageTitleEditor
              pageKey="convention-g12"
              defaultH1={"Bienvenue à la Convention G12 France"}
              defaultH2=""
              h1ClassName="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-foreground leading-tight mb-4"
            />
            
            <PageTextEditor
              pageKey="convention-g12"
              textKey="hero"
              defaultText="Rejoignez-nous pour cet événement exceptionnel de transformation, d'équipement et de vision. Vivez la puissance de la vision G12 en France."
              className="mt-4 text-foreground/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            />

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border">
                <Calendar className="w-4 h-4 convention-primary-text text-primary" />
                <PageTextEditor
                  pageKey="convention-g12"
                  textKey="date_info"
                  defaultText="Prochain événement"
                  className="inline-block"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border">
                <MapPin className="w-4 h-4 convention-primary-text text-primary" />
                <PageTextEditor
                  pageKey="convention-g12"
                  textKey="location_info"
                  defaultText="En ligne & En présentiel"
                  className="inline-block"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* Video Section */}
      {(youtubeVideoId || facebookVideoUrl || liveEnabled) && (
        <Reveal variant="fadeUp" delay={0.1}>
        <section className="container pb-8 px-4 sm:px-0 mt-8">
          <div className="max-w-4xl mx-auto">
            {/* Video Player(s) */}
            {youtubeVideoId && (
              <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5 mb-6">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}${liveEnabled ? "?autoplay=1&live=1" : ""}`}
                  title="Convention G12 France en direct"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {!youtubeVideoId && liveEnabled && (
              <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5 mb-6">
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                    <p className="text-muted-foreground">La session va bientôt commencer...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Facebook Video Player */}
            {(facebookEmbedCode || facebookVideoUrl) && (
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5 bg-black">
                {facebookEmbedCode ? (
                  // Custom iframe code pasted from Facebook's embed configurator
                  <div
                    className="flex justify-center"
                    dangerouslySetInnerHTML={{ __html: facebookEmbedCode }}
                  />
                ) : facebookVideoUrl && !iframeErrored ? (
                  <div className="relative w-full" style={{ paddingTop: "calc(430 / 560 * 100%)" }}>
                    <iframe
                      src={buildFacebookEmbedSrc(facebookVideoUrl)}
                      title="Convention G12 France - Vidéo Facebook"
                      className="absolute inset-0 w-full h-full"
                      style={{ border: "none", overflow: "hidden" }}
                      scrolling="no"
                      frameBorder="0"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen={true}
                      onError={() => setIframeErrored(true)}
                    />
                  </div>
                ) : (
                  // Fallback card if the iframe failed to load
                  <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                      <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 ring-4 ring-white/20">
                        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold font-serif mb-2">
                        {liveEnabled ? "Live Facebook" : "Vidéo Facebook"}
                      </h3>
                      <p className="text-sm sm:text-base text-white/80 mb-6 max-w-md">
                        {liveEnabled
                          ? "Le direct Facebook est disponible. Cliquez ci-dessous pour le suivre."
                          : "La vidéo Facebook est disponible. Cliquez ci-dessous pour la regarder."}
                      </p>
                      <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-white/90 font-semibold gap-2 shadow-lg">
                        <a href={facebookVideoUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="w-5 h-5 fill-current" />
                          {liveEnabled ? "Regarder le live" : "Regarder sur Facebook"}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Share Button */}
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <Button onClick={handleShare} className="gap-2" variant="outline">
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Lien copié !" : "Partager l'événement"}
              </Button>
              {youtubeVideoId && (
                <Button asChild variant="ghost">
                  <a href={`https://youtube.com/watch?v=${youtubeVideoId}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir sur YouTube
                  </a>
                </Button>
              )}
              {facebookVideoUrl && (
                <Button asChild variant="ghost">
                  <a href={facebookVideoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir sur Facebook
                  </a>
                </Button>
              )}
              <Button asChild variant="default" className="gap-2 convention-primary-bg bg-blue-700 hover:opacity-90 text-white border-0">
                <a href="https://conventiong12france.com/" target="_blank" rel="noopener noreferrer">
                  Visiter le site officiel
                  <ExternalLink className="w-4 h-4" />
                </a>
              </Button>
            </div>
          </div>
        </section>
        </Reveal>
      )}

      {/* Content section */}
      <Reveal variant="fadeUp" delay={0.15}>
      <section className="container pb-12 sm:pb-16 pt-8 px-4 sm:px-0">
        <PageContentDisplay pageId="convention-g12" layout="split" />
      </section>
      </Reveal>
    </div>
  );
}
