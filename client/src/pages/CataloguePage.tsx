import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOCK_BOOKS = [
  { id: 1, title: "Bible d'Étude Vie Nouvelle", author: "Collectif", price: 45.00, category: "Bible", theme: "Étude", image: "/premium_bible.png" },
  { id: 2, title: "Le Leadership Spirituel", author: "J. Oswald Sanders", price: 15.50, category: "Livre", theme: "Leadership", image: "/premium_bible.png" },
  { id: 3, title: "La Prière qui Transforme", author: "Timothy Keller", price: 22.00, category: "Livre", theme: "Prière", image: "/premium_bible.png" },
  { id: 4, title: "Fondements de la Foi", author: "C.S. Lewis", price: 18.90, category: "Livre", theme: "Foi", image: "/premium_bible.png" },
  { id: 5, title: "Commentaire Romain", author: "John MacArthur", price: 32.00, category: "Commentaire", theme: "Étude", image: "/premium_bible.png" },
  { id: 6, title: "Bible Aventure", author: "Collectif", price: 28.00, category: "Bible", theme: "Jeunesse", image: "/premium_bible.png" },
  { id: 7, title: "Le Mariage", author: "Timothy Keller", price: 19.50, category: "Livre", theme: "Famille", image: "/premium_bible.png" },
  { id: 8, title: "La Fin des Temps", author: "David Jeremiah", price: 21.00, category: "Livre", theme: "Prophétie", image: "/premium_bible.png" },
];

export default function CataloguePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  
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
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" /> Filtres
              </h3>
              
              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Titre, auteur..." 
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Type de livre */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <div className="space-y-2">
                    {["Bibles", "Livres", "Commentaires", "Études", "Jeunesse"].map(type => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" />
                        <span className="text-sm">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Thèmes */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Thème</label>
                  <div className="space-y-2">
                    {["Foi", "Leadership", "Famille", "Prophétie", "Prière"].map(theme => (
                      <label key={theme} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" />
                        <span className="text-sm">{theme}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Prix */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Prix max (€)</label>
                  <input type="range" className="w-full accent-primary" min="0" max="100" defaultValue="100" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0€</span>
                    <span>100€+</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Top bar */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-muted/30 p-4 rounded-lg mb-8 gap-4">
              <span className="text-sm text-muted-foreground font-medium">
                Affichage de <span className="text-foreground font-bold">{MOCK_BOOKS.length}</span> résultats
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Trier par:</span>
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
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {MOCK_BOOKS.map((book) => (
                <Link key={book.id} href={`/bibliotheque/livre/${book.id}`} className="group flex flex-col h-full">
                  <div className="rounded-xl overflow-hidden mb-4 bg-muted aspect-square relative border border-border/50 group-hover:border-primary/30 transition-colors shadow-sm group-hover:shadow-md">
                    <img 
                      src={book.image} 
                      alt={book.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      {book.id === 1 && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">Bestseller</span>
                      )}
                      <span className="bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded">
                        {book.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <h3 className="font-bold text-base leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-2">{book.author}</p>
                    <div className="mt-auto pt-2 flex items-center justify-between">
                      <p className="font-semibold text-lg text-primary">{book.price.toFixed(2)} €</p>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-primary/5 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                        <span className="sr-only">Acheter</span>
                        +
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled>{"<"}</Button>
                <Button variant="default" size="icon">1</Button>
                <Button variant="outline" size="icon">2</Button>
                <Button variant="outline" size="icon">3</Button>
                <Button variant="outline" size="icon">{">"}</Button>
              </div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
