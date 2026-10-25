import { buildOptimizedUrl, normalizeImageSource } from "./imageOptimize";

/**
 * Placeholder « blur-up » pour les vignettes.
 *
 * Principe : on charge une SEULE variante minuscule floutée côté serveur
 * (/api/image …&w=320&f=webp&blur=8, ≈5-10 Ko, cache immuable) :
 *  - son URL sert de fond antéchargé de l'<img> (background-scale « cover »),
 *    agrandi par le navigateur : c'est le classique blur-up Storybook/Gatsby,
 *  - ses pixels décodés donnent aussi la couleur moyenne, posée en
 *    background-color de secours sous le fond flouté.
 *
 * Fini le « carré blanc » pendant le lazy-loading : la vignette apparaît par
 * fondu au-dessus d'une version lisible floutée d'elle-même.
 *
 * Tout est same-origin (la variante passe par notre proxy), donc le canvas
 * reste lisible sans en-tête CORS. Cache en mémoire par URL (une seule
 * extraction par image, même après changement de page).
 */

/** Couleur moyenne + URL du fond flouté pour une source. */
export interface ImagePlaceholder {
  /** Couleur moyenne (fallback sous le fond flouté). */
  color: string;
  /** URL de la variante 320px floutée, en background du <img>. */
  blurUrl: string;
}

const placeholderCache = new Map<string, ImagePlaceholder>();

/** Placeholder déjà calculé ? (lecture synchrone au rendu, pas de flash) */
export function getCachedPlaceholder(src: string): ImagePlaceholder | null {
  const key = cacheKey(src);
  return key ? placeholderCache.get(key) ?? null : null;
}

function cacheKey(src: string): string | null {
  return normalizeImageSource(src);
}

/** Charge + décode une image depuis une URL, via objectURL same-origin. */
function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode failed"));
    img.src = url;
  });
}

/**
 * Extrait la couleur moyenne de la variante floutée déjà décodée
 * (moyenne pondérée des pixels décodés, canvas lisible because same-origin).
 */
function extractDominantColor(img: HTMLImageElement): string | null {
  try {
    const SAMPLE = 8;
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE;
    canvas.height = SAMPLE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
    const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);

    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha < 128) continue; // pixels transparents ignorés
      r += data[i] * alpha;
      g += data[i + 1] * alpha;
      b += data[i + 2] * alpha;
      count += alpha;
    }
    if (count === 0) return null;
    r = Math.min(255, Math.round(r / count));
    g = Math.min(255, Math.round(g / count));
    b = Math.min(255, Math.round(b / count));
    // Léger assèbrissement : un placeholder trop clair « éclaircit » la vignette
    const R = Math.round(r * 0.92);
    const G = Math.round(g * 0.92);
    const B = Math.round(b * 0.92);
    return `#${[R, G, B].map(c => c.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return null;
  }
}

/**
 * Récupère (et met en cache) le placeholder d'une source : couleur dominante
 * + URL du fond flouté, depuis les mêmes octets.
 * Résout `null` si la source n'est pas transformable ou en cas d'échec.
 */
export async function loadPlaceholder(src: string): Promise<ImagePlaceholder | null> {
  const key = cacheKey(src);
  if (!key) return null;
  const cached = placeholderCache.get(key);
  if (cached) return cached;

  // Variante minuscule floutée passée par notre proxy (same-origin) :
  // le flou server-side remplace l'ancien fetch de la couleur (2 fichiers
  // téléchargés de moins ; la couleur reste déduite sur canvas).
  const blurUrl = buildOptimizedUrl(key, 320, "webp") + "&blur=8";
  let objectUrl: string | null = null;
  try {
    const res = await fetch(blurUrl);
    if (!res.ok) return null;
    objectUrl = URL.createObjectURL(await res.blob());
    const img = await decodeImage(objectUrl);
    const color = extractDominantColor(img);
    if (!color) return null;
    const placeholder: ImagePlaceholder = { color, blurUrl };
    placeholderCache.set(key, placeholder);
    return placeholder;
  } catch {
    return null;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
