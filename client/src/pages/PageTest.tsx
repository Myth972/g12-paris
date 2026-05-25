import { Church, BookOpen, Mic2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import HeroSlider, { type Slide } from "@/components/HeroSlider";
import AnnouncementCard, { type Announcement } from "@/components/AnnouncementCard";
import { Link } from "wouter";

const heroSlides: Slide[] = [
  {
    imageUrl: "/logo.png",
    title: "Bienvenue à G12 Paris Médias",
    subtitle: "Votre source d'information spirituelle et de ressources chrétiennes à Paris.",
    ctaLabel: "Découvrir",
    ctaHref: "/publication-du-jour",
  },
  {
    imageUrl: "/premium_bible.png",
    title: "Culte en ligne chaque dimanche",
    subtitle: "Rejoignez-nous pour un moment de louange et d'enseignement depuis chez vous.",
    ctaLabel: "Voir le culte",
    ctaHref: "/culte-en-ligne",
  },
  {
    imageUrl: "/logo-g12-editions.png",
    title: "Explorez notre bibliothèque",
    subtitle: "Livres, études bibliques, ressources audio et vidéo pour grandir dans la foi.",
    ctaLabel: "Explorer",
    ctaHref: "/bibliotheque",
  },
];

const sundayCult: Announcement = {
  imageUrl: "/logo.png",
  title: "Culte du Dimanche — La foi qui transforme",
  description:
    "Rejoignez-nous ce dimanche à 10h pour un culte puissant sur le thème 'Une foi qui transforme les montagnes'. Prédication par le Pasteur Marc.",
  date: "Dimanche 31 Mai 2026 • 10h00",
  location: "Paris 12e & En ligne",
  badge: "Ce dimanche",
  ctaLabel: "Participer",
  ctaHref: "/culte-en-ligne",
  variant: "poster",
};

const upcomingConvention: Announcement = {
  imageUrl: "/premium_bible.png",
  title: "Convention Annuelle — Réveil 2026",
  description:
    "3 jours d'enseignement, de louange et de prière. Ne manquez pas cet événement spirituel majeur !",
  date: "12–14 Juin 2026",
  location: "Paris Expo Porte de Versailles",
  badge: "À venir",
  ctaLabel: "Je m'inscris",
  ctaHref: "#",
  variant: "poster",
};

const bookOfTheMonth: Announcement = {
  imageUrl: "/logo-g12-editions.png",
  title: "Le Livre du Mois — 'La Puissance du Silence'",
  description:
    "Découvrez comment le silence et la méditation transforment votre relation avec Dieu. Par le Pasteur Jean-Marc.",
  badge: "Livre du mois",
  ctaLabel: "Commander",
  ctaHref: "#",
  variant: "poster",
};

const currentEvents: Announcement[] = [
  {
    imageUrl: "/logo.png",
    title: "Groupe de Jeunes — Soirée Louange",
    description:
      "Tous les vendredis à 19h, rejoignez les jeunes pour une soirée de louange et de partage.",
    date: "Tous les vendredis • 19h00",
    location: "Salle polyvalente",
    badge: "Hebdomadaire",
    ctaLabel: "Plus d'infos",
    ctaHref: "#",
  },
  {
    imageUrl: "/premium_bible.png",
    title: "Atelier de Prière — Réveille-toi !",
    description:
      "Un atelier intensif pour apprendre à prier avec puissance et persévérance.",
    date: "Samedi 6 Juin • 14h–17h",
    badge: "Atelier",
    ctaLabel: "S'inscrire",
    ctaHref: "#",
  },
  {
    imageUrl: "/logo-g12-editions.png",
    title: "Formation des Leaders",
    description:
      "Programme de formation pour les futurs leaders de l'église. Modules 1 à 4.",
    date: "Session en cours",
    badge: "Formation",
    ctaLabel: "En savoir plus",
    ctaHref: "#",
  },
  {
    imageUrl: "/logo.png",
    title: "Camp de Jeunes Été 2026",
    description:
      "Inscriptions ouvertes pour le camp d'été. Une semaine de communion et d'enseignement.",
    date: "20–27 Juillet 2026",
    location: "Centre spirituel des Alpes",
    badge: "Inscriptions",
    ctaLabel: "Je m'inscris",
    ctaHref: "#",
  },
];

export default function PageTest() {
  return (
    <div className="min-h-screen">
      {/* MetaSlider Hero */}
      <section className="container pt-2 sm:pt-3 pb-1 sm:pb-2">
        <HeroSlider slides={heroSlides} />
      </section>

      {/* Annonces / Bandes d'information */}
      <section className="container py-3 sm:py-4">
        <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
          <div className="w-4 h-0.5 bg-primary rounded-full" />
          <h2 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.15em] text-primary font-sans">
            Annonces & Événements
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {/* Culte du dimanche */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Church className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Culte du Dimanche</span>
            </div>
            <AnnouncementCard announcement={sundayCult} />
          </div>

          {/* Convention à venir */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Mic2 className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Convention</span>
            </div>
            <AnnouncementCard announcement={upcomingConvention} />
          </div>

          {/* Livre du mois */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <BookOpen className="w-3 h-3 text-primary" />
              <span className="text-[11px] font-semibold text-foreground">Livre du Mois</span>
            </div>
            <AnnouncementCard announcement={bookOfTheMonth} />
          </div>
        </div>
      </section>

      {/* Événements en cours */}
      <section className="container py-3 sm:py-4 border-t border-border/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2 sm:mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-primary rounded-full" />
            <h2 className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.15em] text-primary font-sans">
              Événements en cours
            </h2>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary text-[8px] font-bold tracking-wider self-start sm:self-auto px-1.5 py-0">
            {currentEvents.length} événements
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
          {currentEvents.map((event, i) => (
            <AnnouncementCard key={i} announcement={event} />
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
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
