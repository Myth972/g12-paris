import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, ArrowLeft, Calendar, Loader2, ChevronLeft, ChevronRight, Church, Users, BookOpen, Star, Filter } from "lucide-react";
import AnnouncementCard from "@/components/AnnouncementCard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const CATEGORIES = [
  { key: "all", label: "Toutes", icon: Filter },
  { key: "general", label: "Général", icon: Star },
  { key: "jeunes", label: "Jeunes", icon: Users },
  { key: "culte", label: "Culte", icon: Church },
  { key: "convention", label: "Convention", icon: BookOpen },
];

export default function EventsArchivesPage() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);

  const { data: archivedEvents, isLoading } = trpc.announcements.archives.useQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
  });

  const groupedByMonth = useMemo(() => {
    if (!archivedEvents) return {};

    const groups: Record<string, typeof archivedEvents> = {};
    archivedEvents.forEach((event: any) => {
      const dateStr = event.eventDate;
      if (dateStr) {
        const d = new Date(dateStr);
        const monthKey = format(d, "yyyy-MM");
        const monthLabel = format(d, "MMMM yyyy", { locale: fr });
        if (!groups[monthKey]) groups[monthKey] = [];
        groups[monthKey].push(event);
      } else {
        if (!groups["unknown"]) groups["unknown"] = [];
        groups["unknown"].push(event);
      }
    });

    return groups;
  }, [archivedEvents]);

  const sortedMonths = useMemo(() => {
    return Object.keys(groupedByMonth)
      .filter((k) => k !== "unknown")
      .sort()
      .reverse();
  }, [groupedByMonth]);

  const displayMonths = useMemo(() => {
    const start = currentMonthOffset * 3;
    return sortedMonths.slice(start, start + 3);
  }, [sortedMonths, currentMonthOffset]);

  const hasPrev = currentMonthOffset > 0;
  const hasNext = (currentMonthOffset + 1) * 3 < sortedMonths.length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border">
        <div className="container py-8 md:py-12">
          <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
            <Link href="/evenements">
              <ArrowLeft className="w-4 h-4 mr-1" />
              {t("common.back") ?? "Retour"}
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
              <Archive className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("events.archives") ?? "Archives"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
            {t("events.archivesTitle") ?? "Archives des Événements"}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("events.archivesDescription") ?? "Retrouvez tous les événements passés, organisés par mois."}
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className="gap-1.5"
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-muted-foreground">{t("common.loading") ?? "Chargement..."}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sortedMonths.length === 0 && (
          <div className="text-center py-16">
            <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold">{t("events.noArchives") ?? "Aucune archive"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("events.noArchivesDesc") ?? "Il n'y a pas d'événements archivés pour le moment."}
            </p>
          </div>
        )}

        {/* Month navigation */}
        {sortedMonths.length > 3 && (
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonthOffset((p) => p - 1)}
              disabled={!hasPrev}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Mois précédents
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentMonthOffset * 3 + 1}-{Math.min((currentMonthOffset + 1) * 3, sortedMonths.length)} sur {sortedMonths.length} mois
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonthOffset((p) => p + 1)}
              disabled={!hasNext}
            >
              Mois suivants
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Archives by month */}
        {!isLoading && displayMonths.map((monthKey) => {
          const events = groupedByMonth[monthKey];
          const monthLabel = format(new Date(monthKey + "-01"), "MMMM yyyy", { locale: fr });
          return (
            <div key={monthKey} className="mb-10">
              <div className="flex items-center gap-3 mb-4 pb-2 border-b">
                <Calendar className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-serif font-bold capitalize">{monthLabel}</h2>
                <Badge variant="outline" className="text-xs">{events.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event: any) => (
                  <div key={event.id} className="relative opacity-80 hover:opacity-100 transition-opacity">
                    <Badge className="absolute top-3 left-3 z-10 bg-muted text-muted-foreground border">
                      <Archive className="w-3 h-3 mr-1" />
                      Archivé
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
            </div>
          );
        })}

        {/* Unknown date events */}
        {!isLoading && groupedByMonth["unknown"] && groupedByMonth["unknown"].length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4 pb-2 border-b">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-serif font-bold">Sans date</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupedByMonth["unknown"].map((event: any) => (
                <div key={event.id} className="relative opacity-80 hover:opacity-100 transition-opacity">
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
          </div>
        )}
      </div>
    </div>
  );
}
