/**
 * Construit une URL complète pour une image à partir d'une URL relative ou absolue.
 * - Si l'URL commence par "http", elle est déjà complète → retournée telle quelle
 * - Si l'URL commence par "/uploads/", elle est relative → on ajoute l'origine du navigateur
 * - Sinon, on retourne l'URL telle quelle
 */
export function getImageUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) {
    return `${window.location.origin}${url}`;
  }
  return url;
}

/**
 * Vérifie si une URL d'image est valide et accessible.
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("http")) return true;
  if (url.startsWith("/uploads/")) return true;
  return false;
}