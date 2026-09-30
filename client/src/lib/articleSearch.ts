import MiniSearch from "minisearch";

export interface ArticleSearchDoc {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  contentText: string;
  coverImageUrl: string | null;
  youtubeUrl: string | null;
  category: string;
  createdAt: string | number | Date;
}

export interface ArticleSearchResult extends ArticleSearchDoc {
  score: number;
  /** Extrait de l'article contenant le terme recherché. */
  snippet: string;
}

/**
 * Retire les accents pour que « benediction » trouve « bénédiction ».
 * Le même traitement est appliqué aux termes indexés et à la requête,
 * ce qui rend la recherche insensible aux accents et à la casse.
 */
function normalizeTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Constructeur de l'index de recherche.
 *
 * - `prefix` est essentiel en français : il permet de trouver « prière »
 *   avec « pri », « prie », « pries », ce que la concordance exacte refuse.
 * - `fuzzy: 0.2` absorbe une à deux fautes de frappe.
 * - Les accents sont neutralisés à l'indexation comme à la recherche.
 */
export function buildArticleIndex(
  docs: ArticleSearchDoc[]
): MiniSearch<ArticleSearchDoc> {
  const miniSearch = new MiniSearch<ArticleSearchDoc>({
    fields: ["title", "excerpt", "contentText", "category"],
    storeFields: [
      "id",
      "title",
      "slug",
      "excerpt",
      "contentText",
      "coverImageUrl",
      "youtubeUrl",
      "category",
      "createdAt",
    ],
    processTerm: normalizeTerm,
    searchOptions: {
      boost: { title: 5, excerpt: 3, category: 2 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: "OR",
    },
  });

  if (docs.length > 0) miniSearch.addAll(docs);
  return miniSearch;
}

const SNIPPET_RADIUS = 110;

/**
 * Construit un extrait autour de la première occurrence du terme recherché
 * dans le texte de l'article, pour donner du contexte au visiteur.
 */
function buildSnippet(doc: ArticleSearchDoc, rawQuery: string): string {
  const text = doc.contentText || doc.excerpt || "";
  if (text.length <= SNIPPET_RADIUS * 2) return text;

  const needle = normalizeTerm(rawQuery).trim();
  const haystack = normalizeTerm(text);

  // Recherche le premier mot significatif de la requête, le plus long en premier.
  const terms = needle
    .split(/\s+/)
    .filter(t => t.length >= 3)
    .sort((a, b) => b.length - a.length);

  let index = -1;
  for (const term of terms) {
    index = haystack.indexOf(term);
    if (index !== -1) break;
  }

  if (index === -1) return text.slice(0, SNIPPET_RADIUS * 2).trim() + "…";

  const start = Math.max(0, index - SNIPPET_RADIUS);
  const end = Math.min(text.length, index + SNIPPET_RADIUS);
  const snippet = text.slice(start, end).trim();

  return (start > 0 ? "…" : "") + snippet + (end < text.length ? "…" : "");
}

export function searchArticles(
  index: MiniSearch<ArticleSearchDoc>,
  query: string,
  limit = 8
): ArticleSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed || index.documentCount === 0) return [];

  // storeFields est configuré : chaque hit porte déjà les champs du document.
  return index
    .search(trimmed)
    .slice(0, limit)
    .map(hit => {
      const doc = hit as unknown as ArticleSearchDoc;
      return {
        id: doc.id,
        title: doc.title,
        slug: doc.slug,
        excerpt: doc.excerpt,
        contentText: doc.contentText,
        coverImageUrl: doc.coverImageUrl,
        youtubeUrl: doc.youtubeUrl,
        category: doc.category,
        createdAt: doc.createdAt,
        score: hit.score,
        snippet: buildSnippet(doc, trimmed),
      };
    });
}
