import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TiltCard from "@/components/TiltCard";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  ChevronRight,
  Clock,
  List,
  Play,
  Share2,
  User,
} from "lucide-react";
import { useLocation } from "wouter";

/* ============================================================
   PAGE DE DÉMONSTRATION — Design clair & épuré des pages articles
   Les 6 propositions sont présentées avec des données factices.
   L'effet 3D TiltCard est conservé sur chaque carte.
   ============================================================ */

interface DemoArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  authorName: string;
  date: string;
  readingTime: string;
  youtubeUrl: string | null;
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    actualité: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    culte: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    enseignement: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    témoignage: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    musique: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    prière: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    événement: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    annonce: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  };
  return (
    colors[category.toLowerCase()] ||
    "bg-primary/10 text-primary"
  );
}

function PlaceholderCover({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-100 to-sky-100 dark:from-indigo-950 dark:via-slate-900 dark:to-sky-950">
      <span className="text-5xl font-serif text-indigo-300/70 dark:text-indigo-400/40 select-none">
        {label}
      </span>
    </div>
  );
}

/* ---------- Proposition 2 : carte épurée (TiltCard conservé) ---------- */
function DemoArticleCard({ article }: { article: DemoArticle }) {
  return (
    <TiltCard
      as="article"
      maxTilt={8}
      scale={1.02}
      shine
      className="group relative rounded-2xl overflow-hidden border border-border/60 hover:border-border hover:shadow-md transition-all duration-300 bg-card touch-manipulation"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <PlaceholderCover label="G12" />

        {/* Indicateur vidéo */}
        {article.youtubeUrl && (
          <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-lg z-10">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        )}

        {/* Pastille catégorie (sans bordure, sobre) */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${getCategoryColor(article.category)}`}
          >
            {article.category}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-5">
        <h3 className="font-serif font-bold leading-snug text-card-foreground group-hover:text-primary transition-colors line-clamp-2 text-base">
          {article.title}
        </h3>

        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words">
          {article.excerpt}
        </p>

        {/* Méta avec séparateurs · */}
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {article.date}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {article.readingTime}
          </span>
          <span>·</span>
          <span className="truncate max-w-[100px]">{article.authorName}</span>
        </div>

        {/* CTA toujours visible (mobile friendly) */}
        <div className="mt-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Lire l'article
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </TiltCard>
  );
}

/* ---------- Proposition 4 : table des matières ---------- */
interface TocSection {
  id: string;
  title: string;
}

const DEMO_SECTIONS: TocSection[] = [
  { id: "demo-intro", title: "Pourquoi prier ?" },
  { id: "demo-transforme", title: "Une prière qui transforme" },
  { id: "demo-obstacles", title: "Surmonter les obstacles" },
  { id: "demo-fruits", title: "Les fruits de la prière" },
  { id: "demo-conclusion", title: "Conclusion" },
];

function DemoToc() {
  return (
    <nav
      aria-label="Sommaire"
      className="hidden lg:block sticky top-24 self-start"
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        <List className="w-3.5 h-3.5" />
        Sommaire
      </p>
      <ul className="space-y-2.5 text-sm">
        {DEMO_SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-muted-foreground hover:text-primary transition-colors leading-snug"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Étiquette de proposition (repère pédagogique) ---------- */
function ProposalLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-primary bg-primary/5 border border-primary/10 rounded-full px-3 py-1">
        {children}
      </span>
    </div>
  );
}

/* ---------- Données factices ---------- */
const HERO_ARTICLE = {
  title: "La puissance de la prière dans la vie quotidienne",
  excerpt:
    "La prière n'est pas un rituel, mais une rencontre. Découvrez comment la prière peut transformer votre journée, vos décisions et votre cœur, pas à pas.",
  category: "prière",
  authorName: "Pasteur Jean-Marc",
  date: "10 août 2026",
  readingTime: "8 min de lecture",
};

const RELATED_ARTICLES: DemoArticle[] = [
  {
    id: 1,
    title: "Méditer sur la Parole chaque matin",
    slug: "meditation-parole",
    excerpt:
      "Cinq minutes de méditation quotidienne peuvent changer le cours de votre journée.",
    category: "enseignement",
    authorName: "Sœur Élise",
    date: "8 août 2026",
    readingTime: "5 min",
    youtubeUrl: null,
  },
  {
    id: 2,
    title: "Le culte de dimanche : un moment de grâce",
    slug: "culte-grace",
    excerpt:
      "Retour sur un moment de louange et d'adoration qui a marqué la communauté.",
    category: "culte",
    authorName: "Frère David",
    date: "6 août 2026",
    readingTime: "7 min",
    youtubeUrl: "https://www.youtube.com/watch?v=demo",
  },
  {
    id: 3,
    title: "Témoignage : guéri au milieu de l'assemblée",
    slug: "temoignage-gueri",
    excerpt:
      "Un témoignage de foi et de restauration qui redonne espoir à ceux qui souffrent.",
    category: "témoignage",
    authorName: "Maman Roseline",
    date: "3 août 2026",
    readingTime: "6 min",
    youtubeUrl: null,
  },
];

/* ---------- Page principale ---------- */
export default function ArticleDesignDemo() {
  const [, setLocation] = useLocation();

  return (
    <article className="pb-16">
      <ReadingProgressBar />
      <ScrollToTopButton />

      {/* Styles typographiques premium (scopés à la démo) */}
      <style>{`
        .demo-prose {
          font-size: clamp(1rem, 1.075rem + 0.2vw, 1.2rem);
          line-height: 1.8;
          color: var(--foreground);
          max-width: 42rem;
          margin-left: auto;
          margin-right: auto;
        }
        .demo-prose > p:first-child::first-letter {
          float: left;
          font-size: 3rem;
          font-weight: 700;
          line-height: 1;
          padding-right: 0.5rem;
          margin-top: 0.15rem;
          color: var(--muted-foreground);
          font-family: Georgia, "Times New Roman", serif;
        }
        .demo-prose p {
          margin-bottom: 1.35em;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .demo-prose h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2.5em;
          margin-bottom: 0.75em;
          letter-spacing: -0.01em;
          scroll-margin-top: 6rem;
        }
        .demo-prose blockquote {
          border-left: 3px solid var(--primary);
          padding: 0.25em 1.5em;
          margin: 2em 0;
          font-style: italic;
          color: var(--muted-foreground);
        }
        .demo-prose blockquote p {
          margin-bottom: 0;
        }
        .demo-prose ul {
          margin: 1.25em 0;
          padding-left: 1.5em;
        }
        .demo-prose li {
          margin-bottom: 0.4em;
          line-height: 1.7;
        }
        .demo-prose li::marker {
          color: var(--primary);
        }
      `}</style>

      {/* Bandeau de démonstration */}
      <div className="container max-w-5xl mx-auto pt-6 px-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour
        </Button>
        <span className="text-[11px] font-medium text-muted-foreground">
          Page de démonstration — design épuré
        </span>
      </div>

      {/* ---------- Proposition 1 : héros épuré ---------- */}
      <div>
        <header className="pt-10 pb-8 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <ProposalLabel>Proposition 1 · Héros épuré</ProposalLabel>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-widest ${getCategoryColor(HERO_ARTICLE.category)}`}
            >
              {HERO_ARTICLE.category}
            </span>

            <h1 className="mt-5 font-serif font-bold leading-tight text-[clamp(1.75rem,4vw,3.5rem)] text-foreground">
              {HERO_ARTICLE.title}
            </h1>

            {HERO_ARTICLE.excerpt && (
              <p className="mt-5 text-base md:text-lg text-muted-foreground leading-relaxed max-w-prose mx-auto">
                {HERO_ARTICLE.excerpt}
              </p>
            )}

            {/* Méta centrée avec points · */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                {HERO_ARTICLE.authorName}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {HERO_ARTICLE.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {HERO_ARTICLE.readingTime}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="ml-2 rounded-full text-muted-foreground"
              >
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Partager
              </Button>
            </div>
          </div>
        </header>

        {/* Image de couverture sobre (sans overlay dégradé) */}
        <div className="container max-w-5xl mx-auto px-4">
          <div className="rounded-2xl overflow-hidden shadow-sm aspect-[21/9] bg-gradient-to-br from-indigo-100 via-slate-100 to-sky-100 dark:from-indigo-950 dark:via-slate-900 dark:to-sky-950 flex items-center justify-center">
            <span className="text-6xl font-serif text-indigo-300/70 dark:text-indigo-400/40 select-none">
              ✝
            </span>
          </div>
        </div>
      </div>

      {/* ---------- Proposition 2 : cartes épurées (TiltCard conservé) ---------- */}
      <section className="container max-w-5xl mx-auto mt-16 px-4">
        <ProposalLabel>Proposition 2 · Cartes épurées (TiltCard conservé)</ProposalLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RELATED_ARTICLES.map((article) => (
            <DemoArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* ---------- Propositions 3 & 4 : typographie premium + sommaire ---------- */}
      <section className="container max-w-5xl mx-auto mt-16 px-4">
        <ProposalLabel>Propositions 3 &amp; 4 · Typographie premium + Sommaire</ProposalLabel>
        <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
          <DemoToc />

          <div className="demo-prose break-words">
            <h2 id="demo-intro">Pourquoi prier ?</h2>
            <p>
              La prière est un dialogue, pas une formalité. Elle nous permet de
              déposer nos fardeaux, de remercier pour les grâces reçues et de
              demander la sagesse pour chaque décision. Dans l'agitation de nos
              journées, elle devient une pause nécessaire pour retrouver le
              silence et la présence de Dieu.
            </p>
            <p>
              Prier régulièrement, c'est apprendre à écouter autant qu'à parler.
              C'est aussi accepter que nos plans puissent être ajustés par une
              volonté plus grande, avec une confiance paisible.
            </p>

            <h2 id="demo-transforme">Une prière qui transforme</h2>
            <p>
              Lorsque nous prions avec sincérité, notre regard change. Les
              inquiétudes perdent de leur poids, les rancœurs s'adoucissent et
              les priorités se réordonnent. La transformation ne vient pas
              toujours instantanément, mais elle est réelle et durable.
            </p>
            <blockquote>
              <p>
                « Ne vous inquiétez de rien ; mais en toute chose faites
                connaître vos besoins à Dieu par des prières et des
                supplications. »
              </p>
            </blockquote>
            <p>
              Cette promesse nous invite à confier nos besoins avec une
              assurance tranquille, sachant que celui qui écoute est aussi
              celui qui pourvoit.
            </p>

            <h2 id="demo-obstacles">Surmonter les obstacles</h2>
            <p>
              Il arrive que la prière semble difficile : le manque de temps, la
              distraction, le doute. Voici quelques pistes simples :
            </p>
            <ul>
              <li>Fixer un moment précis, même court, chaque jour.</li>
              <li>Écrire ses prières pour rester concentré.</li>
              <li>Prier à voix haute ou en musique.</li>
              <li>Commencer par une simple action de grâce.</li>
            </ul>

            <h2 id="demo-fruits">Les fruits de la prière</h2>
            <p>
              Au fil des semaines, on constate des changements concrets : une
              paix intérieure plus stable, des relations apaisées, des choix
              plus clairs. La prière ne supprime pas les difficultés, mais elle
              donne la force de les traverser.
            </p>

            <h2 id="demo-conclusion">Conclusion</h2>
            <p>
              La prière est un chemin, pas une performance. Chaque mot compte,
              chaque silence aussi. En vous y engageant avec constance, vous
              découvrirez une présence qui accompagne chaque pas de votre vie.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Proposition 5 : articles similaires + fin épurée ---------- */}
      <section className="container max-w-5xl mx-auto mt-20 px-4">
        <ProposalLabel>Proposition 5 · Articles similaires &amp; fin d'article</ProposalLabel>
        <div className="border-t border-border/60 pt-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-serif font-bold text-foreground">
              Articles similaires
            </h2>
            <span className="text-xs font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer">
              Voir tout
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {RELATED_ARTICLES.map((article) => (
              <DemoArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      </section>

      {/* Fin d'article : navigation discrète */}
      <div className="container max-w-5xl mx-auto mt-12 px-4">
        <div className="border-t border-border/60 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Tous les articles
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Share2 className="w-4 h-4 mr-1" />
            Partager
          </Button>
        </div>
      </div>
    </article>
  );
}