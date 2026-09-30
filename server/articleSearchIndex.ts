/**
 * Index de recherche full-text des articles publiés.
 *
 * Objectif : rendre la recherche instantanée et gratuite côté client.
 * Le contenu est renvoyé une seule fois, en texte brut, puis indexé
 * localement par MiniSearch (voir client/src/lib/articleSearch.ts).
 * Aucune IA n'est appelée pour une simple recherche de mot-clé.
 */

/**
 * Entités HTML nommées fréquentes. Les caractères accentués sont conservés
 * tels quels : l'index de recherche les normalise côté client, mais on ne doit
 * pas dégrader le texte à la source.
 */
const ENTITIES: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&eacute;": "é",
  "&Eacute;": "É",
  "&egrave;": "è",
  "&Egrave;": "È",
  "&agrave;": "à",
  "&Agrave;": "À",
  "&acirc;": "â",
  "&ccedil;": "ç",
  "&Ccedil;": "Ç",
  "&icirc;": "î",
  "&Icirc;": "Î",
  "&iuml;": "ï",
  "&Iuml;": "Ï",
  "&ocirc;": "ô",
  "&Ocirc;": "Ô",
  "&ucirc;": "û",
  "&Ucirc;": "Û",
  "&ugrave;": "ù",
  "&Ugrave;": "Ù",
  "&uuml;": "ü",
  "&Uuml;": "Ü",
  "&oelig;": "œ",
  "&OElig;": "Œ",
  "&#8217;": "’",
  "&#8216;": "‘",
  "&#171;": "«",
  "&#187;": "»",
  "&hellip;": "...",
  "&mdash;": "—",
  "&ndash;": "–",
};

/**
 * Retire le HTML stocké par TipTap et décode les entités courantes.
 * Le contenu des articles contient des balises, des attributs href/style
 * et des urls qui pollueraient l'index et les scores de pertinence.
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  let text = html
    // Supprime les blocs dont le contenu n'est pas utile à la recherche.
    .replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    // Remplace les balises de séparation de blocs par un espace.
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article|blockquote)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    // Supprime toutes les autres balises et attributs.
    .replace(/<[^>]*>/g, " ");

  for (const [entity, char] of Object.entries(ENTITIES)) {
    text = text.split(entity).join(char);
  }

  // Entités numériques restantes (&#233; &#xE9;).
  text = text.replace(/&#(\d+);/g, (_m, code: string) =>
    String.fromCharCode(Number(code))
  );
  text = text.replace(/&#x([0-9a-f]+);/gi, (_m, code: string) =>
    String.fromCharCode(parseInt(code, 16))
  );

  return text.replace(/\s+/g, " ").trim();
}

/**
 * Tronque proprement sur une frontière de mot pour éviter de couper
 * au milieu d'un terme lors de l'indexation.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const slice = text.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  return (
    lastSpace > maxLength * 0.6 ? slice.slice(0, lastSpace) : slice
  ).trim();
}
