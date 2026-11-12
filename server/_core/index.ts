import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";


import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { csrfProtect, registerCsrf } from "./csrf.js";
import { serveStatic, setupVite } from "./vite.js";
import { initAgents } from "./agents.js";
import { initScheduler, runWeeklyDigest } from "./scheduler.js";
import { buildRobotsTxt, buildSitemapXml } from "../sitemap.js";
import { registerImageOptimizer } from "../imageResizer.js";
import { isValidCronRequest } from "./cronAuth.js";
import {
  aiRateLimiter,
  apiRateLimiter,
  conventionRateLimiter,
} from "./rateLimit.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  initAgents();
  initScheduler();

  // Disable the "X-Powered-By" header (information disclosure)
  app.disable("x-powered-by");

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );
    next();
  });

  // Servir le widget de démo
  app.use("/widget", express.static(path.join(process.cwd(), "components/ai-chat-widget")));

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Cookie CSRF + endpoint /api/csrf : implémentation unique, partagée
  // avec la fonction Vercel (voir server/_core/csrf.ts).
  registerCsrf(app);

  // Sitemap XML (lu en base à chaque requête)
  app.get(["/api/sitemap.xml", "/sitemap.xml"], async (req, res) => {
    try {
      const xml = await buildSitemapXml();
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader(
        "Cache-Control",
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"
      );
      res.status(200).send(xml);
    } catch (error) {
      console.error("[Sitemap] Error:", error);
      res.status(500).type("text/plain").send("Sitemap unavailable");
    }
  });

  // robots.txt
  app.get(["/api/robots.txt", "/robots.txt"], (req, res) => {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400");
    res.status(200).send(buildRobotsTxt());
  });

  // Optimisation d'images à la volée (AVIF/WebP + srcset responsive client)
  registerImageOptimizer(app);

  // ─── Cron ───────────────────────────────────────────────────────
  // Sur Vercel c'est la route équivalente de api/index.ts qui est appelée
  // par Vercel Cron. Elle est exposée ici pour pouvoir déclencher et
  // vérifier le digest manuellement en développement.
  app.get("/api/cron/newsletter", async (req, res) => {
    if (!isValidCronRequest(req, process.env.NODE_ENV === "production")) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const result = await runWeeklyDigest();
      console.log("[Cron] Newsletter digest:", result);
      res.status(200).json({ ok: true, ...result });
    } catch (error) {
      console.error("[Cron] Newsletter digest failed:", error);
      res.status(500).json({ error: "Digest failed" });
    }
  });

  // REST API pour le widget chat (format simple)
  app.post("/api/chat", aiRateLimiter, async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array required" });
      }

      const { getDb } = await import("../db.js");
      const { invokeLLMWithFallback } = await import("./llm.js");
      const { siteSettings } = await import("../../drizzle/schema.js");
      const { eq, desc, asc } = await import("drizzle-orm");
      const { checkUserQuota, estimateTokens, logAiUsage } = await import("./aiQuota.js");

      const db = getDb();
      if (!db) {
        return res.status(500).json({ error: "DB unavailable" });
      }

      // Vérifier si le chatbot est activé (en dev, toujours autorisé)
      if (process.env.NODE_ENV !== "development") {
        const chatbotSetting = await db.select().from(siteSettings).where(eq(siteSettings.key, "chatbot_enabled")).limit(1);
        if (chatbotSetting[0]?.value !== "true") {
          return res.status(403).json({ error: "Le chatbot est désactivé." });
        }
      }

      // Récupérer le provider
      const providerRows = await db.select().from(siteSettings).where(eq(siteSettings.key, "aiProvider")).limit(1);
      const provider = providerRows[0]?.value as any;

      // Récupérer le contexte du site
      const { articles, biblicalVerses, announcements } = await import("../../drizzle/schema.js");
      const [recentArticles, latestVerse, upcomingAnnouncements] = await Promise.all([
        db.select({ title: articles.title, slug: articles.slug, excerpt: articles.excerpt, category: articles.category })
          .from(articles).where(eq(articles.published, true)).orderBy(desc(articles.createdAt)).limit(5),
        db.select().from(biblicalVerses).orderBy(desc(biblicalVerses.createdAt)).limit(1),
        db.select({ title: announcements.title, description: announcements.description, eventDate: announcements.eventDate, location: announcements.location })
          .from(announcements).where(eq(announcements.visible, true)).orderBy(asc(announcements.displayOrder)).limit(3),
      ]);

      const siteContext = `Tu es l'assistant virtuel de G12 Paris Infos Médias.
CONTEXTE DU SITE :
- Articles : ${recentArticles.map((a: any) => `"${a.title}" (${a.category})`).join(", ")}
- Verset du jour : ${latestVerse[0] ? `"${latestVerse[0].reference}"` : "Aucun"}
- Événements : ${upcomingAnnouncements.map((a: any) => `"${a.title}"${a.eventDate ? ` le ${a.eventDate}` : ""}`).join(", ") || "Aucun"}
RÈGLES STRICTES :
1. Réponds en français, sois chaleureux et concis.
2. CONFIDENTIALITÉ : Tu ne dois JAMAIS divulguer les informations personnelles des utilisateurs (noms, emails, codes d'inscription, adresses, numéros de téléphone).
3. Si on te demande une liste d'inscrits, des codes d'accès, ou des informations sur les comptes utilisateurs, réponds : "Je ne peux pas fournir ces informations pour des raisons de confidentialité."
4. Ne jamais révéler le fonctionnement interne du site (base de données, serveurs, configuration technique).
5. Tu es un assistant spirituel et informatif, pas un outil d'administration.`;

      const startTime = Date.now();
      const userId = "widget-anonymous";
      const inputTokens = messages.reduce((sum: number, m: any) => sum + estimateTokens(m.content), 0);

      const messagesWithSystem = [
        { role: "system" as const, content: siteContext },
        ...messages.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const response = await invokeLLMWithFallback({ messages: messagesWithSystem, provider });
      const assistantMessage = response.choices[0].message.content as string;
      const outputTokens = estimateTokens(assistantMessage);

      logAiUsage({
        timestamp: new Date(), userId, provider: provider || "groq", model: response.model,
        endpoint: "api.chat", inputTokens, outputTokens, totalTokens: inputTokens + outputTokens,
        success: true, durationMs: Date.now() - startTime,
      });

      return res.json({ content: assistantMessage });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Server error" });
    }
  });

  // tRPC API — avec rate limiting IA spécifique
  app.use(
    "/api/trpc",
    (req, res, next) => {
      // Appliquer le rate limiter IA strict pour les endpoints IA
      if (req.path.startsWith("/ai.")) {
        return aiRateLimiter(req, res, next);
      }
      // Appliquer le rate limiter Convention pour les inscriptions
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
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Certains environnements définissent PORT=0 (« attribue-moi un port »).
  // Le transmettre tel quel donnerait un port aléatoire annoncé nulle part :
  // findAvailablePort(0) répond toujours « libre » et listen(0) laisse le
  // système choisir. On normalise donc toute valeur hors 1-65535.
  const rawPort = Number.parseInt(process.env.PORT ?? "", 10);
  const preferredPort =
    Number.isInteger(rawPort) && rawPort >= 1 && rawPort <= 65535
      ? rawPort
      : 3000;
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    // Port réellement ouvert (`address()` fait foi, même si le système en a
    // attribué un autre).
    const address = server.address();
    const actualPort =
      address && typeof address === "object" ? address.port : port;
    console.log(`Server running on http://localhost:${actualPort}/`);
  });
}

startServer().catch(console.error);
