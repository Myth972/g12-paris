import "dotenv/config";
import express from "express";
import path from "path";


import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import { csrfProtect, registerCsrf } from "../server/_core/csrf.js";
import { initAgents } from "../server/_core/agents.js";
import { buildRobotsTxt, buildSitemapXml } from "../server/sitemap.js";
import { registerImageOptimizer } from "../server/imageResizer.js";
import { runWeeklyDigest } from "../server/_core/scheduler.js";
import { cronHelpPayload, isValidCronRequest } from "../server/_core/cronAuth.js";
import {
  aiRateLimiter,
  apiRateLimiter,
  conventionRateLimiter,
} from "../server/_core/rateLimit.js";

const app = express();

// Disable the "X-Powered-By" header (information disclosure)
app.disable("x-powered-by");

// Configure body parser (Vercel has its own limits but we set them here for consistency)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Security headers
app.use((req: any, res: any, next: any) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

// Serve uploaded files (important for local dev and self-hosted)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// NODE_ENV peut être mal réglé ("development" dans les variables projet) :
// VERCEL_ENV, posé par la plateforme, est l'autorité fiable en prod.
const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production";

console.log("[Vercel API] Starting initialization...");

// Initialize agents (in-memory registry)
initAgents();

// Log environment status (Safe keys only)
console.log("[Vercel API] Env check:", {
  hasDatabase: !!process.env.TURSO_DATABASE_URL,
  hasToken: !!process.env.TURSO_AUTH_TOKEN,
  nodeEnv: process.env.NODE_ENV,
});

// Cookie CSRF + endpoint /api/csrf : implémentation unique, partagée
// avec le serveur local (voir server/_core/csrf.ts).
registerCsrf(app);

// Health check
app.get("/api/health", (req: any, res: any) => {
  res.json({
    status: "ok",
    databaseLinked: !!process.env.TURSO_DATABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// Sitemap XML (lu en base à chaque requête).
// Déclaré sur /api/sitemap.xml (appel direct) et /sitemap.xml (rewrite Vercel,
// qui preserve le chemin d'origine dans req.url).
app.get(["/api/sitemap.xml", "/sitemap.xml"], async (req: any, res: any) => {
  try {
    const xml = await buildSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Cache-Control",
      "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
    );
    res.status(200).send(xml);
  } catch (error) {
    console.error("[Vercel API] Sitemap Error:", error);
    res.status(500).type("text/plain").send("Sitemap unavailable");
  }
});

// robots.txt
app.get(["/api/robots.txt", "/robots.txt"], (req: any, res: any) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
  res.status(200).send(buildRobotsTxt());
});

// Optimisation d'images à la volée (AVIF/WebP + srcset responsive client)
registerImageOptimizer(app);

// ─── Cron Vercel ──────────────────────────────────────────────────
// node-cron ne survit pas à l'exécution d'une fonction serverless :
// c'est donc Vercel Cron qui déclenche le digest hebdomadaire en prod.
// CRON_SECRET est obligatoire en production (comparaison à temps constant).

app.get("/api/cron/newsletter", async (req: any, res: any) => {
  if (!isValidCronRequest(req, isProduction)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await runWeeklyDigest();
    console.log("[Cron] Newsletter digest:", result);

    if (result.status === "skipped") {
      return res.status(200).json({ ok: true, ...result });
    }
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[Cron] Newsletter digest failed:", error);
    return res.status(500).json({ error: "Digest failed" });
  }
});

// État des crons (utile pour vérifier le déploiement depuis le navigateur)
app.get("/api/cron", (req: any, res: any) => {
  res.status(200).json(cronHelpPayload());
});

// tRPC API — rate limiting + protection CSRF (module partagé server/_core/csrf.ts)
app.use(
  "/api/trpc",
  (req, res, next) => {
    if (req.path.startsWith("/ai.")) {
      return aiRateLimiter(req, res, next);
    }
    if (req.path.startsWith("/conventionRegistrations.create")) {
      return conventionRateLimiter(req, res, next);
    }
    return apiRateLimiter(req, res, next);
  },
  csrfProtect,
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("[Vercel API] Global Error:", err);
  if (res.status) {
    res.status(err.status || 500).json({
      error: "Internal Server Error",
      message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
    });
  }
});

export default app;
