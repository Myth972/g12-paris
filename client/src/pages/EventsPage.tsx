import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Filter, Loader2, Church, Users, BookOpen, Star, Archive } from "lucide-react";
import AnnouncementCard, { type Announcement } from "@/components/AnnouncementCard";

const CATEGORIES = [
  { key: "all", label: "Tous", icon: Filter, color: "bg-gray-500" },
  { key: "general", label: "Général", icon: Star, color: "bg-blue-500" },
  { key: "jeunes", label: "Jeunes", icon: Users, color: "bg-violet-500" },
  { key: "culte", label: "Culte", icon: Church, color: "bg-emerald-500" },
  { key: "convention", label: "Convention", icon: BookOpen, color: "bg-amber-500" },
];

export default function EventsPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState("all");

  const { data: announcements, isLoading: loadingAnnouncements } = trpc.announcements.list.useQuery({ type: "announcement" });
  const { data: flashEvents, isLoading: loadingFlash } = trpc.announcements.list.useQuery({ type: "flash-event" });

  const isLoading = loadingAnnouncements || loadingFlash;

  const allEvents: (Announcement & { category?: string; id?: number })[] = [
    ...(announcements ?? []).map((a: any) => ({
      imageUrl: a.mediaUrl,
      title: a.title,
      description: a.description,
      date: a.eventDate,
      location: a.location,
      badge: a.badge,
      ctaLabel: a.ctaLabel,
      ctaHref: a.ctaHref,
      variant: (a.variant ?? "poster") as "poster" | "default" | "compact",
      textColor: a.textColor,
      titleColor: a.titleColor,
      category: a.category,
      id: a.id,
    })),
    ...(flashEvents ?? []).map((a: any) => ({
      imageUrl: a.mediaUrl,
      title: a.title,
      description: a.description,
      date: a.eventDate,
      location: a.location,
      badge: a.badge,
      ctaLabel: a.ctaLabel,
      ctaHref: a.ctaHref,
      variant: "default" as const,
      textColor: a.textColor,
      titleColor: a.titleColor,
      category: a.category,
      id: a.id,
    })),
  ];

  const filteredEvents = activeCategory === "all"
    ? allEvents
    : allEvents.filter((e: any) => e.category === activeCategory);

  const getCategoryInfo = (key: string) => CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border">
        <div className="container py-8 md:py-12">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {t("nav.events") ?? "Événements"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
            {t("events.title") ?? "Nos Événements"}
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {t("events.description") ?? "Découvrez tous nos événements à venir : cultes, conventions, activités jeunes et plus encore."}
          </p>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/evenements/jeunes">
                <Users className="w-4 h-4 mr-1" />
                {t("events.youth") ?? "Événements Jeunes"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/evenements/archives">
                <Archive className="w-4 h-4 mr-1" />
                {t("events.archives") ?? "Archives"}
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.key}
                variant={activeCategory === cat.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat.key)}
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
        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold">{t("events.empty") ?? "Aucun événement trouvé"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("events.emptyDesc") ?? "Il n'y a pas d'événements dans cette catégorie pour le moment."}
            </p>
          </div>
        )}

        {/* Events grid */}
        {!isLoading && filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event: any, idx: number) => {
              const catInfo = getCategoryInfo(event.category ?? "general");
              const Icon = catInfo.icon;
              return (
                <div key={event.id ?? idx} className="relative group">
                  <Badge className={`absolute top-3 left-3 z-10 ${catInfo.color} text-white border-0`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {catInfo.label}
                  </Badge>
                  <AnnouncementCard announcement={event} />
                </div>
              );
            })}
          </div>
        )}

        {/* Flash events section */}
        {!isLoading && flashEvents && flashEvents.length > 0 && activeCategory === "all" && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
                <span className="text-lg">⚡</span>
                {t("events.flashEvents") ?? "Événements Flash"}
              </h2>
              <Badge variant="outline">{flashEvents.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {flashEvents.map((event: any) => (
                <AnnouncementCard
                  key={event.id}
                  announcement={{
                    imageUrl: event.mediaUrl,
                    title: event.title,
                    description: event.description,
                    date: event.eventDate,
                    location: event.location,
                    badge: event.badge,
                    ctaLabel: event.ctaLabel,
                    ctaHref: event.ctaHref,
                    variant: "default",
                    textColor: event.textColor,
                    titleColor: event.titleColor,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
