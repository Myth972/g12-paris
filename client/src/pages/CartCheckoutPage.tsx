import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, Truck, ArrowLeft, CreditCard, Lock } from "lucide-react";

export default function CartCheckoutPage() {
  const CART_ITEMS = [
    {
      id: 1,
      title: "Bible d'Étude Vie Nouvelle Premium",
      type: "Cuir noir",
      price: 89.90,
      quantity: 1,
      image: "/premium_bible.png"
    },
    {
      id: 2,
      title: "Le Leadership Spirituel",
      type: "Livre broché",
      price: 15.50,
      quantity: 2,
      image: "/premium_bible.png"
    }
  ];

  const subtotal = CART_ITEMS.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 0; // Free shipping > 50€
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-muted/10 py-12">
      <div className="container max-w-6xl">
        
        <Link href="/bibliotheque/catalogue" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Continuer mes achats
        </Link>
        
        <h1 className="text-3xl font-serif font-bold mb-8">Mon Panier (3 articles)</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="hidden sm:grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground border-b pb-4 mb-4">
                <div className="col-span-6">Produit</div>
                <div className="col-span-2 text-center">Prix</div>
                <div className="col-span-2 text-center">Quantité</div>
                <div className="col-span-2 text-right">Total</div>
              </div>

              {CART_ITEMS.map((item) => (
                <div key={item.id} className="grid sm:grid-cols-12 gap-4 items-center py-4 border-b last:border-0 last:pb-0">
                  <div className="sm:col-span-6 flex gap-4">
                    <div className="w-20 h-24 bg-muted rounded-lg overflow-hidden shrink-0">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                      <button className="text-sm text-red-500 hover:text-red-700 mt-2 font-medium">Supprimer</button>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 text-center font-medium hidden sm:block">
                    {item.price.toFixed(2)} €
                  </div>
                  
                  <div className="sm:col-span-2 flex justify-center">
                    <div className="flex items-center border rounded-md">
                      <button className="px-3 py-1 hover:bg-muted text-muted-foreground">-</button>
                      <span className="px-2 w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button className="px-3 py-1 hover:bg-muted text-muted-foreground">+</button>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2 text-right font-bold text-primary">
                    {(item.price * item.quantity).toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>

            {/* Guarantees */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-card border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                <ShieldCheck className="w-8 h-8 text-green-500" />
                <h4 className="font-semibold text-sm">Paiement 100% Sécurisé</h4>
                <p className="text-xs text-muted-foreground">Transactions cryptées SSL</p>
              </div>
              <div className="bg-card border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                <Truck className="w-8 h-8 text-blue-500" />
                <h4 className="font-semibold text-sm">Livraison Rapide</h4>
                <p className="text-xs text-muted-foreground">Offerte dès 50€ d'achat</p>
              </div>
              <div className="bg-card border rounded-xl p-4 flex flex-col items-center text-center gap-2">
                <ArrowLeft className="w-8 h-8 text-amber-500" />
                <h4 className="font-semibold text-sm">Retours Simples</h4>
                <p className="text-xs text-muted-foreground">14 jours pour changer d'avis</p>
              </div>
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="font-bold text-xl mb-6">Récapitulatif</h2>
              
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frais de port</span>
                  <span className="font-medium text-green-600">Offerts</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary">{total.toFixed(2)} €</span>
                </div>
                <p className="text-xs text-muted-foreground text-right">TVA incluse</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <Input placeholder="Code promo" className="pr-24" />
                  <Button size="sm" variant="secondary" className="absolute right-1 top-1 bottom-1 h-auto">
                    Appliquer
                  </Button>
                </div>
                
                <Button size="lg" className="w-full text-lg h-14 gap-2">
                  <Lock className="w-5 h-5" />
                  Passer la commande
                </Button>
                
                <div className="flex items-center justify-center gap-2 pt-4 opacity-50">
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-medium">Visa, Mastercard, PayPal</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
