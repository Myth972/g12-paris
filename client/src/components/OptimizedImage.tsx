import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ImgHTMLAttributes,
} from "react";
import {
  buildSrcSet,
  normalizeImageSource,
  THUMBNAIL_WIDTHS,
} from "@/lib/imageOptimize";
import {
  getCachedPlaceholder,
  loadPlaceholder,
  type ImagePlaceholder,
} from "@/lib/imagePlaceholder";

interface OptimizedImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    "srcset" | "srcSet" | "alt" | "src"
  > {
  /** URL d'origine du média (/uploads/…, URL de blob ou externe) */
  src: string;
  alt: string;
  /** Taille affichée estimée (media queries CSS) du srcset */
  sizes?: string;
  /** Largeurs de vignette à générer (défaut : THUMBNAIL_WIDTHS) */
  widths?: readonly number[];
  /**
   * Placeholder « blur-up » pendant le chargement (défaut : true) : la
   * variante minuscule floutée servie par /api/image, agrandie en
   * background-image (la couleur dominante reste en background-color
   * de secours sous le fond flouté).
   */
  placeholder?: boolean;
  /** Transition douce d'apparition (opacité 0→1) à la fin du chargement (défaut : true) */
  fadeIn?: boolean;
}

/**
 * Image optimisée automatiquement :
 *
 *  - Formats modernes : <source AVIF> puis <source WebP>, le navigateur
 *    choisit le premier format qu'il lit ; fallback = fichier d'origine.
 *  - srcset responsive : le téléchargement s'adapte à la largeur d'écran
 *    (x2 retina inclus via descripteurs w/ sizes).
 *  - Placeholder blur-up : une variante minuscule floutée côté serveur
 *    (variante 320px+blur servie par /api/image) est agrandie en
 *    background-image de l'<img>, avec la couleur moyenne en fond de secours
 *    — plus de « carré blanc » pendant le lazy-loading.
 *  - Sources non recodables (GIF animé, SVG, YouTube, data URI…) :
 *    <img> simple, comportement identique à avant.
 */
export default function OptimizedImage({
  src,
  alt,
  sizes,
  widths = THUMBNAIL_WIDTHS,
  loading = "lazy",
  decoding = "async",
  placeholder = true,
  fadeIn = true,
  style,
  ...rest
}: OptimizedImageProps) {
  const normalized = normalizeImageSource(src);
  // Lecture synchrone du cache : zéro flash de couleur si déjà vue.
  const [bg, setBg] = useState<ImagePlaceholder | null>(() =>
    placeholder && normalized ? getCachedPlaceholder(src) : null
  );

  // Extraction asynchrone du placeholder (couleur + fond flouté, cache
  // module inclus — un seul téléchargement pour les deux)
  useEffect(() => {
    if (!placeholder || !normalized) return;
    let alive = true;
    loadPlaceholder(src).then(p => {
      if (alive && p) setBg(p);
    });
    return () => {
      alive = false;
    };
  }, [src, placeholder, normalized]);

  // Apparition douce : opacité 0 → 1 quand le format choisi (AVIF/WebP ou
  // fallback) est entièrement décodé. Déjà en cache → déclenché immédiatement
  // via l'état `complete` (le onLoad ne re-tire pas sur une image terminée).
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [normalized]);

  // Style de fondu : la propriété du parent reste prioritaire si fournie.
  const placeholderStyle: CSSProperties = bg
    ? {
        backgroundColor: bg.color,
        backgroundImage: `url("${bg.blurUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};

  const imgStyle: CSSProperties = fadeIn
    ? {
        ...placeholderStyle,
        opacity: loaded ? 1 : 0,
        transition: "opacity 300ms ease-out",
        ...style,
      }
    : { ...placeholderStyle, ...style };

  // Source non transformable → rendu <img> classique, sans régression.
  if (!normalized) {
    return (
      <img
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        style={style}
        {...rest}
      />
    );
  }

  const srcSetAvif = buildSrcSet(normalized, widths, "avif");
  const srcSetWebp = buildSrcSet(normalized, widths, "webp");

  return (
    <picture>
      <source type="image/avif" srcSet={srcSetAvif} sizes={sizes} />
      <source type="image/webp" srcSet={srcSetWebp} sizes={sizes} />
      {/* Fallback : fichier d'origine, le srcSet des <source> reste prioritaire */}
      <img
        ref={imgRef}
        src={normalized}
        alt={alt}
        sizes={sizes}
        loading={loading}
        decoding={decoding}
        style={imgStyle}
        onLoad={() => setLoaded(true)}
        {...rest}
      />
    </picture>
  );
}
