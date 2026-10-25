import { eq } from "drizzle-orm";
import { apiProviders as apiProvidersTable, apiKeys as apiKeysTable } from "../../drizzle/schema.js";
import { getDb } from "../db.js";

/**
 * Gestionnaire de la liste dynamique des providers IA.
 *
 * La liste des providers est stockée en base (table api_providers) :
 *  - ajout/suppression à chaud sans redéploiement,
 *  - seed initial des providers par défaut (chat avec Groq et Google
 *    uniquement ; MiniMax/Ollama/AIMLAPI et moteurs vidéo listés mais
 *    désactivés par défaut — l'admin les active via le connecteur de clés),
 *  - un provider supprimé est retiré du fallback et du connecteur.
 */

export interface ApiProviderConfig {
  provider: string;
  label: string;
  model: string;
  baseUrl?: string;
  enabled: boolean;
}

export const DEFAULT_PROVIDERS: ApiProviderConfig[] = [
  { provider: "groq", label: "Groq", model: "openai/gpt-oss-120b", enabled: true },
  {
    provider: "google",
    label: "Google Gemini",
    model: "gemini-3.5-flash",
    enabled: true,
  },
  // Les providers suivants sont listés (gérables via le connecteur de clés)
  // mais désactivés par défaut : le fallback du chat ne s'appuie que sur
  // Groq et Google tant que l'admin n'a pas activé les autres explicitement.
  { provider: "minimax", label: "MiniMax", model: "MiniMax-M2.1", enabled: false },
  { provider: "ollama", label: "Ollama (local)", model: "llama3.2", enabled: false },
  {
    provider: "aimlapi",
    label: "AIMLAPI",
    model: "flux/schnell",
    baseUrl: "https://api.aimlapi.com/v1/images/generations",
    // Provider d'images/vidéo : désactivé par défaut pour que le fallback du
    // chat (listEnabledProviders) ne bascule jamais vers un endpoint d'images
    // sans clé configurée. L'admin l'active via le connecteur de clés.
    enabled: false,
  },
  {
    provider: "kling",
    label: "Kling AI",
    model: "kling-v1",
    baseUrl: "https://api.klingai.com/v1/chat/completions",
    enabled: false,
  },
  {
    provider: "replicate",
    label: "Replicate",
    model: "kwaivgi/kling-v2.6",
    baseUrl: "https://api.replicate.com/v1/predictions",
    enabled: false,
  },
];

// Cache en mémoire (invalidé à chaque modification).
let cache: ApiProviderConfig[] | null = null;

function getDbOrThrow() {
  const db = getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/**
 * Seed initial des providers par défaut — UNIQUEMENT si la table est vide
 * (premier démarrage). Resseeder tout défaut « manquant » à chaque lecture
 * annulerait silencieusement la suppression (blacklist) d'un provider par
 * le connecteur ; une ligne supprimée doit rester supprimée.
 */
async function seedIfEmpty(db: ReturnType<typeof getDb>): Promise<void> {
  const rows = await db.select().from(apiProvidersTable);
  if (rows.length > 0) return;

  await db.insert(apiProvidersTable).values(
    DEFAULT_PROVIDERS.map(p => ({
      provider: p.provider,
      label: p.label,
      model: p.model,
      baseUrl: p.baseUrl ?? null,
      enabled: p.enabled,
    }))
  );
}

/** Liste tous les providers enregistrés (avec seed initial si table vide). */
export async function listProviders(): Promise<ApiProviderConfig[]> {
  if (cache) return cache;

  const db = getDb();
  if (!db) return [...DEFAULT_PROVIDERS];

  await seedIfEmpty(db);
  const rows = (await db.select().from(apiProvidersTable)) as Array<
    typeof apiProvidersTable.$inferSelect
  >;
  cache = rows.map(r => ({
    provider: r.provider,
    label: r.label,
    model: r.model,
    baseUrl: r.baseUrl ?? undefined,
    enabled: r.enabled,
  }));
  return cache;
}

/** Providers activés (pour le fallback et les tests). */
export async function listEnabledProviders(): Promise<string[]> {
  const providers = await listProviders();
  return providers.filter(p => p.enabled).map(p => p.provider);
}

/** Récupère la config d'un provider (ou undefined). */
export async function getProviderConfig(
  provider: string
): Promise<ApiProviderConfig | undefined> {
  const providers = await listProviders();
  return providers.find(p => p.provider === provider);
}

/** Ajoute (ou met à jour) un provider. */
export async function upsertProvider(
  input: {
    provider: string;
    label?: string;
    model?: string;
    baseUrl?: string;
    enabled?: boolean;
  }
): Promise<void> {
  const db = getDbOrThrow();
  const provider = input.provider.trim();
  if (!provider) throw new Error("Identifiant provider requis");

  const existing = await db
    .select()
    .from(apiProvidersTable)
    .where(eq(apiProvidersTable.provider, provider))
    .limit(1);

  const values = {
    provider,
    label: input.label?.trim() || existing[0]?.label || provider,
    model: input.model?.trim() || existing[0]?.model || "",
    baseUrl: input.baseUrl?.trim() || existing[0]?.baseUrl || null,
    enabled: input.enabled ?? existing[0]?.enabled ?? true,
  };

  if (existing.length > 0) {
    await db
      .update(apiProvidersTable)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(apiProvidersTable.provider, provider));
  } else {
    if (!values.model) throw new Error("Modèle requis pour un nouveau provider");
    await db.insert(apiProvidersTable).values(values);
  }
  cache = null;
}

/** Supprime définitivement un provider (et sa clé API en base). */
export async function removeProvider(provider: string): Promise<void> {
  const db = getDbOrThrow();
  await db.delete(apiProvidersTable).where(eq(apiProvidersTable.provider, provider));

  // Supprimer aussi la clé API stockée en base pour ce provider
  try {
    await db.delete(apiKeysTable).where(eq(apiKeysTable.provider, provider));
    const { resetApiKeyCache } = await import("./apiKeys.js");
    resetApiKeyCache();
  } catch {
    // ignore — la clé est nettoyée par ailleurs
  }
  cache = null;
}

/** Vide le cache (après modification externe). */
export function resetProviderCache(): void {
  cache = null;
}