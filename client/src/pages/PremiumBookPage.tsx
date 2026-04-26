import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle, ShoppingCart, BookOpen, PlayCircle, Heart } from "lucide-react";

export default function PremiumBookPage() {
  const [activeTab, setActiveTab] = useState("description");
  
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/20 border-b">
        <div className="container py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/bibliotheque" className="hover:text-primary transition-colors">Bibliothèque</Link>
          <span>/</span>
          <Link href="/bibliotheque/catalogue" className="hover:text-primary transition-colors">Bibles</Link>
          <span>/</span>
          <span className="text-foreground font-medium">Bible d'Étude Vie Nouvelle Premium</span>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Images / Mockup 3D */}
          <div className="space-y-4">
            <div className="bg-slate-50 border rounded-2xl overflow-hidden aspect-[4/5] relative group shadow-inner">
              {/* Premium badge */}
              <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg">
                Édition Limitée
              </div>
              <img 
                src="/premium_bible.png" 
                alt="Bible Premium"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute bottom-4 right-4 z-10">
                <Button size="icon" variant="secondary" className="rounded-full shadow-lg hover:bg-primary hover:text-white transition-colors">
                  <PlayCircle className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {/* Thumbnails */}
            <div className="flex gap-4">
              {[1, 2, 3, 4].map(idx => (
                <button key={idx} className={`w-1/4 aspect-square rounded-lg border-2 overflow-hidden ${idx === 1 ? 'border-primary' : 'border-transparent hover:border-primary/50'} transition-all bg-muted`}>
                  <img src="/premium_bible.png" alt={`Thumbnail ${idx}`} className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-4 leading-tight">
              Bible d'Étude Vie Nouvelle <br/>
              <span className="text-2xl lg:text-3xl font-light text-muted-foreground italic">Édition Premium Cuir</span>
            </h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="text-muted-foreground text-sm font-medium">128 avis lecteurs</span>
            </div>

            <p className="text-3xl font-bold text-primary mb-8">89,90 €</p>

            <div className="prose prose-sm text-muted-foreground mb-8">
              <p>
                Une édition exceptionnelle reliée en cuir véritable avec dorures sur tranche. 
                Cette Bible d'étude contient plus de 10 000 notes explicatives, des cartes en couleur, 
                et des concordances approfondies pour enrichir votre méditation quotidienne.
              </p>
              <ul className="list-none pl-0 space-y-2 mt-4">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Cuir véritable, tannage naturel</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Dorure sur tranche 24 carats</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Papier bible premium 32g/m²</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Livrée dans son coffret de protection</li>
              </ul>
            </div>

            <div className="mt-auto space-y-4">
              <div className="flex gap-4">
                <Button size="lg" className="flex-1 text-lg h-14 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-900/20">
                  <ShoppingCart className="w-5 h-5 mr-2" /> Ajouter au panier
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-6 border-2 hover:bg-primary/5">
                  <Heart className="w-5 h-5 text-muted-foreground hover:text-red-500 transition-colors" />
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center p-4 bg-muted/20 rounded-lg">
                <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" /> En stock</span>
                <span className="text-border">|</span>
                <span>Livraison offerte dès 50€</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Details & Reviews Tabs */}
      <section className="border-t bg-muted/10">
        <div className="container py-12">
          <div className="flex border-b mb-8 overflow-x-auto hide-scrollbar">
            {[
              { id: "description", label: "Description détaillée" },
              { id: "extracts", label: "Extraits (PDF)" },
              { id: "reviews", label: "Avis Lecteurs (128)" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-4 text-lg font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? "border-primary text-primary" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-4xl">
            {activeTab === "description" && (
              <div className="prose prose-lg text-muted-foreground max-w-none">
                <h3 className="text-2xl font-serif font-bold text-foreground mb-4">L'excellence au service de la Parole</h3>
                <p>
                  Plongez au cœur des Écritures avec la Bible d'Étude Vie Nouvelle. Cette édition premium a été conçue pour durer toute une vie. Sa couverture en cuir de vachette pleine fleur offre un toucher exceptionnel et acquerra une patine unique avec le temps.
                </p>
                <p>
                  Les notes d'étude, rédigées par des théologiens reconnus, apportent un éclairage culturel, historique et spirituel précieux sur chaque passage. C'est l'outil idéal pour l'étude personnelle, la préparation de messages ou simplement pour approfondir votre relation avec Dieu.
                </p>
                <div className="grid sm:grid-cols-2 gap-8 mt-8">
                  <div>
                    <h4 className="font-bold text-foreground">Caractéristiques</h4>
                    <ul className="space-y-2 mt-2">
                      <li><strong>Traduction :</strong> Louis Segond 1910 révisée</li>
                      <li><strong>Format :</strong> 16 x 24 cm</li>
                      <li><strong>Pages :</strong> 2240 pages</li>
                      <li><strong>Reliure :</strong> Souple, cuir véritable</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Inclus</h4>
                    <ul className="space-y-2 mt-2">
                      <li>Concordance de 150 pages</li>
                      <li>16 cartes couleurs haute résolution</li>
                      <li>Plans de lecture annuels</li>
                      <li>2 signets rubans satinés</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "extracts" && (
              <div className="grid sm:grid-cols-2 gap-6">
                {[1, 2].map(doc => (
                  <div key={doc} className="flex items-center gap-4 p-6 border rounded-xl bg-card hover:border-primary transition-colors group cursor-pointer shadow-sm">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Extrait Chapitre {doc}</h4>
                      <p className="text-sm text-muted-foreground mb-2">PDF • 2.4 Mo</p>
                      <span className="text-primary text-sm font-medium group-hover:underline">Télécharger l'extrait</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-8">
                <div className="flex items-center gap-8 p-6 bg-card border rounded-xl">
                  <div className="text-center">
                    <p className="text-5xl font-bold font-serif text-primary">4.9</p>
                    <div className="flex text-amber-500 my-2 justify-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Basé sur 128 avis</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map(rating => (
                      <div key={rating} className="flex items-center gap-2 text-sm">
                        <span className="w-3">{rating}</span>
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full" 
                            style={{ width: rating === 5 ? '85%' : rating === 4 ? '10%' : rating === 3 ? '5%' : '0%' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Button variant="outline">Écrire un avis</Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {[1, 2, 3].map(review => (
                    <div key={review} className="border-b pb-6 last:border-0">
                      <div className="flex justify-between mb-2">
                        <div>
                          <p className="font-bold">Jean Dupont</p>
                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">Il y a 2 semaines</span>
                      </div>
                      <h5 className="font-bold mb-1">Magnifique édition</h5>
                      <p className="text-muted-foreground text-sm">
                        La qualité du cuir est exceptionnelle. Les notes d'étude sont très pertinentes et m'aident énormément dans ma lecture quotidienne. Le papier est fin mais l'encre ne transparaît pas trop. Je recommande vivement cet investissement.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
