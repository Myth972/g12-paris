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

  // tRPC API
  app.use(
    "/api/trpc",
    apiRateLimiter,
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
