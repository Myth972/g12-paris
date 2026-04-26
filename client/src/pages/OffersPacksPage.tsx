import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, Gift, Package, Sparkles, BookOpen, Users } from "lucide-react";

const PACKS = [
  {
    id: "decouverte",
    title: "Pack Découverte",
    description: "L'essentiel pour bien démarrer votre voyage spirituel.",
    icon: Gift,
    price: 39.90,
    originalPrice: 52.00,
    color: "bg-blue-500",
    features: [
      "Bible Nouvelle Édition (Couverture rigide)",
      "Livre : 'Fondements de la Foi'",
      "Carnet de notes spirituel",
      "Plan de lecture 30 jours inclus"
    ],
    popular: false
  },
  {
    id: "etude",
    title: "Pack Étude Biblique",
    description: "Les outils indispensables pour une étude approfondie de la Parole.",
    icon: BookOpen,
    price: 89.00,
    originalPrice: 115.00,
    color: "bg-amber-500",
    features: [
      "Bible d'Étude Vie Nouvelle (Simili-cuir)",
      "Commentaire Biblique Concis",
      "Dictionnaire Biblique Illustré",
      "Surligneurs spéciaux papier bible"
    ],
    popular: true
  },
  {
    id: "premium",
    title: "Pack Premium Cuir",
    description: "L'excellence absolue pour un cadeau inoubliable.",
    icon: Sparkles,
    price: 149.00,
    originalPrice: 185.00,
    color: "bg-slate-900",
    features: [
      "Bible Premium (Cuir véritable, dorure or)",
      "Coffret en bois gravé",
      "Concordance complète",
      "Livraison express offerte",
      "Marquage personnalisé offert"
    ],
    popular: false
  },
  {
    id: "jeunesse",
    title: "Pack Jeunesse",
    description: "Pour accompagner les ados dans leur croissance spirituelle.",
    icon: Package,
    price: 45.00,
    originalPrice: 60.00,
    color: "bg-green-500",
    features: [
      "Bible Aventure (Édition Jeunes)",
      "Livre : 'Vivre sa foi au lycée'",
      "Journal intime spirituel",
      "Bracelet connecté 'WWJD'"
    ],
    popular: false
  }
];

export default function OffersPacksPage() {
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
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {PACKS.map((pack) => {
              const Icon = pack.icon;
              return (
                <div 
                  key={pack.id} 
                  className={`bg-card rounded-2xl border flex flex-col relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${pack.popular ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border'}`}
                >
                  {pack.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm">
                      Le plus choisi
                    </div>
                  )}
                  
                  <div className={`p-8 rounded-t-2xl ${pack.color} text-white text-center relative overflow-hidden`}>
                    <div className="absolute -right-4 -top-4 opacity-20">
                      <Icon className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-2xl font-bold mb-2">{pack.title}</h3>
                      <p className="text-white/80 text-sm">{pack.description}</p>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex items-end justify-center gap-2 mb-6">
                      <span className="text-muted-foreground line-through text-lg">{pack.originalPrice.toFixed(2)}€</span>
                      <span className="text-4xl font-bold text-foreground">{pack.price.toFixed(2)}€</span>
                    </div>

                    <ul className="space-y-4 mb-8 flex-1">
                      {pack.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className={`w-5 h-5 shrink-0 ${pack.popular ? 'text-primary' : 'text-green-500'}`} />
                          <span className="text-sm text-muted-foreground leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button className={`w-full h-12 text-md ${pack.popular ? '' : 'variant-outline'}`} variant={pack.popular ? 'default' : 'outline'}>
                      Ajouter au panier
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
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
