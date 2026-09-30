import type { RequestHandler } from "express";
import rateLimit, { type Options } from "express-rate-limit";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting partagé entre le serveur autonome et les fonctions Vercel.
 *
 * Sur Vercel, chaque instance serverless a sa propre mémoire : un compteur
 * en mémoire se réinitialise à chaque cold start et ne limite donc rien
 * réellement. Upstash Redis donne un compteur global.
 *
 * Si UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN ne sont pas
 * configurés, on retombe sur le comportement en mémoire (utile en dev).
 */

const windowMs = 60 * 1000;

let redis: Redis | null = null;
let hasRedis = false;

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    hasRedis = true;
  }
} catch (error) {
  console.warn(
    "[RateLimit] Upstash init failed, falling back to memory:",
    error
  );
}

export function isRedisRateLimitEnabled(): boolean {
  return hasRedis;
}

/**
 * Construit un rate limiter. Avec Upstash configuré, les compteurs sont
 * distribués via Redis ; sinon on utilise le store mémoire d'express-rate-limit.
 */
export function createRateLimiter(config: {
  windowMs: number;
  max: number;
  prefix: string;
  message: Record<string, string>;
}): RequestHandler {
  const { prefix, message } = config;

  if (redis) {
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.max, `${config.windowMs} ms`),
      prefix: `g12:${prefix}`,
      analytics: true,
    });

    return async (req, res, next) => {
      try {
        // Identifie l'appelant : IP, en tenant compte du proxy Vercel.
        const forwarded = req.headers["x-forwarded-for"];
        const ip = Array.isArray(forwarded)
          ? forwarded[0]
          : forwarded?.split(",")[0]?.trim();
        const identifier = ip || req.ip || "unknown";

        const { success, limit, remaining, reset } =
          await ratelimit.limit(identifier);

        res.setHeader("RateLimit-Limit", String(limit));
        res.setHeader("RateLimit-Remaining", String(remaining));
        res.setHeader("RateLimit-Reset", String(Math.ceil(reset / 1000)));

        if (!success) {
          res.setHeader(
            "Retry-After",
            String(Math.ceil((reset - Date.now()) / 1000))
          );
          return res.status(429).json(message);
        }
        return next();
      } catch (error) {
        // Redis indisponible : on ne bloque pas la requête.
        console.warn("[RateLimit] Upstash error, allowing request:", error);
        return next();
      }
    };
  }

  const options: Partial<Options> = {
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    // Clé par IP client.
    keyGenerator: (req: any) => {
      const forwarded = req.headers?.["x-forwarded-for"];
      const ip = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded?.split(",")[0]?.trim();
      return ip || req.ip || "unknown";
    },
  };

  return rateLimit(options);
}

const isProduction = process.env.NODE_ENV === "production";

export const apiRateLimiter = createRateLimiter({
  windowMs,
  max: isProduction ? 120 : 300,
  prefix: "api",
  message: { error: "Too many requests" },
});

export const aiRateLimiter = createRateLimiter({
  windowMs,
  max: isProduction ? 20 : 60,
  prefix: "ai",
  message: { error: "Trop de requêtes IA. Réessayez dans 1 minute." },
});

export const conventionRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  prefix: "convention",
  message: { error: "Trop d'inscriptions. Réessayez dans 1 heure." },
});
