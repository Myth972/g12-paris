/**
 * Entry point for local development only.
 * This file is NOT imported by Vercel serverless functions.
 */
import { startServer } from "./_core/index.js";

startServer().catch((error) => {
    console.error("Failed to start local server:", error);
    process.exit(1);
});
