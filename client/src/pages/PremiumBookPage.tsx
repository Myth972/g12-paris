import { useState } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  ExternalLink,
  ShoppingCart,
  BookOpen,
  Heart,
  ArrowLeft,
  Loader2,
  Tag,
  BookMarked,
  Globe,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PremiumBookPage() {
  const params = useParams<{ id: string }>();
  const bookId = Number(params.id);
  const [activeTab, setActiveTab] = useState("description");

  const { data: book, isLoading } = trpc.articles.byId.useQuery(
    { id: bookId },
    { enabled: !!bookId && !isNaN(bookId) }
  );

  const parseCategory = (cat: string) => {
    const parts = cat.split(":");
    return { type: parts[1] || "livre", theme: parts[2] || "général" };
  };

  const parseMeta = (meta: string | null | undefined) => {
    if (!meta) return {};
    try {
      return JSON.parse(meta);
    } catch {
      return {};
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-2xl font-serif font-bold mb-2">Livre introuvable</h2>
          <p className="text-muted-foreground mb-6">Ce livre n'existe pas ou a été retiré.</p>
          <Button asChild>
            <Link href="/bibliotheque/catalogue">Retour au catalogue</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { type, theme } = parseCategory(book.category);
  const meta = parseMeta(book.meta);
  const price = book.price ? (book.price / 100).toFixed(2) : null;
  const affiliateUrl = (book as any).affiliateUrl;
  const isAffiliate = !!affiliateUrl;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="bg-muted/20 border-b">
        <div className="container py-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/bibliotheque" className="hover:text-primary transition-colors">Bibliothèque</Link>
          <span>/</span>
          <Link href="/bibliotheque/catalogue" className="hover:text-primary transition-colors">Catalogue</Link>
          <span>/</span>
          <span className="text-foreground font-medium line-clamp-1">{book.title}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <section className="container py-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Cover Image */}
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-2xl overflow-hidden aspect-[4/5] relative group shadow-inner">
              {isAffiliate && (
                <div className="absolute top-4 left-4 z-10 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3" />
                  Disponible sur Amazon
                </div>
              )}
              <img
                src={book.coverImageUrl || "/premium_bible.png"}
                alt={book.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            </div>
            {/* Type/Theme badges */}
            <div className="flex gap-2 justify-center flex-wrap">
              <Badge variant="secondary" className="capitalize">
                <BookMarked className="w-3 h-3 mr-1" />
                {type}
              </Badge>
              <Badge variant="outline" className="capitalize">
                <Tag className="w-3 h-3 mr-1" />
                {theme}
              </Badge>
              {meta.format && (
                <Badge variant="outline">
                  <Globe className="w-3 h-3 mr-1" />
                  {meta.format}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-serif font-bold mb-3 leading-tight">
              {book.title}
            </h1>
            {meta.author && (
              <p className="text-lg text-muted-foreground italic mb-6">par {meta.author}</p>
            )}

            {price && (
              <p className="text-3xl font-bold text-primary mb-2">
                {price} €
                {isAffiliate && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">via Amazon</span>
                )}
              </p>
            )}

            {book.excerpt && (
              <p className="text-muted-foreground leading-relaxed mb-8 text-base border-l-4 border-primary/30 pl-4 italic whitespace-pre-wrap break-words">
                {book.excerpt}
              </p>
            )}

            {/* Meta details */}
            {(meta.publisher || meta.language || meta.pages) && (
              <div className="grid grid-cols-2 gap-3 mb-8 bg-muted/30 rounded-xl p-4 text-sm">
                {meta.publisher && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Éditeur</p>
                    <p className="font-medium">{meta.publisher}</p>
                  </div>
                )}
                {meta.language && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Langue</p>
                    <p className="font-medium">{meta.language}</p>
                  </div>
                )}
                {meta.format && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Format</p>
                    <p className="font-medium">{meta.format}</p>
                  </div>
                )}
                {meta.pages && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wider mb-0.5">Pages</p>
                    <p className="font-medium">{meta.pages}</p>
                  </div>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="mt-auto space-y-4">
              {isAffiliate ? (
                <div className="space-y-3">
                  <a
                    href={affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="flex items-center justify-center gap-2 w-full h-14 bg-[#FF9900] hover:bg-[#e88a00] text-white font-bold text-lg rounded-lg shadow-lg shadow-amber-900/20 transition-all hover:scale-[1.02] active:scale-100"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Acheter sur Amazon
                    <ExternalLink className="w-4 h-4 opacity-70" />
                  </a>
                  <p className="text-xs text-center text-muted-foreground">
                    🔗 Lien d'affiliation — Vous serez redirigé vers Amazon.fr
                  </p>
                </div>
              ) : (
                <Button size="lg" className="flex-1 w-full text-lg h-14 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-900/20">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Commander
                </Button>
              )}

              <Button variant="outline" size="lg" asChild className="w-full h-12">
                <Link href="/bibliotheque/catalogue">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour au catalogue
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Description Tab */}
      <section className="border-t bg-muted/10">
        <div className="container py-12">
          <div className="flex border-b mb-8 overflow-x-auto">
            {[
              { id: "description", label: "Description" },
              { id: "details", label: "Détails du livre" },
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
              <div
                className="prose prose-lg dark:prose-invert text-muted-foreground max-w-none whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: book.content }}
              />
            )}
            {activeTab === "details" && (
              <div className="grid sm:grid-cols-2 gap-6">
                {Object.entries({
                  "Auteur": meta.author,
                  "Éditeur": meta.publisher,
                  "Format": meta.format,
                  "Langue": meta.language,
                  "Pages": meta.pages,
                  "Type": type,
                  "Thème": theme,
                }).filter(([, v]) => v).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 p-4 bg-card border rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{key}</p>
                      <p className="font-semibold capitalize">{value as string}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
