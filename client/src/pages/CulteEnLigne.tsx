import React, { useMemo } from 'react';
import { trpc } from "@/lib/trpc";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar } from "lucide-react";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { EditableText, EditableSection } from "@/components/EditableText";

/**
 * Utilitaire: Trouver le dimanche de la semaine donnée
 * Si c'est dimanche, retourner ce dimanche, sinon le dernier dimanche
 */
function getSundayOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formater une date au format français
 */
function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export default function CulteEnLigne() {
  const { data, isLoading, error } = trpc.articles.list.useQuery({
    limit: 100,
    category: "culte en ligne",
  });

  const articles = data?.items || [];

  // Calculer les dimanches: actuel + 3 précédents
  const sundays = useMemo(() => {
    const currentSunday = getSundayOfWeek();
    return {
      current: currentSunday,
      previous1: new Date(currentSunday.getTime() - 7 * 24 * 60 * 60 * 1000),
      previous2: new Date(currentSunday.getTime() - 14 * 24 * 60 * 60 * 1000),
      previous3: new Date(currentSunday.getTime() - 21 * 24 * 60 * 60 * 1000),
    };
  }, []);

  // Matcher articles par date
  const getArticleForDate = (targetDate: Date) => {
    return articles.find((article: any) => {
      const articleDate = new Date(article.createdAt);
      return (
        articleDate.getFullYear() === targetDate.getFullYear() &&
        articleDate.getMonth() === targetDate.getMonth() &&
        articleDate.getDate() === targetDate.getDate()
      );
    });
  };

  const mainArticle = getArticleForDate(sundays.current);
  const previousArticles = [
    getArticleForDate(sundays.previous1),
    getArticleForDate(sundays.previous2),
    getArticleForDate(sundays.previous3),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Culte en ligne - G12 Paris</title>
        <meta name="description" content="Rejoignez nos cultes en ligne et participez à nos services spirituels." />
      </Helmet>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <EditableText
            value="Culte en ligne"
            pageId="culte-en-ligne"
            fieldName="heroTitle"
            as="h1"
            className="text-4xl md:text-5xl font-serif font-bold mb-4"
          />
          <EditableText
            value="Rejoignez nos services spirituels en direct depuis chez vous"
            pageId="culte-en-ligne"
            fieldName="heroSubtitle"
            as="p"
            className="text-xl text-purple-100 max-w-2xl mx-auto"
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-12">
        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 mb-12">
          <EditableText
            value="Comment participer ?"
            pageId="culte-en-ligne"
            fieldName="infoBoxTitle"
            as="h2"
            className="text-2xl font-serif font-bold text-purple-900 mb-4"
          />
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

        {/* Main Video Player */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-6 h-6 text-purple-600" />
            <h2 className="text-3xl font-serif font-bold text-foreground">
              {mainArticle ? `Culte du ${formatDateFR(sundays.current)}` : 'Culte en ligne'}
            </h2>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-0">
                <div className="w-full aspect-video bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ) : mainArticle && mainArticle.youtubeUrl ? (
            <YouTubePlayer
              url={mainArticle.youtubeUrl}
              title={mainArticle.title}
              className="mb-6"
            />
          ) : (
            <Card className="mb-6">
              <CardContent className="flex items-center justify-center h-80">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Aucune vidéo disponible pour ce dimanche</p>
                  <p className="text-sm mt-2">Revenez bientôt pour découvrir notre prochain culte</p>
                </div>
              </CardContent>
            </Card>
          )}

          {mainArticle?.excerpt && (
            <Card>
              <CardContent className="p-6">
                <p className="text-foreground text-lg leading-relaxed">
                  {mainArticle.excerpt}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Previous Videos */}
        <div>
          <h2 className="text-3xl font-serif font-bold mb-8 text-foreground">
            Cultes précédents
          </h2>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-lg overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : previousArticles.some(a => a) ? (
            <div className="grid gap-6 md:grid-cols-3">
              {previousArticles.map((article, index) => {
                const sundayDate = [sundays.previous1, sundays.previous2, sundays.previous3][index];
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <YouTubePlayer url={article?.youtubeUrl} />
                    </div>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateFR(sundayDate)}</span>
                      </div>
                      <CardTitle className="text-lg line-clamp-2">
                        {article?.title || 'Culte précédent'}
                      </CardTitle>
                    </CardHeader>
                    {article?.excerpt && (
                      <CardContent className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">Aucun culte précédent disponible</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}
