import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { parse as parseCookieHeader } from "cookie";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { getCsrfCookieOptions } from "./cookies.js";
import { serveStatic, setupVite } from "./vite.js";

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

  const CSRF_COOKIE_NAME = "csrf_token";
  const CSRF_HEADER_NAME = "x-csrf-token";
  const CSRF_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

  const readCsrfCookie = (req: express.Request) => {
    const header = req.headers.cookie;
    if (!header) return undefined;
    const parsed = parseCookieHeader(header);
    return parsed[CSRF_COOKIE_NAME];
  };

  const ensureCsrfCookie = (req: express.Request, res: express.Response) => {
    let token = readCsrfCookie(req);
    if (!token) {
      token = crypto.randomBytes(32).toString("hex");
      res.cookie(CSRF_COOKIE_NAME, token, {
        ...getCsrfCookieOptions(req),
        maxAge: CSRF_MAX_AGE_MS,
      });
    }
    return token;
  };

  // Servir le widget de démo
  app.use("/widget", express.static(path.join(process.cwd(), "components/ai-chat-widget")));

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // Issue CSRF token cookie (double-submit pattern)
  app.use((req, res, next) => {
    ensureCsrfCookie(req, res);
    next();
  });

  // CSRF token endpoint for clients
  app.get("/api/csrf", (req, res) => {
    const token = ensureCsrfCookie(req, res);
    res.status(200).json({ token });
  });

  const apiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 300 : 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests" },
  });

  // Rate limiter spécifique pour les endpoints IA (plus strict)
  const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 60 : 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Trop de requêtes IA. Réessayez dans 1 minute." },
  });

  const csrfProtect: express.RequestHandler = (req, res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return next();
    }
    const cookieToken = readCsrfCookie(req);
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
    if (!cookieToken || !headerToken || headerToken !== cookieToken) {
      return res.status(403).json({ error: "Invalid CSRF token" });
    }
    return next();
  };

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
Règles : Réponds en français, sois chaleureux et concis.`;

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

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
