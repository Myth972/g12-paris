import PageContentDisplay from "@/components/PageContentDisplay";

export default function CulteEnLignePage() {
  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Culte en ligne
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight">
              Culte en ligne
              <br />
              <span className="text-primary/80">Adorez depuis chez vous</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg">
              Participez à nos services de culte en ligne et vivez une
              expérience spirituelle depuis n'importe où.
            </p>
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="container py-16">
        <PageContentDisplay pageId="culte-en-ligne" />
      </section>
    </div>
  );
}
