import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "../server/_core/oauth.js";
import { appRouter } from "../server/routers.js";
import { createContext } from "../server/_core/context.js";

const app = express();
app.use(express.json());
// app.use(express.urlencoded({ limit: "50mb", extended: true })); // This line was removed in the provided edit

console.log("[Vercel] Function starting...");
// console.log("[Vercel] Node version:", process.version); // This line was removed in the provided edit
// console.log("[Vercel] Env check:", { // This block was removed in the provided edit
//     hasDbUrl: !!process.env.TURSO_DATABASE_URL,
//     hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
//     hasJwtSecret: !!process.env.JWT_SECRET,
//     nodeEnv: process.env.NODE_ENV
// });

// Health check pour tester si l'API répond
app.get("/api/health", (req, res) => {
    // console.log("[Vercel] Health check hit"); // This line was removed in the provided edit
    res.json({
        status: "ok",
        envCheck: !!process.env.TURSO_DATABASE_URL,
        time: new Date().toISOString()
    });
});

try {
    // console.log("[Vercel] Registering OAuth routes..."); // This line was removed in the provided edit
    // On n'importe les routes que si la santé passe
    registerOAuthRoutes(app as any);

    // console.log("[Vercel] Registering tRPC routes..."); // This line was removed in the provided edit
    // const trpcMiddleware = createExpressMiddleware({ // This variable assignment was removed in the provided edit
    //     router: appRouter,
    //     createContext,
    // });

    app.use("/api/trpc", createExpressMiddleware({
        router: appRouter,
        createContext,
    }));
    // app.use("/trpc", trpcMiddleware); // This line was removed in the provided edit
} catch (e) { // Variable name changed from 'error' to 'e'
    console.error("[Vercel] Startup Error:", e); // Message changed from 'Fatal error during route registration' to 'Startup Error'
}

// Global error handler // This entire block was removed in the provided edit
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//     console.error("[Vercel] Unhandled error:", err);
//     res.status(500).json({ error: "Internal Server Error", message: err.message });
// });

export default app;
