import { useState } from "react";
import PageContentDisplay from "@/components/PageContentDisplay";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Play, Share2, ExternalLink, Copy, Check } from "lucide-react";

export default function CulteEnLignePage() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const heroBgUrl = settingsQuery.data?.culteHeroBgUrl as string | undefined;
  const heroOpacityRaw = settingsQuery.data?.culteHeroBgOpacity as string | undefined;
  const heroOpacityPercent = Math.max(0, Math.min(60, Number(heroOpacityRaw ?? 18)));
  const heroOpacity = heroOpacityPercent / 100;
  const liveEnabledRaw = settingsQuery.data?.culteLiveEnabled as string | undefined;
  const liveEnabled = liveEnabledRaw !== "false";
  const youtubeVideoId = settingsQuery.data?.culteYoutubeVideoId as string | undefined;

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "G12 Paris - Culte en ligne",
          text: "Participez au culte en ligne avec nous !",
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
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative bg-gradient-to-b from-primary/[0.03] to-transparent py-8 sm:py-12 md:py-16 overflow-hidden">
        {heroBgUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{ backgroundImage: `url(${heroBgUrl})`, opacity: heroOpacity }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-transparent pointer-events-none" />
        <div className="container relative z-10 px-4 sm:px-0">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="w-6 sm:w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Culte en ligne
              </span>
            </div>
            {/* Live Badge */}
            <div
              className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-4 duration-1000 ${
                liveEnabled ? "bg-white text-red-600 border border-red-200 shadow-sm" : "bg-black text-white border border-black/80 shadow-sm"
              }`}
            >
              <span className="relative flex h-2 w-2">
                {liveEnabled && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${liveEnabled ? "bg-red-600" : "bg-white"}`} />
              </span>
              {liveEnabled ? "En direct" : "Hors ligne"}
            </div>

            <PageTitleEditor
              pageKey="culte-en-ligne"
              defaultH1={"Culte en ligne\nAdorez depuis chez vous"}
              defaultH2=""
              h1ClassName="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight"
            />
            <PageTextEditor
              pageKey="culte-en-ligne"
              textKey="hero"
              defaultText="Participez à nos services de culte en ligne et vivez une expérience spirituelle depuis n'importe où."
              className="mt-2 sm:mt-4 text-muted-foreground text-sm sm:text-base leading-relaxed max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Video Section */}
      {(youtubeVideoId || liveEnabled) && (
        <section className="container pb-8 px-4 sm:px-0">
          <div className="max-w-3xl mx-auto">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-xl">
              {youtubeVideoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}${liveEnabled ? "?autoplay=1&live=1" : ""}`}
                  title="G12 Paris Culte en direct"
                  className="absolute inset-0 w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : liveEnabled ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                    <p className="text-muted-foreground">Le direct va commencer...</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Share Button */}
            <div className="flex justify-center gap-3 mt-6">
              <Button
                onClick={handleShare}
                className="gap-2"
                variant="outline"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Lien copié !" : "Partager le culte"}
              </Button>
              {youtubeVideoId && (
                <Button
                  asChild
                  variant="ghost"
                >
                  <a
                    href={`https://youtube.com/watch?v=${youtubeVideoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir sur YouTube
                  </a>
                </Button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Content section */}
      <section className="container pb-12 sm:pb-16 pt-0 px-4 sm:px-0">
        {settingsQuery.data?.culteBannerUrl && (
          <div className="flex justify-center -mt-6 sm:-mt-8 mb-8 sm:mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-2 sm:px-4">
            <img
              src={settingsQuery.data.culteBannerUrl as string}
              alt="Bannière culte"
              className="rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl shadow-primary/10 transition-transform hover:scale-[1.02] duration-500 w-full max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] h-auto"
            />
          </div>
        )}
        <PageContentDisplay pageId="culte-en-ligne" layout="split" />
      </section>
    </div>
  );
}