import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye, Target, Heart, BookOpen } from "lucide-react";

export default function AboutVisionPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=2000')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        
        <div className="container relative z-10 text-center text-white">
          <span className="text-amber-400 font-bold tracking-widest uppercase text-sm mb-6 block">
            Notre Vision
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Équiper les croyants par la force de la Parole
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Nous croyons que chaque livre, chaque étude, chaque Bible que nous diffusons est une semence pour l'éternité.
          </p>
        </div>
      </section>

      {/* Mission & Pourquoi */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="text-3xl font-serif font-bold">Notre Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Notre mission n'est pas simplement de vendre des livres, mais de fournir des ressources spirituelles de haute qualité qui transforment les vies, renouvellent les intelligences et affermissent la foi de l'Église francophone.
              </p>
              
              <h3 className="text-xl font-bold mt-8 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Pourquoi proposer ces livres ?
              </h3>
              <p className="text-muted-foreground">
                Dans un monde saturé d'informations, il est crucial de s'ancrer dans la vérité. Nous sélectionnons rigoureusement chaque ouvrage de notre bibliothèque pour son orthodoxie biblique, sa profondeur spirituelle et son utilité pratique pour la vie chrétienne.
              </p>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl transform translate-x-4 translate-y-4" />
              <img 
                src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000" 
                alt="Bible ouverte sur une table" 
                className="relative z-10 rounded-2xl shadow-xl w-full object-cover aspect-[4/5]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Nos Valeurs */}
      <section className="py-20 bg-muted/30 border-t">
        <div className="container max-w-6xl text-center">
          <h2 className="text-3xl font-serif font-bold mb-16">Nos Valeurs Fondamentales</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Fidélité Biblique</h3>
              <p className="text-muted-foreground">
                Nous nous engageons à diffuser des ressources qui respectent l'autorité et l'inerrance de la Parole de Dieu. La Bible est notre boussole absolue.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Eye className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Excellence</h3>
              <p className="text-muted-foreground">
                Que ce soit dans le choix du cuir d'une Bible ou dans le service client, nous visons l'excellence pour honorer Dieu dans tout ce que nous faisons.
              </p>
            </div>
            
            <div className="bg-card p-8 rounded-2xl border shadow-sm hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-4">Cœur pour l'Église</h3>
              <p className="text-muted-foreground">
                Notre but ultime est d'édifier le Corps du Christ. Nous travaillons en partenariat avec les églises locales pour équiper les saints.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative text-center">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-serif font-bold mb-6">Prêt à approfondir votre foi ?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Parcourez notre catalogue et découvrez les ressources que nous avons soigneusement sélectionnées pour vous.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild className="rounded-full px-8 shadow-lg shadow-primary/20">
              <Link href="/bibliotheque/catalogue">Explorer la bibliothèque</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8 backdrop-blur-sm">
              <Link href="/contact">Nous contacter</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
