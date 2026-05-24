import { Link } from "wouter";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, Library, Users, ArrowRight, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";

export default function BibliothequePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isRefreshing, setIsRefreshing] = useState(false);
  
   const quickAccess = [
     { icon: BookOpen, label: "Bibles", href: "/bibliotheque/catalogue?theme=bibles" },
     { icon: BookMarked, label: "Études", href: "/bibliotheque/catalogue?theme=etude-biblique" },
     { icon: Users, label: "Jeunesse", href: "/bibliotheque/catalogue?theme=jeunesse" },
      { icon: Library, label: "Familles", href: "/bibliotheque/catalogue?theme=famille" }
   ];

  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const settings = settingsQuery.data || {};

  // Fetch featured books from server
  const { data: booksData, refetch: refetchBooks, isLoading: booksLoading } = trpc.articles.list.useQuery({
    category: "bibliothèque",
    limit: 4,
    sort: "newest"
  });

  const featuredBooks = (booksData?.items || []).map((book: any) => ({
    id: book.id,
    title: book.title,
    author: (JSON.parse(book.meta || "{}") as any).author || "Auteur inconnu",
    price: book.price ? `${(book.price / 100).toFixed(2)} €` : "Gratuit",
    image: book.coverImageUrl || "/premium_bible.png"
  }));

  const handleSync = async () => {
    setIsRefreshing(true);
    try {
      await refetchBooks();
      toast.success("Bibliothèque synchronisée");
    } catch (error) {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner Premium */}
      <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800" />
        <div className="absolute inset-0 bg-[url('/premium_bible.png')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        
        <div className="container relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
                <span className="text-xs font-medium uppercase tracking-wider text-amber-200">
                  Librairie Spirituelle
                </span>
              </div>
              <PageTitleEditor
                pageKey="bibliotheque"
                defaultH1={"Découvrez notre\nBibliothèque Premium"}
                defaultH2=""
                h1ClassName="text-4xl md:text-5xl lg:text-6xl font-bold font-serif leading-tight mb-6 !text-white drop-shadow-lg"
              />
              <PageTextEditor
                pageKey="bibliotheque"
                textKey="hero"
                defaultText="Plongez dans des textes inspirants. Des Bibles aux finitions exceptionnelles, des commentaires profonds et des ressources pour nourrir votre esprit."
                className="text-lg md:text-xl !text-slate-300 mb-8 max-w-xl font-light"
              />
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-lg shadow-amber-900/50">
                  <Link href="/bibliotheque/catalogue">Explorer le catalogue</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
                  <Link href="/bibliotheque/offres">Voir les offres</Link>
                </Button>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent z-10" />
              <img 
                src="/premium_bible.png" 
                alt="Bible Premium" 
                className="w-full h-auto rounded-lg shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access */}
      <section className="py-8 bg-muted/30 border-b">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickAccess.map((item, idx) => {
              const Icon = item.icon;
              return (
                <Link key={idx} href={item.href}>
                  <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group bg-card">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <Icon size={24} />
                      </div>
                      <span className="font-semibold">{item.label}</span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Inspiring Verse */}
      <section className="py-16 bg-primary/5">
        <div className="container max-w-6xl text-center">
          <blockquote className="space-y-4">
            <p className="text-2xl md:text-3xl font-serif italic text-foreground/80 leading-relaxed">
              "Ta parole est une lampe à mes pieds, Et une lumière sur mon sentier."
            </p>
            <footer className="text-primary font-semibold tracking-widest uppercase">
              Psaumes 119:105
            </footer>
          </blockquote>
        </div>
      </section>

      {/* Nouveautés & Bestsellers */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold font-serif mb-2">Nouveautés & Meilleures Ventes</h2>
              <p className="text-muted-foreground">Découvrez nos dernières sélections spirituelles</p>
            </div>
            <div className="flex gap-2 hidden md:flex">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={isRefreshing}
                  className="gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Sync...' : 'Synchroniser'}
                </Button>
              )}
              <Button variant="ghost" asChild>
                <Link href="/bibliotheque/catalogue">Voir tout <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredBooks.map((book: any) => (
              <Link key={book.id} href={`/bibliotheque/livre/${book.id}`} className="group">
                <div className="rounded-xl overflow-hidden mb-4 bg-muted aspect-[3/4] relative">
                  <img 
                    src={book.image} 
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm transform translate-y-4 group-hover:translate-y-0 transition-all">
                      Aperçu rapide
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{book.title}</h3>
                <p className="text-muted-foreground text-sm mb-2">{book.author}</p>
                <p className="font-semibold text-primary">{book.price}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Sélections Thématiques CTA */}
      <section className="py-12 md:py-16 relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1455390582262-044cdead2708?q=80&w=2000')] bg-cover bg-center opacity-10 mix-blend-overlay z-0" />
        
        <div className="container relative z-10 max-w-6xl px-4 min-h-[200px] flex flex-col justify-center items-center">
          {/* Centered Text Content */}
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif font-bold !text-white drop-shadow-sm">
              {settings["page.bibliotheque.themesTitle"] || "Explorez par Thématiques"}
            </h2>
            <p className="text-base md:text-lg !text-white/90 leading-relaxed">
              {settings["page.bibliotheque.themesDesc"] || "Foi, Leadership, Famille, Études bibliques, ... Trouvez les ressources qui correspondent exactement à votre besoin spirituel du moment."}
            </p>
            <div className="pt-2 flex justify-center">
              <Button asChild size="lg" className="font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-full px-8 py-6 shadow-lg shadow-black/25 transition-all hover:scale-105">
                <Link href="/bibliotheque/themes">
                  {settings["page.bibliotheque.themesBtn"] || "Parcourir les thèmes"}
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right Logo Content - absolute positioned on desktop to keep text perfectly centered */}
          {settings["page.bibliotheque.themesLogo"] !== "" && (
            <div className="mt-8 md:mt-0 md:absolute md:right-4 md:top-1/2 md:-translate-y-1/2 w-48 md:w-56 lg:w-60 flex justify-center items-center">
              <img 
                src={settings["page.bibliotheque.themesLogo"] || "/logo-g12-editions.png"} 
                alt="Logo Section" 
                className="h-auto max-h-[140px] md:max-h-[160px] lg:max-h-[180px] object-contain hover:scale-105 transition-transform duration-500" 
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
