import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Loader2 } from "lucide-react";
import AnnouncementCard from "@/components/AnnouncementCard";

export default function EventsYouthPage() {
  const { t } = useTranslation();

  const { data: youthEvents, isLoading } = trpc.announcements.byCategory.useQuery({ category: "jeunes" });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-violet-500/5 to-background border-b border-border">
        <div className="container py-8 md:py-12">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link href="/evenements">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("common.back") ?? "Retour"}
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              {t("events.youth") ?? "Événements Jeunes"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
            {t("events.youthTitle") ?? "Activités Jeunes"}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("events.youthDescription") ?? "Retrouvez tous les événements et activités dédiés aux jeunes de notre communauté."}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">{t("common.loading") ?? "Chargement..."}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!youthEvents || youthEvents.length === 0) && (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold">{t("events.noYouth") ?? "Aucun événement jeunes"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("events.noYouthDesc") ?? "Les prochains événements jeunes seront bientôt annoncés."}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/evenements">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("events.allEvents") ?? "Voir tous les événements"}
              </Link>
            </Button>
          </div>
        )}

        {/* Youth events grid */}
        {!isLoading && youthEvents && youthEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {youthEvents.map((event: any) => (
              <div key={event.id} className="relative">
                <Badge className="absolute top-3 left-3 z-10 bg-violet-500 text-white border-0">
                  <Users className="w-3 h-3 mr-1" />
                  Jeunes
                </Badge>
                <AnnouncementCard
                  announcement={{
                    imageUrl: event.mediaUrl,
                    title: event.title,
                    description: event.description,
                    date: event.eventDate,
                    location: event.location,
                    badge: event.badge,
                    ctaLabel: event.ctaLabel,
                    ctaHref: event.ctaHref,
                    variant: (event.variant ?? "poster") as "poster" | "default" | "compact",
                    textColor: event.textColor,
                    titleColor: event.titleColor,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
