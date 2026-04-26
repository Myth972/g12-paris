import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronDown, Loader2, Book } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CataloguePage() {
  const [search] = useLocation();
  const params = new URLSearchParams(window.location.search);
  
  const [searchTerm, setSearchTerm] = useState(params.get("q") || "");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(params.get("type") ? [params.get("type")!] : []);
  const [selectedThemes, setSelectedThemes] = useState<string[]>(params.get("theme") ? [params.get("theme")!] : []);
  const [maxPrice, setMaxPrice] = useState<number>(params.get("maxPrice") ? parseInt(params.get("maxPrice")!) : 100);
  const [sortOrder, setSortOrder] = useState(params.get("sort") || "newest");
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = trpc.articles.list.useQuery({
    category: "bibliothèque",
    search: debouncedSearch || undefined,
    theme: selectedThemes.length > 0 ? selectedThemes[0] : undefined,
    maxPrice: maxPrice * 100, // Convert to cents
    sort: sortOrder as any,
    limit: 50,
  });

  const books = data?.items || [];

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [type]);
  };

  const handleThemeToggle = (theme: string) => {
    setSelectedThemes(prev => prev.includes(theme) ? prev.filter(t => t !== theme) : [theme]);
  };

  const parseCategory = (cat: string) => {
    const parts = cat.split(":");
    return {
      type: parts[1] || "Livre",
      theme: parts[2] || "Général"
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary/5 py-12 border-b">
        <div className="container">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/bibliotheque" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
              Bibliothèque
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-sm font-semibold text-foreground">Catalogue Complet</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif mb-4">Catalogue Complet</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Explorez notre collection complète de Bibles, livres, commentaires et ressources pour votre croissance spirituelle.
          </p>
        </div>
      </section>

      <section className="container py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0 space-y-8">
            <div className="sticky top-24">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" /> Filtres
              </h3>
              
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block font-serif">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Titre, auteur..." 
                      className="pl-9 bg-card"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Type de livre */}
                <div>
                  <label className="text-sm font-medium mb-3 block font-serif">Type</label>
                  <div className="space-y-2">
                    {["bible", "livre", "commentaire", "etude", "jeunesse"].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeToggle(type)}
                          className="rounded border-input text-primary focus:ring-primary w-4 h-4" 
                        />
                        <span className="text-sm capitalize group-hover:text-primary transition-colors">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Thèmes */}
                <div>
                  <label className="text-sm font-medium mb-3 block font-serif">Thème</label>
                  <div className="space-y-2">
                    {["foi", "leadership", "famille", "prophetie", "priere", "evangelisation"].map(theme => (
                      <label key={theme} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedThemes.includes(theme)}
                          onChange={() => handleThemeToggle(theme)}
                          className="rounded border-input text-primary focus:ring-primary w-4 h-4" 
                        />
                        <span className="text-sm capitalize group-hover:text-primary transition-colors">{theme}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Prix */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium font-serif">Prix max</label>
                    <span className="text-sm font-bold text-primary">{maxPrice} €</span>
                  </div>
                  <input 
                    type="range" 
                    className="w-full accent-primary cursor-pointer" 
                    min="0" 
                    max="200" 
                    step="5"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 uppercase tracking-tighter">
                    <span>0€</span>
                    <span>200€+</span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full text-xs" 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTypes([]);
                    setSelectedThemes([]);
                    setMaxPrice(200);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-card border border-border/50 p-4 rounded-xl mb-8 gap-4 shadow-sm">
              <span className="text-sm text-muted-foreground">
                {isLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Recherche...</span>
                ) : (
                  <>Affichage de <span className="text-foreground font-bold">{books.length}</span> résultats</>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Trier par:</span>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-[180px] bg-background">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nouveautés</SelectItem>
                    <SelectItem value="popular">Plus populaires</SelectItem>
                    <SelectItem value="price_asc">Prix: Croissant</SelectItem>
                    <SelectItem value="price_desc">Prix: Décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                <Book className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-serif font-bold mb-2">Aucun résultat</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  Nous n'avons trouvé aucun article correspondant à vos filtres. Essayez de modifier vos critères.
                </p>
                <Button variant="link" className="mt-4" onClick={() => {
                  setSearchTerm("");
                  setSelectedTypes([]);
                  setSelectedThemes([]);
                  setMaxPrice(200);
                }}>
                  Effacer tout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => {
                  const { type, theme } = parseCategory(book.category);
                  const price = (book.price || 0) / 100;
                  
                  return (
                    <Link key={book.id} href={`/bibliotheque/livre/${book.id}`} className="group flex flex-col h-full">
                      <div className="rounded-xl overflow-hidden mb-4 bg-muted aspect-square relative border border-border/50 group-hover:border-primary/30 transition-all shadow-sm group-hover:shadow-md group-hover:-translate-y-1">
                        <img 
                          src={book.coverImageUrl || "/premium_bible.png"} 
                          alt={book.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                          <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                            {type}
                          </span>
                          <span className="bg-primary/80 text-white text-[9px] uppercase tracking-tighter px-1.5 py-0.5 rounded shadow-sm">
                            {theme}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col flex-1">
                        <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2 font-serif">
                          {book.title}
                        </h3>
                        <p className="text-muted-foreground text-xs mb-2 italic">Auteur à définir</p>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <p className="font-bold text-lg text-primary">{price.toFixed(2)} €</p>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all">
                            <span className="sr-only">Détails</span>
                            +
                          </Button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination Placeholder */}
            {books.length > 0 && (
              <div className="flex justify-center mt-12">
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="px-4" disabled>Précédent</Button>
                  <Button variant="default" size="sm" className="w-10">1</Button>
                  <Button variant="outline" size="sm" className="px-4">Suivant</Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}ction>
    </div>
  );
}
