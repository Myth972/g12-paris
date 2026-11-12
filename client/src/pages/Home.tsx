import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import ArticleCard from "@/components/ArticleCard";
import HeroSlider, { type Slide } from "@/components/HeroSlider";
import AnnouncementCard, { type Announcement } from "@/components/AnnouncementCard";
import { Reveal, staggerContainer, staggerItem } from "@/components/Reveal";
import FloatingParticles from "@/components/FloatingParticles";
import TiltCard from "@/components/TiltCard";
import BentoGrid from "@/components/BentoGrid";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import PageTitleEditor from "@/components/PageTitleEditor";
import PageTextEditor from "@/components/PageTextEditor";
import { motion } from "framer-motion";
import { Newspaper, ChevronRight, Church, BookOpen, Mic2, Calendar, Users, FileText, Image, Clock } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import AnimatedSignature from "@/components/AnimatedSignature";
import {
  useVisualEnabled,
  useVisualSetting,
} from "@/hooks/useVisualSetting";
import { normalizeImageSource, buildOptimizedUrl } from "@/lib/imageOptimize";
import { useSeo } from "@/lib/seo";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/structuredData";
import { useState, useMemo, useEffect } from "react";

const announcementIcons = [Church, Mic2, BookOpen];

/** Largeur du fond hero recodé par /api/image (borne : 32–1600). */
const HERO_BG_WIDTH = 1280;

/** Accueil : un article à la une, centré au-dessus de la grille (7 par défaut). */
const HOME_DEFAULT_COUNT = 7;
/** Bornes du réglage `home.articles.count` (Mode Éditeur → Articles). */
const HOME_MIN_COUNT = 1;
const HOME_MAX_COUNT = 12;

/** Réglage `home.articles.count` : entier borné, 7 si absent ou illisible. */
function clampArticleCount(raw: string): number {
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return HOME_DEFAULT_COUNT;
  return Math.min(HOME_MAX_COUNT, Math.max(HOME_MIN_COUNT, parsed));
}

export default function Home() {
  const [heroOffset, setHeroOffset] = useState(0);

  // Nombre d'articles réglable depuis le Mode Éditeur (`home.articles.count`).
  // Le reste du stock reste accessible via « Voir tout » et la page catégorie.
  const articlesCountSetting = useVisualSetting("home.articles.count");
  const limit = clampArticleCount(articlesCountSetting);

const { data, isLoading } = trpc.articles.list.useQuery({ limit, offset: 0, category: "actualité" });
  const settingsQuery = trpc.siteSettings.getAll.useQuery();
  const signatureEnabled = useVisualEnabled("visuals.signature.enabled");
  const signatureText = useVisualSetting("visuals.signature.text");
  const { data: homeContent } = trpc.pageContent.featuredHome.useQuery();
  const { data: announcementsData } = trpc.announcements.list.useQuery({ type: "announcement" });
  const { data: flashEventsData } = trpc.announcements.list.useQuery({ type: "flash-event" });

  const articles = data?.items ?? [];
  // Le plus récent occupe la une, les 6 suivants remplissent la grille.
  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1, limit);
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
  const heroBgUrl = settingsQuery.data?.homeHeroBgUrl as string | undefined;
  const heroOpacityRaw = settingsQuery.data?.homeHeroBgOpacity as
    | string
    | undefined;
  const heroOpacityPercent = Math.max(
    0,
    Math.min(60, Number(heroOpacityRaw ?? 18))
  );
  const heroOpacity = heroOpacityPercent / 100;

  // Fond hero optimisé (goulot LCP mesuré : PNG brut de 1,15 Mo chargé via
  // background-image). Source recodable (uploads / blob) → /api/image en
  // WebP 1280px (~100 Ko) ; sinon (Unsplash, SVG…) → URL d'origine.
  const heroSrcNormalized = heroBgUrl ? normalizeImageSource(heroBgUrl) : null;
  const heroBgUrlOptimized = heroSrcNormalized
    ? buildOptimizedUrl(heroSrcNormalized, HERO_BG_WIDTH, "webp")
    : heroBgUrl;

  // Preload du fond hero dès que les settings résolvent : un background-image
  // CSS part en priorité basse dans le scheduler Chrome (mesuré : corps servi
  // en 5+ s sous 4G malgré 91 Ko) ; le preload as=image le passe en priorité
  // haute, la peinture du div suit quasi immédiatement (même URL → cache hit).
  useEffect(() => {
    if (!heroBgUrlOptimized) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = heroBgUrlOptimized;
    link.setAttribute("fetchpriority", "high");
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [heroBgUrlOptimized]);

  const homeStructuredData = useMemo(
    () => [webSiteJsonLd(), organizationJsonLd()],
    []
  );

  useSeo({
    url: "/",
    image: (articles[0]?.coverImageUrl as string) || undefined,
    jsonLd: homeStructuredData,
  });

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
      {/* Pas de Reveal fadeDown ici : un fade de 700 ms retarde le paint du
          hero (H1 + fond) et donc le LCP ; variante "none" = wrapper neutre. */}
      <Reveal variant="none">
      <section className="relative bg-gradient-to-b from-primary/[0.03] to-transparent py-12 md:py-[180px] min-h-[420px] md:min-h-[520px] overflow-hidden flex items-center">
        {heroBgUrl && (
          <div
            className="absolute inset-0 bg-center bg-cover"
            style={{
              backgroundImage:
                heroBgUrlOptimized ? `url(${heroBgUrlOptimized})` : undefined,
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

      {/* Bento Grid moderne — En un coup d'œil */}
      <Reveal variant="fadeUp" delay={0.1}>
        <BentoGrid />
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
            <Link href="/evenements">
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
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary font-sans">
              Articles récents
            </span>
          </div>
          <Link
            href="/categorie/actualité"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Voir tout
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
            {/* Article à la une : centré, au-dessus de la grille de 6 */}
            <motion.div
              className="mx-auto w-full max-w-2xl mb-6"
              variants={staggerItem}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <ArticleCard article={featuredArticle} featured />
            </motion.div>

            {/* Grille : 6 articles (3 × 2 sur grand écran) */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              {gridArticles.map((article: any) => (
                <motion.div key={article.id} variants={staggerItem}>
                  <ArticleCard article={article} />
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
      </section>
      </Reveal>

      {/* Signature animée — activable et personnalisable dans Admin → Visuels */}
      {signatureEnabled && (
        <div className="container pb-12 flex justify-center">
          <AnimatedSignature
            className="text-primary/80"
            text={signatureText}
          />
        </div>
      )}
    </div>
  );
}
