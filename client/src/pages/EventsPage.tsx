import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Filter, Church, Users, BookOpen, Star, Archive } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/components/Reveal";
import AnnouncementCard, { type Announcement } from "@/components/AnnouncementCard";
import ConventionCountdown from "@/components/ConventionCountdown";
import { downloadIcs } from "@/lib/conventionCalendar";
import { CalendarPlus } from "lucide-react";
import { useSeo } from "@/lib/seo";
import { eventJsonLd } from "@/lib/structuredData";

/** Nom de fichier .ics lisible dérivé du titre de l'événement */
function icsFilename(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  return `evenement-${slug || "g12"}.ics`;
}

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

  const allEvents: (Announcement & { category?: string; id?: number })[] = useMemo(
    () => [
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
    ],
    [announcements, flashEvents]
  );

  const filteredEvents = activeCategory === "all"
    ? allEvents
    : allEvents.filter((e: any) => e.category === activeCategory);

  const eventStructuredData = useMemo(
    () =>
      allEvents
        .filter((event) => event.date)
        .map((event) =>
          eventJsonLd({
            name: event.title,
            description: event.description || undefined,
            startDate: event.date,
            location: event.location,
            image: event.imageUrl,
            url: "/evenements",
          })
        ),
    [allEvents]
  );

  useSeo({
    title: "Événements",
    description:
      "Conférences, conventions et rencontres G12 Paris : toutes les dates à venir.",
    url: "/evenements",
    jsonLd: eventStructuredData.length > 0 ? eventStructuredData : undefined,
  });

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-border/50">
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
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

        {/* Events grid — apparition en cascade */}
        {!isLoading && filteredEvents.length > 0 && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            {filteredEvents.map((event: any, idx: number) => {
              const catInfo = getCategoryInfo(event.category ?? "general");
              const Icon = catInfo.icon;
              // Compte à rebours + .ics pour les événements à venir
              const start = event.date ? new Date(event.date) : null;
              const isUpcoming = !!start && Number.isFinite(start.getTime()) && start.getTime() > Date.now();
              const end = start ? new Date(start.getTime() + 4 * 3_600_000) : null; // fenêtre « en cours » de 4 h
              return (
                <motion.div key={event.id ?? idx} variants={staggerItem} className="relative group">
                  <Badge className={`absolute top-3 left-3 z-10 ${catInfo.color} text-white border-0`}>
                    <Icon className="w-3 h-3 mr-1" />
                    {catInfo.label}
                  </Badge>
                  <AnnouncementCard announcement={event} />
                  {isUpcoming && start && end && (
                    <div className="mt-2 flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/80 backdrop-blur px-3 py-3">
                      <ConventionCountdown
                        startISO={start.toISOString()}
                        endISO={end.toISOString()}
                        compact
                        liveLabel="C'est maintenant !"
                        className="w-full"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-full justify-center text-xs gap-1.5"
                        onClick={() =>
                          downloadIcs(
                            {
                              title: event.title,
                              description: event.description || undefined,
                              location: event.location || undefined,
                              url: window.location.href,
                              start,
                              end: end,
                            },
                            icsFilename(event.title ?? "event-g12")
                          )
                        }
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        Ajouter au calendrier
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
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
