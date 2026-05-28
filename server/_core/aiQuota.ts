import { TRPCError } from "@trpc/server";

// ─── Per-User Token Quota ────────────────────────────────────────

interface QuotaEntry {
  tokens: number;
  lastReset: number;
}

const userQuotas = new Map<string, QuotaEntry>();

const QUOTA_WINDOW_MS = 60 * 60 * 1000; // 1 heure
const QUOTA_MAX_TOKENS = 50000; // 50k tokens par heure par utilisateur

/**
 * Vérifie et met à jour le quota de tokens pour un utilisateur.
 * Lance une erreur si le quota est dépassé.
 */
export function checkUserQuota(userId: string, estimatedTokens: number): void {
  const now = Date.now();
  const entry = userQuotas.get(userId) || { tokens: 0, lastReset: now };

  // Reset si la fenêtre est dépassée
  if (now - entry.lastReset > QUOTA_WINDOW_MS) {
    entry.tokens = 0;
    entry.lastReset = now;
  }

  if (entry.tokens + estimatedTokens > QUOTA_MAX_TOKENS) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Quota IA dépassé (${QUOTA_MAX_TOKENS} tokens/heure). Réessayez plus tard.`,
    });
  }

  entry.tokens += estimatedTokens;
  userQuotas.set(userId, entry);
}

/**
 * Estime le nombre de tokens à partir d'un texte (approximation: 1 token ≈ 4 caractères).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── AI Usage Logger ─────────────────────────────────────────────

interface AiLogEntry {
  timestamp: Date;
  userId: string;
  provider: string;
  model: string;
  endpoint: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  success: boolean;
  error?: string;
  durationMs: number;
}

// Stockage en mémoire (pourrait être migré vers la DB plus tard)
const aiLogs: AiLogEntry[] = [];
const MAX_LOGS = 1000; // Garder les 1000 derniers logs

/**
 * Enregistre un appel IA dans le log.
 */
export function logAiUsage(entry: AiLogEntry): void {
  aiLogs.push(entry);
  // Garder seulement les MAX_LOGS derniers
  if (aiLogs.length > MAX_LOGS) {
    aiLogs.splice(0, aiLogs.length - MAX_LOGS);
  }
}

/**
 * Récupère les logs IA (pour le dashboard admin).
 */
export function getAiLogs(limit: number = 100): AiLogEntry[] {
  return aiLogs.slice(-limit).reverse();
}

/**
 * Récupère les statistiques IA agrégées.
 */
export function getAiStats(): {
  totalCalls: number;
  totalTokens: number;
  byProvider: Record<string, { calls: number; tokens: number }>;
  byEndpoint: Record<string, { calls: number; tokens: number }>;
  recentErrors: Array<{ timestamp: Date; endpoint: string; error: string }>;
} {
  const byProvider: Record<string, { calls: number; tokens: number }> = {};
  const byEndpoint: Record<string, { calls: number; tokens: number }> = {};
  const recentErrors: Array<{ timestamp: Date; endpoint: string; error: string }> = [];
  let totalTokens = 0;

  for (const log of aiLogs) {
    totalTokens += log.totalTokens;

    if (!byProvider[log.provider]) {
      byProvider[log.provider] = { calls: 0, tokens: 0 };
    }
    byProvider[log.provider].calls++;
    byProvider[log.provider].tokens += log.totalTokens;

    if (!byEndpoint[log.endpoint]) {
      byEndpoint[log.endpoint] = { calls: 0, tokens: 0 };
    }
    byEndpoint[log.endpoint].calls++;
    byEndpoint[log.endpoint].tokens += log.totalTokens;

    if (!log.success && log.error) {
      recentErrors.push({
        timestamp: log.timestamp,
        endpoint: log.endpoint,
        error: log.error,
      });
    }
  }

  return {
    totalCalls: aiLogs.length,
    totalTokens,
    byProvider,
    byEndpoint,
    recentErrors: recentErrors.slice(-20).reverse(),
  };
}

/**
 * Récupère le quota actuel d'un utilisateur.
 */
export function getUserQuotaInfo(userId: string): { used: number; max: number; resetsIn: number } {
  const entry = userQuotas.get(userId);
  if (!entry) return { used: 0, max: QUOTA_MAX_TOKENS, resetsIn: 0 };
  
  const now = Date.now();
  const elapsed = now - entry.lastReset;
  const remaining = Math.max(0, QUOTA_WINDOW_MS - elapsed);
  
  return {
    used: entry.tokens,
    max: QUOTA_MAX_TOKENS,
    resetsIn: Math.ceil(remaining / 60000), // en minutes
  };
}
