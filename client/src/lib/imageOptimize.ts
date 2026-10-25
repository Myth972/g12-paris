/**
 * Optimisation responsive des images du site.
 *
 * Le serveur expose /api/image (sharp) qui transforme à la volée :
 *   /api/image?src=/uploads/a.jpg&w=480&f=avif
 * Ce helper génère srcset/sizes pour le composant <OptimizedImage />.
 */

/** Largeurs de vignette générées par défaut. */
export const THUMBNAIL_WIDTHS = [320, 480, 768, 1024] as const;

type ImageFormat = "avif" | "webp" | "jpeg";

/** Extensions que sharp peut recoder (exclut gif animé, svg, avif…). */
const TRANSFORMABLE_EXT = /\.(jpe?g|png|tiff?)$/i;

/**
 * Normalise la source vers une URL transformable par /api/image :
 *  - /uploads/…            → tel quel
 *  - même origine (http)   → chemin seul (origin strippé)
 *  - Vercel Blob / S3      → URL complète (allowlist serveur)
 *  - autres (data URI, i.ytimg.com, SVG, GIF animé, BuzzFeed…) → null
 */
export function normalizeImageSource(src: string): string | null {
  if (!src || typeof src !== "string") return null;
  if (src.startsWith("data:") || src.startsWith("blob:")) return null;

  // Format non recodable : SVG (vectoriel), GIF (animation), AVIF source
  const bare = src.split("?")[0].split("#")[0];
  if (/\.(svg|gif|avif)$/i.test(bare)) return null;
  if (/^\/uploads\//.test(bare)) return src;
  if (!TRANSFORMABLE_EXT.test(bare)) return null;

  if (/^https?:\/\//i.test(src)) {
    try {
      const u = new URL(src);
      // Même origine (dev, préviews…) → chemin seul, la règle /uploads/ s'applique
      if (typeof window !== "undefined" && u.origin === window.location.origin) {
        return u.pathname;
      }
      const allowed = ["blob.vercel-storage.com", "amazonaws.com"];
      if (allowed.some(suffix => u.hostname.endsWith(suffix))) return u.toString();
      return null;
    } catch {
      return null;
    }
  }

  return null;
}

/** URL d'une vignette recodée pour une largeur et un format donnés. */
export function buildOptimizedUrl(
  src: string,
  width: number,
  format: ImageFormat
): string {
  return `/api/image?src=${encodeURIComponent(src)}&w=${width}&f=${format}`;
}

/** srcset complet pour un format : "url 320w, url 480w, …" */
export function buildSrcSet(
  src: string,
  widths: readonly number[],
  format: ImageFormat
): string {
  return widths
    .map(w => `${buildOptimizedUrl(src, w, format)} ${w}w`)
    .join(", ");
}
