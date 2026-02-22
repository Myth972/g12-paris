import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ChevronRight, Image as ImageIcon, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function CulteEnLigne() {
  const { data, isLoading, error } = trpc.articles.list.useQuery({
    limit: 12,
    category: "culte en ligne",
  });

  const articles = data?.items || [];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Culte en ligne - G12 Paris</title>
        <meta name="description" content="Rejoignez nos cultes en ligne et participez à nos services spirituels." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Culte en ligne
          </h1>
          <p className="text-xl text-purple-100 max-w-2xl mx-auto">
            Rejoignez nos services spirituels en direct depuis chez vous
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-serif font-bold text-purple-900 mb-4">
            Comment participer ?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h3 className="font-semibold text-purple-900 mb-2">Connectez-vous</h3>
              <p className="text-purple-700">
                Accédez à notre plateforme en ligne à l'heure du culte
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h3 className="font-semibold text-purple-900 mb-2">Participez</h3>
              <p className="text-purple-700">
                Vivez l'expérience complète du culte en direct avec nous
              </p>
            </div>
            <div>
              <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h3 className="font-semibold text-purple-900 mb-2">Restez connecté</h3>
              <p className="text-purple-700">
                Accédez aux enregistrements des cultes précédents à tout moment
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-serif font-bold mb-8 text-foreground">
            Notre calendrier de cultes
          </h2>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-full" />
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
                      {article.youtubeUrl && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative h-48 bg-muted flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground opacity-50" />
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="font-serif text-xl font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      <Link href={`/article/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>

                    {article.excerpt && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
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
                    </div>

                    <Link
                      href={`/article/${article.slug}`}
                      className="inline-flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition-colors text-sm"
                    >
                      Regarder
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium text-foreground">Aucun culte en ligne pour le moment</p>
              <p className="text-muted-foreground text-sm mt-2">
                Revenez bientôt pour découvrir nos prochains services
              </p>
            </div>
          )}
        </div>
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
