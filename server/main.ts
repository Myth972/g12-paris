/**
 * Entry point for local development only.
 * This file is NOT imported by Vercel serverless functions.
 */
import { startServer } from "./_core/index";
import { logger } from "./logger";

startServer().catch((error) => {
    logger.error("Server", "Failed to start local server", error);
    process.exit(1);
});
