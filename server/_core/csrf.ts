import type { Express, Request, RequestHandler, Response } from "express";
import crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";
import { getCsrfCookieOptions } from "./cookies.js";

/**
 * Protection CSRF — implémentation unique.
 *
 * Le schéma est un « double-submit cookie » : le serveur dépose un jeton
 * aléatoire dans un cookie lisible par le JS (`httpOnly: false`), le client le
 * renvoie dans l'en-tête `x-csrf-token`, et le serveur exige l'égalité des
 * deux. Un site tiers peut faire envoyer le cookie par le navigateur, mais il
 * ne peut pas lire sa valeur pour la recopier dans l'en-tête.
 *
 * Ce module est importé par les DEUX entrypoints :
 *   - `server/_core/index.ts` — serveur Express autonome (dev, `pnpm start`) ;
 *   - `api/index.ts`            — fonction serverless réellement exécutée par
 *                                 Vercel en production.
 *
 * Avant cette factorisation, les deux fichiers portaient une copie du
 * middleware. Un correctif appliqué d'un seul côté fonctionnait en local et
 * restait sans effet en production (c'est arrivé avec le retrait du cookie
 * sur `/api/image`). Toute évolution se fait désormais ici, une seule fois.
 */

export const CSRF_COOKIE_NAME = "csrf_token";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours

const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Routes publiques identiques pour tous et servies avec un cache long.
 *
 * Y poser le cookie CSRF annulerait ce cache : un CDN (Vercel inclus) refuse
 * de mettre en cache une réponse contenant `Set-Cookie`. Le jeton reste émis
 * par toutes les autres réponses et par `GET /api/csrf`, donc le double-submit
 * reste intact.
 */
export const CACHEABLE_PUBLIC_PATHS: readonly RegExp[] = [
  /^\/api\/image\b/,
  /^\/api\/sitemap\.xml$/,
  /^\/sitemap\.xml$/,
  /^\/api\/robots\.txt$/,
  /^\/robots\.txt$/,
  /^\/uploads\//,
  /^\/widget\//,
];

/** Vrai si la requête est un GET d'une route publique destinée au cache CDN. */
export function isCacheablePublicGet(req: Request): boolean {
  return (
    req.method === "GET" &&
    CACHEABLE_PUBLIC_PATHS.some(pattern => pattern.test(req.path))
  );
}

/**
 * Lit le jeton CSRF dans l'en-tête `Cookie`.
 *
 * Le repli `headers.get("cookie")` couvre les requêtes de type Fetch que
 * certains runtimes serverless présentent à Express ; sur un Express standard
 * `headers.cookie` suffit.
 */
export function readCsrfCookie(req: Request): string | undefined {
  const fetchStyleGetter = (
    req.headers as unknown as { get?: (name: string) => string | null }
  ).get;
  const header =
    req.headers.cookie ?? fetchStyleGetter?.("cookie") ?? undefined;
  if (!header) return undefined;
  return parseCookieHeader(header)[CSRF_COOKIE_NAME];
}

/**
 * Retourne le jeton existant, ou en crée un et le dépose en cookie.
 *
 * À appeler uniquement quand la réponse n'est pas mise en cache par un CDN
 * (voir `isCacheablePublicGet`).
 */
export function ensureCsrfCookie(req: Request, res: Response): string {
  let token = readCsrfCookie(req);
  if (!token) {
    token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, {
      ...getCsrfCookieOptions(req),
      maxAge: CSRF_MAX_AGE_MS,
    });
  }
  return token;
}

/** Rejette toute mutation dont le jeton d'en-tête ne correspond pas au cookie. */
export const csrfProtect: RequestHandler = (req, res, next) => {
  if (!CSRF_PROTECTED_METHODS.has(req.method)) {
    return next();
  }
  const cookieToken = readCsrfCookie(req);
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
  if (!cookieToken || !headerToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  return next();
};

/**
 * Branche l'émission du cookie et l'endpoint `GET /api/csrf` sur l'application.
 *
 * À appeler une fois, après les fichiers statiques (`/uploads`, `/widget`) et
 * avant les routes qui doivent recevoir le cookie.
 */
export function registerCsrf(app: Express): void {
  // Émission du cookie sur toutes les réponses, sauf les GET publics cachables.
  app.use((req, res, next) => {
    if (!isCacheablePublicGet(req)) {
      ensureCsrfCookie(req, res);
    }
    next();
  });

  // Endpoint explicite pour les clients qui n'ont pas encore de cookie.
  app.get("/api/csrf", (req, res) => {
    try {
      res.status(200).json({ token: ensureCsrfCookie(req, res) });
    } catch (error) {
      console.error("[CSRF] Failed to issue token:", error);
      res.status(500).json({ error: "Failed to generate CSRF token" });
    }
  });
}
