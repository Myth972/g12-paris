import { useState, useEffect } from "react";
import PageContentDisplay from "@/components/PageContentDisplay";
import { Reveal } from "@/components/Reveal";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Play, Share2, ExternalLink, Check, Calendar, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

function renderWithLineBreaks(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => (
    <span key={`${line}-${idx}`}>
      {line}
      {idx < lines.length - 1 ? <br /> : null}
    </span>
  ));
}


export default function ConventionG12FrancePage() {
  const [, navigate] = useLocation();
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const conventionLogoUrl = (settingsQuery.data?.["convention.logoUrl"] as string) || "https://conventiong12france.com/wp-content/uploads/elementor/thumbs/g12France-rdu8vngvdwatmx6fgxu9wasglsg906xtva9qh3nrls.png";
  const bgUrl = (settingsQuery.data?.["convention.bgUrl"] as string) || "https://conventiong12france.com/wp-content/uploads/2025/10/LHERITAGE-2025-1536x861.png";
  const bgUrlMiddle = (settingsQuery.data?.["convention.bgUrlMiddle"] as string) || "";
  const bgUrlBottom = (settingsQuery.data?.["convention.bgUrlBottom"] as string) || "";
  const primaryColor = settingsQuery.data?.["convention.primaryColor"] as string;
  const showLogoRaw = settingsQuery.data?.["convention.showLogo"] as string | undefined;
  const showOfficialSiteRaw = settingsQuery.data?.["convention.showOfficialSite"] as string | undefined;
  
  // We can reuse some settings if needed, or rely solely on PageContentDisplay
  const liveEnabledRaw = settingsQuery.data?.["convention.liveEnabled"] as string | undefined;
  const liveEnabled = liveEnabledRaw === "true"; // Defaults to false for convention unless set
  const showLogo = showLogoRaw !== "false"; // Defaults to true
  const showOfficialSite = showOfficialSiteRaw !== "false"; // Defaults to true
  const showBilingualCTARaw = settingsQuery.data?.["convention.showBilingualCTA"] as string | undefined;
  const showBilingualCTA = showBilingualCTARaw !== "false"; // Defaults to true
  const youtubeVideoIdRaw = settingsQuery.data?.["convention.youtubeVideoId"] as string | undefined;
  const facebookVideoUrl = settingsQuery.data?.["convention.facebookVideoUrl"] as string | undefined;
  const vimeoVideoUrl = settingsQuery.data?.["convention.vimeoVideoUrl"] as string | undefined;
  const registrationEnabled = settingsQuery.data?.["convention.registrationEnabled"] === "true";
  const mapEnabledRaw = settingsQuery.data?.["convention.mapEnabled"] as string | undefined;
  const mapEnabled = mapEnabledRaw === "true";
  const venueName = (settingsQuery.data?.["convention.venueName"] as string) || "Centre de Conférences";
  const venueQuery = (settingsQuery.data?.["convention.venueQuery"] as string) || "Paris, France";
  const venueAddress = (settingsQuery.data?.["convention.venueAddress"] as string) || "";

  // Réglages avancés des arrière-plans
  const readNumSetting = (key: string, fallback: number) => {
    const raw = settingsQuery.data?.[key] as string | undefined;
    const num = Number(raw);
    return raw !== undefined && Number.isFinite(num) ? num : fallback;
  };
  const clampOpacity = (value: number) => Math.max(0, Math.min(100, value));
  const bgOpacity = clampOpacity(readNumSetting("convention.bgOpacity", 100));
  const bgSize = (settingsQuery.data?.["convention.bgSize"] as string) || "cover";
  const bgPosition = (settingsQuery.data?.["convention.bgPosition"] as string) || "center";
  const bgOpacityMiddle = clampOpacity(readNumSetting("convention.bgOpacityMiddle", 100));
  const bgSizeMiddle = (settingsQuery.data?.["convention.bgSizeMiddle"] as string) || "cover";
  const bgPositionMiddle = (settingsQuery.data?.["convention.bgPositionMiddle"] as string) || "center";
  const bgOpacityBottom = clampOpacity(readNumSetting("convention.bgOpacityBottom", 100));
  const bgSizeBottom = (settingsQuery.data?.["convention.bgSizeBottom"] as string) || "cover";
  const bgPositionBottom = (settingsQuery.data?.["convention.bgPositionBottom"] as string) || "center";
  const overlayStyle = (settingsQuery.data?.["convention.overlayStyle"] as string) || "auto";
  const bgParallax = settingsQuery.data?.["convention.bgParallax"] === "true";

  const overlayClass = (hasBg: boolean) => {
    if (!hasBg) return "";
    switch (overlayStyle) {
      case "light":
        return "bg-white/60 dark:bg-black/60";
      case "dark":
        return "bg-black/60";
      case "gradient":
        return "bg-gradient-to-b from-primary/10 via-background/50 to-background/90";
      case "none":
        return "";
      default:
        return "bg-white/80 dark:bg-black/80";
    }
  };

  const parallaxClass = bgParallax ? "convention-parallax" : "";

  // Textes éditables (mêmes clés que l'ancien inline : pageText.convention-g12.* pageTitle.convention-g12.*)
  const pageText = (key: string, fallback: string) =>
    (settingsQuery.data?.[`pageText.convention-g12.${key}`] as string | undefined) ?? fallback;

  const heroTitle = (settingsQuery.data?.["pageTitle.convention-g12.h1"] as string | undefined) ?? "Bienvenue à la Convention G12 France";
  const heroH2 = (settingsQuery.data?.["pageTitle.convention-g12.h2"] as string | undefined) ?? "";
  const heroText = pageText("hero", "Rejoignez-nous pour cet événement exceptionnel de transformation, d'équipement et de vision. Vivez la puissance de la vision G12 en France.");
  const dateInfo = pageText("date_info", "Prochain événement");
  const locationInfo = pageText("location_info", "En ligne & En présentiel");

  const frTitle = pageText("bilingual_fr_title", "NOUS SOMMES DANS LES TEMPS\nET L'HEURE N'EST PLUS À L'ATTENTE");
  const frBody = pageText("bilingual_fr_body", "Un appel résonne à nouveau. Aller, faire des disciples et voir une génération entière se lever pour Jésus!");
  const frEventName = pageText("bilingual_fr_event_name", "CONVENTION G12 FRANCE 2026");
  const frSubtitle = pageText("bilingual_fr_subtitle", "ALLEZ, FAITES DES DISCIPLES");
  const frDates = pageText("bilingual_fr_dates", "30 & 31 OCTOBRE — 1ER NOVEMBRE");
  const frLocation = pageText("bilingual_fr_location", "PARIS");
  const frCta = pageText("bilingual_fr_cta", "Inscriptions bientôt ouvertes");

  const enTitle = pageText("bilingual_en_title", "WE ARE LIVING IN THE TIMES\nAND THIS IS NO TIME TO WAIT");
  const enBody = pageText("bilingual_en_body", "The call is sounding once again. To go, make disciples, and see an entire generation rise for Jesus!");
  const enEventName = pageText("bilingual_en_event_name", "G12 FRANCE CONVENTION 2026");
  const enSubtitle = pageText("bilingual_en_subtitle", "GO AND MAKE DISCIPLES");
  const enDates = pageText("bilingual_en_dates", "OCTOBER 30 & 31 — NOVEMBER 1");
  const enLocation = pageText("bilingual_en_location", "PARIS");
  const enCta = pageText("bilingual_en_cta", "Registration Opens Soon");

  useEffect(() => {
    if (settingsQuery.data && registrationEnabled) {
      navigate("/inscription-convention");
    }
  }, [settingsQuery.data, registrationEnabled, navigate]);

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

  // Extract Vimeo video ID from full URL if needed
  const extractVimeoId = (input: string | undefined): string | null => {
    if (!input) return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    // Already an ID (numeric)
    if (/^\d+$/.test(trimmed)) return trimmed;
    // Try to extract from various Vimeo URL formats
    const patterns = [
      /vimeo\.com\/video\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
      /vimeo\.com\/channels\/[^/]+\/(\d+)/,
      /vimeo\.com\/groups\/[^/]+\/videos\/(\d+)/,
      /vimeo\.com\/showcase\/[^/]+\/video\/(\d+)/,
      /vimeo\.com\/(\d+)/,
    ];
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match && match[1]) return match[1];
    }
    return null;
  };

  const vimeoVideoId = extractVimeoId(vimeoVideoUrl);

  const [copied, setCopied] = useState(false);
  const [iframeErrored, setIframeErrored] = useState(false);

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
    <div className="min-h-screen bg-background">
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
      >
        {bgUrl && (
          <div
            className={`absolute inset-0 bg-center bg-cover ${parallaxClass}`}
            style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: bgSize, backgroundPosition: bgPosition, opacity: bgOpacity / 100 }}
          />
        )}
        {!bgUrl && <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none" />}
        <div className={`absolute inset-0 ${overlayClass(!!bgUrl)} pointer-events-none`} />
        
        <div className="container relative z-10 px-4 sm:px-0">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4 -ml-4 text-muted-foreground">
              <Link href="/culte-en-ligne">← Retour au Culte en ligne</Link>
            </Button>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
            {showLogo && (
              <img 
                src={conventionLogoUrl} 
                alt="Convention G12 France" 
                className="w-full max-w-[280px] sm:max-w-[350px] mb-8 animate-in fade-in zoom-in duration-700"
              />
            )}

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

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif text-foreground leading-tight mb-4">
              {renderWithLineBreaks(heroTitle)}
            </h1>
            {heroH2?.trim() ? (
              <h2 className="text-xl sm:text-2xl font-serif text-foreground/90">{renderWithLineBreaks(heroH2)}</h2>
            ) : null}

            <p className="mt-4 text-foreground/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap break-words">
              {heroText}
            </p>

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border">
                <Calendar className="w-4 h-4 convention-primary-text text-primary" />
                {dateInfo}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white dark:bg-card px-4 py-2 rounded-full shadow-sm border">
                <MapPin className="w-4 h-4 convention-primary-text text-primary" />
                {locationInfo}
              </div>
            </div>
          </div>
        </div>
      </section>
      </Reveal>

      {/* Video Section */}
      {(youtubeVideoId || vimeoVideoId || facebookVideoUrl || liveEnabled) && (
        <Reveal variant="fadeUp" delay={0.1}>
        <section 
          className="container pb-8 px-4 sm:px-0 mt-8 relative"
        >
          {bgUrlMiddle && (
            <div
              className={`absolute inset-0 bg-cover bg-center rounded-xl ${parallaxClass}`}
              style={{ backgroundImage: `url(${bgUrlMiddle})`, backgroundSize: bgSizeMiddle, backgroundPosition: bgPositionMiddle, opacity: bgOpacityMiddle / 100 }}
            />
          )}
          {bgUrlMiddle && <div className={`absolute inset-0 ${overlayClass(true)} pointer-events-none`} />}
          <div className="max-w-4xl mx-auto relative z-10">
            {/* YouTube */}
            {youtubeVideoId && (
              <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}${liveEnabled ? "?autoplay=1&live=1" : ""}`}
                  title="Convention G12 France en direct"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* Vimeo (seulement si pas de YouTube) */}
            {!youtubeVideoId && vimeoVideoId && !iframeErrored && (
              <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5">
                <iframe
                  src={`https://player.vimeo.com/video/${vimeoVideoId}${liveEnabled ? "?autoplay=1&byline=0&title=0&portrait=0" : ""}`}
                  title="Convention G12 France en direct - Vimeo"
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  onError={() => setIframeErrored(true)}
                />
              </div>
            )}

            {/* Fallback Vimeo si l'iframe échoue */}
            {!youtubeVideoId && vimeoVideoId && iframeErrored && (
              <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-black">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                  <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 ring-4 ring-white/20">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif mb-2">Vidéo Vimeo</h3>
                  <p className="text-sm sm:text-base text-white/80 mb-6 max-w-md">La vidéo est disponible sur Vimeo.</p>
                  <Button asChild size="lg" className="bg-card text-card-foreground hover:bg-card/90 font-semibold gap-2 shadow-lg">
                    <a href={`https://vimeo.com/${vimeoVideoId}`} target="_blank" rel="noopener noreferrer">
                      <Play className="w-5 h-5 fill-current" />
                      Regarder sur Vimeo
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Facebook (seulement si pas de YouTube ni Vimeo) */}
            {!youtubeVideoId && !vimeoVideoId && facebookVideoUrl && !iframeErrored && (
              <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5 bg-black">
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(facebookVideoUrl)}&show_text=false&width=560&t=0`}
                    title="Convention G12 France - Vidéo Facebook"
                    className="absolute inset-0 w-full h-full"
                    style={{ border: "none", overflow: "hidden" }}
                    scrolling="no"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                    onError={() => setIframeErrored(true)}
                  />
                </div>
              </div>
            )}

            {/* Fallback Facebook si l'iframe échoue */}
            {!youtubeVideoId && !vimeoVideoId && facebookVideoUrl && iframeErrored && (
              <div className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900">
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                  <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-5 ring-4 ring-white/20">
                    <Play className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif mb-2">Vidéo Facebook</h3>
                  <p className="text-sm sm:text-base text-white/80 mb-6 max-w-md">La vidéo est disponible sur Facebook.</p>
                  <Button asChild size="lg" className="bg-card text-card-foreground hover:bg-card/90 font-semibold gap-2 shadow-lg">
                    <a href={facebookVideoUrl} target="_blank" rel="noopener noreferrer">
                      <Play className="w-5 h-5 fill-current" />
                      Regarder sur Facebook
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            {/* Placeholder live sans source */}
            {!youtubeVideoId && !vimeoVideoId && !facebookVideoUrl && liveEnabled && (
              <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 dark:border-white/5">
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

            {/* Share + External links */}
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
              {!youtubeVideoId && vimeoVideoId && (
                <Button asChild variant="ghost">
                  <a href={`https://vimeo.com/${vimeoVideoId}`} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir sur Vimeo
                  </a>
                </Button>
              )}
              {!youtubeVideoId && !vimeoVideoId && facebookVideoUrl && (
                <Button asChild variant="ghost">
                  <a href={facebookVideoUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir sur Facebook
                  </a>
                </Button>
              )}
              {showOfficialSite && (
                <Button asChild variant="default" className="gap-2 convention-primary-bg bg-primary hover:bg-primary/90 text-white border-0">
                  <a href="https://conventiong12france.com/" target="_blank" rel="noopener noreferrer">
                    Visiter le site officiel
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
        </Reveal>
      )}

      {/* Map / Localisation */}
      {mapEnabled && (
        <Reveal variant="fadeUp" delay={0.1}>
        <section className="container py-10 px-4 sm:px-0">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">Où se déroule la Convention</h2>
              <p className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" />
                {venueName}
                {venueAddress && <span className="hidden sm:inline"> — {venueAddress}</span>}
              </p>
            </div>
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border-4 border-white/10 dark:border-white/5 aspect-[16/9] min-h-[300px]">
              <iframe
                title={`Carte - ${venueName}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(venueQuery)}&output=embed`}
                className="absolute inset-0 w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="flex justify-center mt-5">
              <Button asChild variant="outline" className="gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ouvrir dans Google Maps
                </a>
              </Button>
            </div>
          </div>
        </section>
        </Reveal>
      )}

      {/* Bottom Zone: Bilingual + Content */}
      <div 
        className="relative"
      >
        {bgUrlBottom && (
          <div
            className={`absolute inset-0 bg-cover bg-center ${parallaxClass}`}
            style={{ backgroundImage: `url(${bgUrlBottom})`, backgroundSize: bgSizeBottom, backgroundPosition: bgPositionBottom, opacity: bgOpacityBottom / 100 }}
          />
        )}
        {bgUrlBottom && <div className={`absolute inset-0 ${overlayClass(true)} pointer-events-none`} />}
        <div className="relative z-10">
          {/* Bilingual Call to Action */}
          {showBilingualCTA && (
          <Reveal variant="fadeUp" delay={0.12}>
          <section className="container py-12 px-4 sm:px-0">
            <div className="max-w-4xl mx-auto text-center space-y-10">
              {/* French */}
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight whitespace-pre-wrap">
                  {renderWithLineBreaks(frTitle)}
                </h3>
                <p className="text-foreground/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap break-words">
                  {frBody}
                </p>
                <div className="pt-2 space-y-1">
                  <p className="text-lg sm:text-xl font-bold font-serif convention-primary-text">
                    {frEventName}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-foreground/90">
                    {frSubtitle}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {frDates}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {frLocation}
                  </p>
                  <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground mt-2">
                    {frCta}
                  </p>
                </div>
              </div>

              <div className="w-16 h-px bg-border mx-auto" />

              {/* English */}
              <div className="space-y-3">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight whitespace-pre-wrap">
                  {renderWithLineBreaks(enTitle)}
                </h3>
                <p className="text-foreground/80 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto whitespace-pre-wrap break-words">
                  {enBody}
                </p>
                <div className="pt-2 space-y-1">
                  <p className="text-lg sm:text-xl font-bold font-serif convention-primary-text">
                    {enEventName}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-foreground/90">
                    {enSubtitle}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {enDates}
                  </p>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {enLocation}
                  </p>
                  <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-muted-foreground mt-2">
                    {enCta}
                  </p>
                </div>
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
      </div>
    </div>
  );
}
