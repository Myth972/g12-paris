import { defineConfig } from "drizzle-kit";
import "dotenv/config";

const url = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("DATABASE_URL or TURSO_DATABASE_URL is required");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle-migrations",
  dialect: "turso",
  dbCredentials: {
    url,
    authToken,
  },
});
