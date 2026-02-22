import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Calendar, Clock, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function Actualites() {
  const { data, isLoading, error } = trpc.articles.list.useQuery({
    limit: 20,
    category: "actualité",
  });

  const articles = data?.items || [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Actualités - G12 Paris</title>
        <meta name="description" content="Restez informé des dernières actualités et nouvelles de notre communauté G12 Paris." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Actualités
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Restez informé des dernières nouvelles et événements
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <p className="text-destructive font-medium">Erreur de chargement</p>
            <p className="text-muted-foreground text-sm mt-2">
              Veuillez réessayer ultérieurement
            </p>
          </div>
        ) : articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: any, index: number) => (
              <article
                key={article.id}
                className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                {article.coverImageUrl ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.coverImageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative h-48 bg-muted flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
                    <div className="absolute top-3 left-3">
                      <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <h3 className="font-serif text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    <Link href={`/article/${article.slug}`}>
                      {article.title}
                    </Link>
                  </h3>
                  
                  {article.excerpt && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {new Date(article.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {article.youtubeUrl && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Vidéo disponible</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/article/${article.slug}`}
                    className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:text-primary/80 transition-colors text-sm"
                  >
                    Lire la suite
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-foreground">Aucune actualité pour le moment</p>
            <p className="text-muted-foreground text-sm mt-2">
              Revenez bientôt pour découvrir nos nouvelles actualités
            </p>
          </div>
        )}
      </section>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
