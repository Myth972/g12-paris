import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Heart, Target, Users, Eye, Sparkles, BookHeart, Shield, Flame } from "lucide-react";

const THEMES = [
  {
    id: "foi",
    title: "La Foi & Les Fondements",
    description: "Comprendre les bases du christianisme et affermir votre foi au quotidien.",
    icon: Shield,
    color: "bg-blue-500",
    count: 42
  },
  {
    id: "leadership",
    title: "Leadership Spirituel",
    description: "Développer un cœur de serviteur et diriger selon les principes bibliques.",
    icon: Target,
    color: "bg-amber-500",
    count: 28
  },
  {
    id: "famille",
    title: "Couple & Famille",
    description: "Bâtir des relations solides, élever des enfants et vivre le mariage selon Dieu.",
    icon: Users,
    color: "bg-rose-500",
    count: 35
  },
  {
    id: "prophetie",
    title: "Prophéties & Fin des Temps",
    description: "Étudier l'eschatologie et comprendre les signes des temps bibliques.",
    icon: Eye,
    color: "bg-purple-500",
    count: 19
  },
  {
    id: "jeunesse",
    title: "Jeunesse & Adolescents",
    description: "Ressources adaptées pour les jeunes : bibles, dévotions, études de groupe.",
    icon: Sparkles,
    color: "bg-green-500",
    count: 56
  },
  {
    id: "priere",
    title: "Prière & Méditation",
    description: "Cultiver l'intimité avec Dieu à travers la prière et la méditation de la Parole.",
    icon: Heart,
    color: "bg-red-500",
    count: 31
  },
  {
    id: "guerison",
    title: "Guérison & Restauration",
    description: "Trouver le réconfort et l'espérance face aux épreuves de la vie.",
    icon: BookHeart,
    color: "bg-teal-500",
    count: 24
  },
  {
    id: "reveil",
    title: "Réveil & Saint-Esprit",
    description: "Découvrir la personne du Saint-Esprit et vivre une vie remplie de puissance.",
    icon: Flame,
    color: "bg-orange-500",
    count: 27
  }
];

export default function BiblicalThemesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 py-16 border-b">
        <div className="container text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-4 justify-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Navigation
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6 text-foreground">Thématiques Bibliques</h1>
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
            Trouvez rapidement les ressources, livres et études qui répondent à vos questions et besoins spirituels actuels.
          </p>
        </div>
      </section>

      {/* Grid of Themes */}
      <section className="py-16">
        <div className="container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              return (
                <Link key={theme.id} href={`/bibliotheque/catalogue?theme=${theme.id}`} className="group block">
                  <div className="bg-card border rounded-2xl p-6 h-full hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                    {/* Background glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${theme.color} shadow-sm group-hover:scale-110 transition-transform`}>
                          <Icon size={24} />
                        </div>
                        <span className="text-xs font-semibold bg-muted text-muted-foreground px-2 py-1 rounded-full">
                          {theme.count} articles
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{theme.title}</h3>
                      <p className="text-sm text-muted-foreground flex-1 mb-6">
                        {theme.description}
                      </p>
                      
                      <div className="mt-auto flex items-center text-sm font-semibold text-primary">
                        Explorer ce thème <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl font-serif font-bold mb-4">Vous ne trouvez pas votre thème ?</h2>
          <p className="text-muted-foreground mb-8">
            Utilisez notre recherche avancée dans le catalogue complet pour trouver exactement ce que vous cherchez parmi des milliers de références.
          </p>
          <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
            <Link href="/bibliotheque/catalogue">Rechercher dans le catalogue</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
