/**
 * Module de santé des providers IA — circuit breaker.
 *
 * Suit l'état de chaque provider (échecs consécutifs, cooldown, statut)
 * pour que le fallback saute automatiquement les providers en panne
 * et expose un état lisible au dashboard admin.
 */

export type ProviderErrorKind =
  | "config"
  | "auth"
  | "rate_limit"
  | "timeout"
  | "server"
  | "network"
  | "unknown";

export type ProviderStatus =
  | "healthy"
  | "degraded"
  | "cooldown"
  | "unconfigured";

export interface ProviderHealth {
  provider: string;
  status: ProviderStatus;
  consecutiveFailures: number;
  totalCalls: number;
  lastError?: string;
  lastErrorKind?: ProviderErrorKind;
  cooldownUntil?: number;
  lastSuccessAt?: number;
}

export interface FallbackEvent {
  timestamp: number;
  from: string;
  to: string;
  reason: ProviderErrorKind;
  error: string;
}

const healthMap = new Map<string, ProviderHealth>();
const fallbackEvents: FallbackEvent[] = [];
const MAX_FALLBACK_EVENTS = 50;

const COOLDOWN_MS = 60_000; // 1 minute de pause après trop d'échecs
const FAILURE_THRESHOLD = 3; // 3 échecs consécutifs → cooldown

function defaultHealth(provider: string): ProviderHealth {
  return {
    provider,
    status: "healthy",
    consecutiveFailures: 0,
    totalCalls: 0,
  };
}

function getHealth(provider: string): ProviderHealth {
  let state = healthMap.get(provider);
  if (!state) {
    state = defaultHealth(provider);
    healthMap.set(provider, state);
  }
  return state;
}

/** Classe une erreur en catégorie exploitable pour le circuit breaker. */
export function classifyError(err: unknown): ProviderErrorKind {
  const msg = String((err as any)?.message ?? err ?? "");

  if (/is not configured|API Key is not configured/i.test(msg)) {
    return "config";
  }
  if (/timeout|annulée après/i.test(msg)) {
    return "timeout";
  }
  if (/\b401\b|\b403\b|Unauthorized|Forbidden|invalid.*api.?key/i.test(msg)) {
    return "auth";
  }
  if (/\b429\b|Too Many Requests|rate.?limit/i.test(msg)) {
    return "rate_limit";
  }
  if (/\b5\d\d\b|Internal Server Error|Bad Gateway|Service Unavailable/i.test(msg)) {
    return "server";
  }
  if (/fetch failed|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|network|socket/i.test(msg)) {
    return "network";
  }
  return "unknown";
}

/** Enregistre un succès : reset du compteur et du cooldown. */
export function recordProviderSuccess(provider: string): void {
  const state = getHealth(provider);
  state.consecutiveFailures = 0;
  state.status = "healthy";
  state.cooldownUntil = undefined;
  state.lastSuccessAt = Date.now();
  state.lastError = undefined;
  state.lastErrorKind = undefined;
}

/** Enregistre un échec : incrémente le compteur, active le cooldown si seuil atteint. */
export function recordProviderFailure(
  provider: string,
  kind: ProviderErrorKind,
  error: string
): void {
  const state = getHealth(provider);
  state.totalCalls += 1;

  // Une clé manquante n'est pas une panne transitoire : marquer non configuré, pas de cooldown.
  if (kind === "config") {
    state.status = "unconfigured";
    state.lastError = error;
    state.lastErrorKind = kind;
    return;
  }

  state.consecutiveFailures += 1;
  state.lastError = error;
  state.lastErrorKind = kind;

  if (state.consecutiveFailures >= FAILURE_THRESHOLD) {
    state.status = "cooldown";
    state.cooldownUntil = Date.now() + COOLDOWN_MS;
  } else {
    state.status = "degraded";
  }
}

/** Enregistre une bascule de fallback (pour le dashboard). */
export function recordFallback(
  from: string,
  to: string,
  reason: ProviderErrorKind,
  error: string
): void {
  fallbackEvents.push({ timestamp: Date.now(), from, to, reason, error });
  if (fallbackEvents.length > MAX_FALLBACK_EVENTS) {
    fallbackEvents.splice(0, fallbackEvents.length - MAX_FALLBACK_EVENTS);
  }
}

/** État de santé d'un provider (cooldown expiré → reconsidéré healthy). */
export function getProviderHealth(provider: string): ProviderHealth {
  const state = getHealth(provider);
  if (state.status === "cooldown" && state.cooldownUntil && Date.now() >= state.cooldownUntil) {
    state.status = "healthy";
    state.cooldownUntil = undefined;
    state.consecutiveFailures = 0;
  }
  return { ...state };
}

/** États de santé de tous les providers enregistrés. */
export function getAllProviderHealth(providers: string[] = ["groq", "google", "minimax", "aimlapi", "ollama"]): ProviderHealth[] {
  return providers.map(getProviderHealth);
}

/** Derniers événements de fallback. */
export function getFallbackEvents(): FallbackEvent[] {
  return fallbackEvents.slice(-MAX_FALLBACK_EVENTS).reverse();
}

/** Un provider est-il éligible à la prochaine tentative ? */
export function isProviderAvailable(provider: string): boolean {
  const state = getHealth(provider);
  if (state.status === "unconfigured") return false;
  if (state.status === "cooldown" && state.cooldownUntil && Date.now() < state.cooldownUntil) {
    return false;
  }
  return true;
}

/** Reset manuel de l'état d'un provider (admin). */
export function resetProviderHealth(provider: string): void {
  healthMap.set(provider, defaultHealth(provider));
}