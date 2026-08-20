/**
 * Registre des modèles IA — détecte et remplace les modèles obsolètes.
 *
 * Deux sources :
 *  1. Registre statique des dépréciations connues (modèle → remplacement).
 *  2. Vérification live de l'endpoint /models du provider (best-effort).
 */

export interface ModelDeprecation {
  deprecated: string;
  replacement: string;
  note?: string;
}

const DEPRECATIONS: Record<string, ModelDeprecation[]> = {
  groq: [
    {
      deprecated: "llama-3.3-70b-versatile",
      replacement: "openai/gpt-oss-120b",
      note: "Arrêté par Groq le 16/08/2026",
    },
    {
      deprecated: "llama-3.1-8b-instant",
      replacement: "openai/gpt-oss-20b",
      note: "Arrêté par Groq le 16/08/2026",
    },
    {
      deprecated: "llama-3.3-70b-specdec",
      replacement: "openai/gpt-oss-120b",
      note: "Arrêté par Groq le 16/08/2026",
    },
  ],
  google: [
    {
      deprecated: "gemini-2.0-flash-exp",
      replacement: "gemini-3.5-flash",
      note: "Arrêté par Google le 01/06/2026",
    },
    {
      deprecated: "gemini-2.0-flash",
      replacement: "gemini-3.5-flash",
      note: "Arrêté par Google le 01/06/2026",
    },
    {
      deprecated: "gemini-2.0-flash-001",
      replacement: "gemini-3.5-flash",
      note: "Arrêté par Google le 01/06/2026",
    },
  ],
  minimax: [
    {
      deprecated: "MiniMax-M1",
      replacement: "MiniMax-M2.1",
      note: "Retiré de la liste des modèles MiniMax",
    },
    {
      deprecated: "abab6.5s-chat",
      replacement: "MiniMax-M2.1",
      note: "Ancien modèle MiniMax",
    },
    {
      deprecated: "MiniMax-Text-01",
      replacement: "MiniMax-M2.1",
      note: "Ancien modèle MiniMax",
    },
  ],
  aimlapi: [],
  ollama: [],
};

export const DEFAULT_MODELS: Record<string, string> = {
  groq: "openai/gpt-oss-120b",
  google: "gemini-3.5-flash",
  minimax: "MiniMax-M2.1",
  aimlapi: "mistralai/Mistral-7B-Instruct-v0.2",
  ollama: "llama3.2",
};

export interface ResolvedModel {
  model: string;
  replaced: boolean;
  from?: string;
}

/**
 * Résout le modèle effectif d'un provider en remplaçant automatiquement
 * un modèle obsolète par son remplacement recommandé.
 */
export function resolveModel(
  provider: string,
  model?: string
): ResolvedModel {
  const current = model || DEFAULT_MODELS[provider];
  const dep = DEPRECATIONS[provider]?.find(d => d.deprecated === current);
  if (dep) {
    return { model: dep.replacement, replaced: true, from: dep.deprecated };
  }
  return { model: current, replaced: false };
}

/** Retourne la liste des dépréciations connues d'un provider. */
export function getKnownDeprecations(provider: string): ModelDeprecation[] {
  return DEPRECATIONS[provider] ?? [];
}

/**
 * Vérification live : liste des modèles actifs exposés par l'API du provider.
 * Best-effort — retourne [] si l'endpoint est indisponible ou nécessite une clé.
 */
export async function fetchActiveModels(
  provider: string,
  apiKey: string
): Promise<string[]> {
  try {
    if (provider === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      return data.data?.map(m => m.id) ?? [];
    }

    if (provider === "aimlapi") {
      const res = await fetch("https://api.aimlapi.com/v1/models", {
        headers: { authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      return data.data?.map(m => m.id) ?? [];
    }

    return [];
  } catch {
    return [];
  }
}

/** Vérifie si un modèle est présent dans la liste live des modèles actifs. */
export function isModelActive(model: string, activeModels: string[]): boolean {
  if (activeModels.length === 0) return true; // liste indisponible → pas de conclusion
  return activeModels.includes(model);
}