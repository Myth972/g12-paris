import "dotenv/config";
import express from "express";
import crypto from "crypto";
import { parse as parseCookieHeader } from "cookie";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";
import { getCsrfCookieOptions } from "../server/_core/cookies.js";

const app = express();

// Constants identical to server/_core/index.ts
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

// Configure body parser (Vercel has its own limits but we set them here for consistency)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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

console.log("[Vercel API] Starting initialization...");

// Log environment status (Safe keys only)
console.log("[Vercel API] Env check:", {
  hasDatabase: !!process.env.TURSO_DATABASE_URL,
  hasToken: !!process.env.TURSO_AUTH_TOKEN,
  nodeEnv: process.env.NODE_ENV,
});

// Middleware to ensure CSRF cookie is present
app.use((req, res, next) => {
  ensureCsrfCookie(req, res);
  next();
});

// CSRF token endpoint (CRITICAL for frontend)
app.get("/api/csrf", (req, res) => {
  try {
    const token = ensureCsrfCookie(req, res);
    res.status(200).json({ token });
  } catch (error) {
    console.error("[Vercel API] CSRF Error:", error);
    res.status(500).json({ error: "Failed to generate CSRF token" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    databaseLinked: !!process.env.TURSO_DATABASE_URL,
    timestamp: new Date().toISOString(),
  });
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Vercel API] Global Error:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
  });
});

export default app;
