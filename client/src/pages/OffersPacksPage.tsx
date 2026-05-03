import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Gift, Package, Sparkles, BookOpen, Users, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

export default function OffersPacksPage() {
  const { data, isLoading } = trpc.articles.list.useQuery({
    category: "bibliothèque:offre",
    limit: 20
  });

  const packs = data?.items || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 py-16 border-b text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Gift className="w-64 h-64" />
        </div>
        <div className="container relative z-10">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-widest uppercase mb-6">
            Bons Plans & Idées Cadeaux
          </span>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-6">Offres & Packs Exclusifs</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Économisez jusqu'à 25% en choisissant nos packs thématiques. Idéals pour s'équiper, étudier ou pour offrir un cadeau spirituel qui a du sens.
          </p>
        </div>
      </section>

      {/* Packs Grid */}
      <section className="py-20">
        <div className="container">
          {isLoading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 w-full rounded-2xl" />
                  <Skeleton className="h-8 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
              {packs.map((pack) => {
                const meta = (() => { try { return JSON.parse(pack.meta || "{}"); } catch { return {}; } })();
                const features = meta.features || [];
                const originalPrice = meta.originalPrice || 0;
                const price = (pack.price || 0) / 100;
                const isPopular = meta.popular || false;
                const color = meta.color || "bg-primary";
                
                // Using a generic icon if none is provided
                const Icon = Gift;

                return (
                  <div 
                    key={pack.id} 
                    className={`bg-card rounded-2xl border flex flex-col relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isPopular ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border'}`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm">
                        Le plus choisi
                      </div>
                    )}
                    
                    <div className={`p-8 rounded-t-2xl ${color} text-white text-center relative overflow-hidden`}>
                      <div className="absolute -right-4 -top-4 opacity-20">
                        <Icon className="w-24 h-24" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">{pack.title}</h3>
                        <p className="text-white/80 text-sm">{pack.excerpt}</p>
                      </div>
                    </div>
                    
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-end justify-center gap-2 mb-6">
                        {originalPrice > price && (
                          <span className="text-muted-foreground line-through text-lg">{originalPrice.toFixed(2)}€</span>
                        )}
                        <span className="text-4xl font-bold text-foreground">{price.toFixed(2)}€</span>
                      </div>

                      <ul className="space-y-4 mb-8 flex-1">
                        {features.map((feature: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <Check className={`w-5 h-5 shrink-0 ${isPopular ? 'text-primary' : 'text-green-500'}`} />
                            <span className="text-sm text-muted-foreground leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button className={`w-full h-12 text-md ${isPopular ? '' : 'variant-outline'}`} variant={isPopular ? 'default' : 'outline'}>
                        Ajouter au panier
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Corporate/Church bulk orders */}
      <section className="py-16 bg-muted/30 border-t">
        <div className="container">
          <div className="max-w-4xl mx-auto bg-card border rounded-2xl p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold font-serif mb-2">Commandes Groupées & Églises</h3>
              <p className="text-muted-foreground mb-4">
                Vous êtes responsable d'une église, d'un groupe de jeunes ou vous souhaitez commander en grande quantité ? Profitez de nos tarifs préférentiels.
              </p>
              <Button variant="secondary">Demander un devis personnalisé</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
