import PageContentDisplay from "@/components/PageContentDisplay";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { trpc } from "@/lib/trpc";

export default function CulteEnLignePage() {
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const heroBgUrl = settingsQuery.data?.culteHeroBgUrl as string | undefined;
  const heroOpacityRaw = settingsQuery.data?.culteHeroBgOpacity as
    | string
    | undefined;
  const heroOpacityPercent = Math.max(
    0,
    Math.min(60, Number(heroOpacityRaw ?? 18))
  );
  const heroOpacity = heroOpacityPercent / 100;

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-16 overflow-hidden">
        {heroBgUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url(${heroBgUrl})`,
              opacity: heroOpacity,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-transparent pointer-events-none" />
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Culte en ligne
              </span>
            </div>
            {/* Live Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider mb-6 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              En direct
            </div>

            <PageTitleEditor
              pageKey="culte-en-ligne"
              defaultH1={"Culte en ligne\nAdorez depuis chez vous"}
              defaultH2=""
              h1ClassName="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight"
            />
            <PageTextEditor
              pageKey="culte-en-ligne"
              textKey="hero"
              defaultText="Participez à nos services de culte en ligne et vivez une expérience spirituelle depuis n'importe où."
              className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="container pb-16 pt-0">
        {settingsQuery.data?.culteBannerUrl && (
          <div className="flex justify-center -mt-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-4">
            <img
              src={settingsQuery.data.culteBannerUrl as string}
              alt="Bannière culte"
              className="rounded-2xl shadow-2xl shadow-primary/10 transition-transform hover:scale-[1.02] duration-500"
              style={{
                width: `${settingsQuery.data.culteBannerWidth || 600}px`,
                maxWidth: "100%",
                height: "auto",
              }}
            />
          </div>
        )}
        <PageContentDisplay pageId="culte-en-ligne" layout="split" />
      </section>
    </div>
  );
}
