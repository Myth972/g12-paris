import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import HeroSlider, { type Slide } from "@/components/HeroSlider";
import AnnouncementCard, { type Announcement } from "@/components/AnnouncementCard";
import { Reveal, staggerContainer, staggerItem } from "@/components/Reveal";
import FloatingParticles from "@/components/FloatingParticles";
import TiltCard from "@/components/TiltCard";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { motion } from "framer-motion";
import { Newspaper, ChevronRight, Church, BookOpen, Mic2, Calendar, Users, FileText, Image, Clock } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import { useVisualEnabled } from "@/hooks/useVisualSetting";
import { useState, useMemo, useEffect } from "react";

const announcementIcons = [Church, Mic2, BookOpen];

export default function Home() {
  const [page, setPage] = useState(0);
  const [heroOffset, setHeroOffset] = useState(0);
  const limit = 12;
  const offset = useMemo(() => page * limit, [page]);

const { data, isLoading } = trpc.articles.list.useQuery({ limit, offset, category: "actualité" });
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const { data: homeContent } = trpc.pageContent.featuredHome.useQuery();
  const { data: announcementsData } = trpc.announcements.list.useQuery({ type: "announcement" });
  const { data: flashEventsData } = trpc.announcements.list.useQuery({ type: "flash-event" });

  const articles = data?.items ?? [];
  const whatsappSlides: Slide[] = (homeContent ?? [])
    .filter((item: any) => item.mediaUrl)
    .slice(0, 5)
    .map((item: any) => ({
      imageUrl: item.mediaUrl,
      title: item.title || "G12 Paris",
      subtitle: item.description || undefined,
      ctaLabel: item.ctaLabel || undefined,
      ctaHref: item.ctaHref || (item.id ? `/?whatsapp=${item.id}` : undefined),
      textColor: item.textColor || undefined,
      titleColor: item.titleColor || undefined,
    }));
  const announcements: Announcement[] = (announcementsData ?? []).map((item: any) => ({
    imageUrl: item.mediaUrl,
    title: item.title,
    description: item.description || "",
    date: item.eventDate || undefined,
    location: item.location || undefined,
    badge: item.badge || undefined,
    ctaLabel: item.ctaLabel || undefined,
    ctaHref: item.ctaHref || undefined,
    variant: item.variant || "poster",
    textColor: item.textColor || undefined,
    titleColor: item.titleColor || undefined,
  }));
  const flashEvents: Announcement[] = (flashEventsData ?? []).map((item: any) => ({
    imageUrl: item.mediaUrl,
    title: item.title,
    description: item.description || "",
    date: item.eventDate || undefined,
    location: item.location || undefined,
    badge: item.badge || undefined,
    ctaLabel: item.ctaLabel || undefined,
    ctaHref: item.ctaHref || undefined,
    variant: "default",
    textColor: item.textColor || undefined,
  }));
  const total = data?.total ?? 0;
  const hasMore = offset + limit < total;
  const heroBgUrl = settingsQuery.data?.homeHeroBgUrl as string | undefined;
  const heroOpacityRaw = settingsQuery.data?.homeHeroBgOpacity as
    | string
    | undefined;
  const heroOpacityPercent = Math.max(
    0,
    Math.min(60, Number(heroOpacityRaw ?? 18))
  );
  const heroOpacity = heroOpacityPercent / 100;

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY || 0;
      const offset = y * 0.3;
      setHeroOffset(Math.max(-60, Math.min(180, offset)));
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Floating particles background */}
      <FloatingParticles
        className="fixed inset-0 w-full h-full z-0"
        particleCount={40}
        speed={0.25}
        shape="star"
        color="#FCD34D"
      />

      {/* Hero section */}
      <Reveal variant="fadeDown" duration={0.7}>
      <section className="relative bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-[180px] min-h-[420px] md:min-h-[520px] overflow-hidden flex items-center">
        {heroBgUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage: `url(${heroBgUrl})`,
              opacity: heroOpacity,
              backgroundAttachment: "scroll",
              backgroundPosition: `center calc(50% + ${heroOffset + 40}px)`,
              backgroundSize: "85%",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-transparent dark:from-background/95 dark:via-background/80 pointer-events-none" />
        <div className="container relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-primary font-sans">
                Dernières nouvelles
              </span>
            </div>
            <PageTitleEditor
              pageKey="home"
              defaultH1={"L'actualité qui compte,\nracontée avec rigueur."}
              defaultH2=""
              h1ClassName="text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-foreground leading-tight"
            />
            <PageTextEditor
              pageKey="home"
              textKey="hero"
              defaultText="Restez informé avec les dernières nouvelles de Paris et d'ailleurs. Articles, reportages et vidéos au quotidien."
              className="mt-3 sm:mt-4 text-foreground/70 dark:text-foreground/80 text-sm sm:text-base leading-relaxed max-w-lg"
            />
          </div>
        </div>
      </section>
      </Reveal>

      {/* MetaSlider — informations WhatsApp */}
      {whatsappSlides.length > 0 && (
        <Reveal variant="fadeUp" delay={0.15}>
        <section className="container pt-2 sm:pt-3 pb-1 sm:pb-2">
          <HeroSlider slides={whatsappSlides} />
        </section>
        </Reveal>
      )}

      {/* Annonces — grille 3 colonnes */}
      <Reveal variant="fadeUp" delay={0.1}>
      <section className="container py-3 sm:py-4">
        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
          <div className="w-4 h-0.5 bg-primary rounded-full" />
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.15em] text-primary font-sans">
            Annonces & Événements
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {announcements.map((item, i) => {
            const Icon = announcementIcons[i % announcementIcons.length];
            return (
              <div key={i}>
                <div className="flex items-center gap-1 mb-1.5">
                  <Icon className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">
                    {item.badge || "Annonce"}
                  </span>
                </div>
                <TiltCard maxTilt={8} scale={1.02} shine={false}>
                  <AnnouncementCard announcement={item} />
                </TiltCard>
              </div>
            );
          })}
        </div>
      </section>
      </Reveal>

      {/* Événements flash */}
      <Reveal variant="fadeUp" delay={0.15}>
      <section className="container py-3 sm:py-4 border-t border-border/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.15em] text-primary font-sans">
              Événements flash
            </span>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-bold tracking-wider self-start sm:self-auto px-1.5 py-0">
            {flashEvents.length} événement{flashEvents.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {flashEvents.map((event, i) => (
            <TiltCard key={event.title + i} maxTilt={8} scale={1.02} shine={false}>
              <AnnouncementCard announcement={event} />
            </TiltCard>
          ))}
        </div>

        <div className="flex justify-center mt-4 sm:mt-5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full border-primary/30 text-primary hover:bg-primary/5 gap-1 text-[10px] sm:text-xs h-7 sm:h-8 px-3"
          >
            <Link href="/">
              Voir tous les événements
              <ChevronRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </section>
      </Reveal>

      {/* Stats section */}
      {useVisualEnabled("visuals.stats.enabled") && (
      <Reveal variant="fadeUp" delay={0.1}>
      <section className="container py-16 border-t border-border/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <AnimatedCounter to={data?.total ?? 0} suffix="+" label="Articles publiés" />
          <AnimatedCounter to={850} suffix="+" label="Abonnés newsletter" />
          <AnimatedCounter to={5} suffix="+" label="Années d'existence" />
          <AnimatedCounter to={120} suffix="+" label="Vidéos & galeries" />
        </div>
      </section>
      </Reveal>
      )}

      {/* Articles grid */}
      <Reveal variant="fadeUp" delay={0.1}>
      <section className="container pb-16 border-t border-border/30 pt-16">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-border/50"
              >
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Newspaper className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-serif font-semibold text-foreground mb-2">
              Aucun article pour le moment
            </h3>
            <p className="text-sm text-muted-foreground">
              Les articles apparaîtront ici dès leur publication.
            </p>
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {articles.map((article: any, index: number) => (
                <motion.div key={article.id} variants={staggerItem}>
                  <ArticleCard
                    article={article}
                    featured={index === 0 && page === 0}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {total > limit && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  Page {page + 1} sur {Math.ceil(total / limit)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!hasMore}
                  onClick={() => setPage(p => p + 1)}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </section>
      </Reveal>
    </div>
  );
}
