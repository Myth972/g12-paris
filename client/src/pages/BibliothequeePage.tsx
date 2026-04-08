import PageContentDisplay from "@/components/PageContentDisplay";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";

export default function BibliothequeePage() {
  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-16">
        <div className="container">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Bibliothèque
              </span>
            </div>
            <PageTitleEditor
              pageKey="bibliotheque"
              defaultH1={"Bibliothèque\nMédias & Ressources"}
              defaultH2=""
              h1ClassName="text-3xl md:text-4xl font-bold font-serif text-foreground leading-tight"
            />
            <PageTextEditor
              pageKey="bibliotheque"
              textKey="hero"
              defaultText="Retrouvez ici nos ressources éducatives et spirituelles : vidéos, images et contenus pour approfondir votre foi."
              className="mt-4 text-muted-foreground text-base leading-relaxed max-w-lg"
            />
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="container py-10">
        <h3 className="text-xl font-serif font-bold text-foreground mb-6">
          Ressources disponibles
        </h3>
        <PageContentDisplay pageId="bibliotheque" mode="grid" />
      </section>
    </div>
  );
}
