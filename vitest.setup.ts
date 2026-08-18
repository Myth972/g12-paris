import "dotenv/config";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { afterAll, beforeAll, vi } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

const require = createRequire(import.meta.url);
const { pushSQLiteSchema } = require("drizzle-kit/api");

// ─── Base de test isolée ───────────────────────────────────────
// Chaque worker de test reçoit un fichier SQLite temporaire unique.
// Les tests n'écrivent jamais dans la base de production (Turso).
const dbFile = path.join(
  os.tmpdir(),
  `g12-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
);
// Le fichier reste verrouillé par SQLite tant que le process worker est
// vivant (EPERM sous Windows) : la suppression est gérée dans le teardown
// de tests/setup/db.teardown.ts, après l'arrêt de tous les workers.
process.env.DATABASE_URL = `file:${dbFile}`;
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

// Rejoue le schéma (drizzle/schema.ts) via l'API push de drizzle-kit,
// comme `pnpm run db:push`, afin que la DB de test soit toujours alignée
// sur le schéma courant (les migrations SQL sont obsolètes).
beforeAll(async () => {
  const client = createClient({ url: process.env.DATABASE_URL });
  try {
    const schemaModule = await import("./drizzle/schema.ts");
    const drizzleDb = drizzle(client);
    const result = await pushSQLiteSchema(schemaModule, drizzleDb);
    await result.apply();
  } finally {
    client.close();
  }
});

afterAll(async () => {
  try {
    const { closeDb } = await import("./server/db.ts");
    closeDb();
  } catch {}
});

// Mock fetch for storage tests
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ url: "https://dummy.api/mocked-url" }),
    text: () => Promise.resolve("OK"),
  })
);