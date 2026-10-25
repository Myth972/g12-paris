/**
 * Optimiseur d'images à la volée — /api/image
 *
 * Renvoie une version redimensionnée et recodée d'une image du site :
 *   /api/image?src=/uploads/gallery/x.jpg&w=480&f=avif
 *   /api/image?src=https://pub-xxx.blob.vercel-storage.com/a.png&w=768&f=webp
 *
 * Paramètre optionnel blur (blur-up des placeholders) :
 *   /api/image?src=/uploads/gallery/x.jpg&w=320&f=webp&blur=8
 *   → variette minuscule fortement floutée (noyau gaussien de rayon sigma),
 *     servie comme fond antéchargé par <OptimizedImage />.
 *
 * Utilisé par le composant client <OptimizedImage /> pour générer un
 * <picture> avec srcset responsive (AVIF + WebP, fallback original).
 *
 * Sécurité :
 *  - Sources autorisées UNIQUEMENT : chemins locaux /uploads/… (lecture
 *    bornée au dossier uploads, pas de traversal) et URLs des storage
 *    providers allowlistés (Vercel Blob / S3). Tout le reste → 404.
 *  - Largeur bornée (32 → 1600 px), formats figés (avif/webp/jpeg).
 *
 * Cache : URL déterministe → Cache-Control immutable (1 an) + s-maxage,
 * Vercel CDN et le navigateur (ou le service worker) servent sans rappeler
 * la fonction serverless après le premier passage.
 */

import path from "path";
import { promises as fs } from "fs";
import type { Express, Request, Response } from "express";

const UPLOADS_PREFIX = "/uploads/";
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const WIDTH_MIN = 32;
const WIDTH_MAX = 1600;

/** Formats de sortie autorisés (+ qualités adaptées aux vignettes). */
const FORMATS = {
  avif: { contentType: "image/avif", quality: 60 },
  webp: { contentType: "image/webp", quality: 78 },
  jpeg: { contentType: "image/jpeg", quality: 80 },
} as const;

type FormatKey = keyof typeof FORMATS;

/** Hosts distants éligibles (stockage public du site). */
const ALLOWED_REMOTE_HOST_SUFFIXES = [
  "blob.vercel-storage.com",
  "s3.amazonaws.com",
  "amazonaws.com",
];

/** Lit la source (fichier local ou URL de stockage) → Buffer, ou null. */
async function loadSource(src: string): Promise<Buffer | null> {
  // 1) Fichier uploadé localement — lecture bornée au dossier uploads/
  if (src.startsWith(UPLOADS_PREFIX)) {
    try {
      const rel = path.normalize(
        decodeURIComponent(src.slice(UPLOADS_PREFIX.length))
      );
      const abs = path.join(UPLOADS_DIR, rel);
      if (!abs.startsWith(UPLOADS_DIR + path.sep)) return null; // traversal
      return await fs.readFile(abs);
    } catch {
      return null;
    }
  }

  // 2) URL du storage public (Vercel Blob / S3)
  if (/^https?:\/\//i.test(src)) {
    try {
      const u = new URL(src);
      if (!u.protocol.startsWith("http")) return null;
      const allowed = ALLOWED_REMOTE_HOST_SUFFIXES.some(suffix =>
        u.hostname.endsWith(suffix)
      );
      if (!allowed) return null;
      const res = await fetch(u.toString());
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  return null;
}

/** Valide la requête et renvoie null si un paramètre est hors bornes. */
function parseParams(req: Request): {
  src: string;
  width: number; // 0 = largeur d'origine
  format: FormatKey;
  blur: number; // 0 = pas de flou
} | null {
  const src = typeof req.query.src === "string" ? req.query.src : "";
  if (!src) return null;

  const widthRaw = typeof req.query.w === "string" ? parseInt(req.query.w, 10) : 0;
  const width = Number.isFinite(widthRaw) && widthRaw > 0 ? widthRaw : 0;

  const formatRaw = (typeof req.query.f === "string" ? req.query.f : "avif"
  ) as FormatKey;
  const format = formatRaw in FORMATS ? formatRaw : "avif";

  // Flou optionnel : noyau gaussien de rayon sigma (>0). Borné à la plage
  // utile du placeholder (le flou est appliqué APRÈS le resize).
  let blur = 0;
  if (typeof req.query.blur === "string") {
    const blurRaw = parseFloat(req.query.blur);
    if (Number.isFinite(blurRaw) && blurRaw > 0.3 && blurRaw <= 20) {
      blur = blurRaw;
    } else {
      return null;
    }
  }

  if (width && (width < WIDTH_MIN || width > WIDTH_MAX)) return null;

  return { src, width, format, blur };
}

/** Enregistre la route sur une app Express (local + api/index.ts Vercel). */
export function registerImageOptimizer(app: Express): void {
  app.get("/api/image", async (req: Request, res: Response) => {
    const params = parseParams(req);
    if (!params) {
      return res
        .status(400)
        .json({ error: "Paramètres invalides (?src=&w=&f=avif|webp|jpeg)" });
    }
    const { src, width, format, blur } = params;

    const source = await loadSource(src);
    if (!source) {
      return res.status(404).json({ error: "Image introuvable ou non autorisée" });
    }

    try {
      const sharp = (await import("sharp")).default;
      let pipeline = sharp(source).rotate(); // auto-orienter via EXIF
      if (width > 0) {
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
      }
      // Flou du placeholder : appliqué après le resize, sigma en pixels.
      if (blur > 0) {
        pipeline = pipeline.blur(blur);
      }
      const { data } = await pipeline
        .toFormat(format, FORMATS[format])
        .toBuffer({ resolveWithObject: true });

      res.setHeader("Content-Type", FORMATS[format].contentType);
      res.setHeader(
        "Cache-Control",
        "public, max-age=31536000, s-maxage=31536000, stale-while-revalidate=604800, immutable"
      );
      return res.status(200).send(data);
    } catch (err) {
      // Image illisible / mémoire serverless : basculer sur l'original
      // plutôt que casser le rendu de la page.
      console.error("[api/image] Transform failed:", src, err);
      if (src.startsWith(UPLOADS_PREFIX) || /^https?:\/\//i.test(src)) {
        return res.redirect(302, src);
      }
      return res.status(502).json({ error: "Transform failed" });
    }
  });
}
