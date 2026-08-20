import { eq } from "drizzle-orm";
import { apiKeys as apiKeysTable } from "../../drizzle/schema.js";
import { ENV } from "./env.js";
import { getDb } from "../db.js";

/**
 * Connecteur de clés API — permet de surcharger les clés du .env
 * via la base de données, à chaud, sans redéploiement.
 *
 * Priorité : DB (api_keys) > .env
 */

export interface ApiKeyStatus {
  provider: string;
  configured: boolean;
  source: "env" | "db" | "none";
  masked: string;
}

// Cache en mémoire pour éviter un SELECT à chaque appel IA.
const cache = new Map<string, string | null>();

function envKeyFor(provider: string): string | null {
  switch (provider) {
    case "groq":
      return ENV.groqApiKey || null;
    case "google":
      return ENV.googleApiKey || null;
    case "minimax":
      return ENV.minimaxApiKey || null;
    case "aimlapi":
      return ENV.aimlApiKey || null;
    case "ollama":
      return "ollama"; // pas de clé
    default:
      return null;
  }
}

function maskKey(value: string): string {
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

/** Récupère la clé effective d'un provider (DB d'abord, puis .env). */
export async function getApiKey(provider: string): Promise<string | null> {
  const cached = cache.get(provider);
  if (cached !== undefined) return cached;

  let dbValue: string | null = null;
  try {
    const db = getDb();
    if (db) {
      const rows = await db
        .select()
        .from(apiKeysTable)
        .where(eq(apiKeysTable.provider, provider))
        .limit(1);
      dbValue = rows[0]?.value ?? null;
    }
  } catch {
    dbValue = null;
  }

  const effective = dbValue ?? envKeyFor(provider);
  cache.set(provider, effective);
  return effective;
}

/** Met à jour (ou crée) une clé en DB et rafraîchit le cache. */
export async function setApiKey(provider: string, value: string): Promise<void> {
  const trimmed = value.trim();
  const db = getDb();
  if (!db)
    throw new Error("Database not available");
  const existing = await db
    .select()
    .from(apiKeysTable)
    .where(eq(apiKeysTable.provider, provider))
    .limit(1);

  if (trimmed === "") {
    // Supprime la surcharge DB → retour au .env
    if (existing.length > 0) {
      await db.delete(apiKeysTable).where(eq(apiKeysTable.provider, provider));
    }
    cache.set(provider, envKeyFor(provider));
    return;
  }

  if (existing.length > 0) {
    await db
      .update(apiKeysTable)
      .set({ value: trimmed })
      .where(eq(apiKeysTable.provider, provider));
  } else {
    await db.insert(apiKeysTable).values({ provider, value: trimmed });
  }
  cache.set(provider, trimmed);
}

/** Supprime la surcharge DB d'un provider (retour au .env). */
export async function removeApiKey(provider: string): Promise<void> {
  const db = getDb();
  if (db) {
    await db.delete(apiKeysTable).where(eq(apiKeysTable.provider, provider));
  }
  cache.set(provider, envKeyFor(provider));
}

/** Retourne l'état de tous les providers (sans exposer les clés). */
export async function listApiKeyStatus(): Promise<ApiKeyStatus[]> {
  const { listProviders } = await import("./apiProviders.js");
  const providers = await listProviders();
  const results: ApiKeyStatus[] = [];
  for (const { provider } of providers) {
    const envValue = envKeyFor(provider);
    const dbValue = await getApiKey(provider);
    const effective = dbValue ?? envValue;
    const source = dbValue !== envValue && dbValue !== null ? "db" : envValue ? "env" : "none";
    results.push({
      provider,
      configured: !!effective,
      source,
      masked: effective ? maskKey(effective) : "",
    });
  }
  return results;
}

/** Vide le cache (après un changement externe). */
export function resetApiKeyCache(): void {
  cache.clear();
}