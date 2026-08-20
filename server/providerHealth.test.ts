import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  classifyError,
  recordProviderSuccess,
  recordProviderFailure,
  recordFallback,
  getAllProviderHealth,
  getProviderHealth,
  getFallbackEvents,
  isProviderAvailable,
  resetProviderHealth,
} from "./_core/providerHealth.js";

describe("providerHealth — circuit breaker", () => {
  beforeEach(() => {
    for (const p of ["groq", "google", "minimax", "aimlapi", "ollama"]) {
      resetProviderHealth(p as any);
    }
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("classifyError", () => {
    it("détecte une clé manquante", () => {
      expect(classifyError(new Error("GROQ_API_KEY is not configured"))).toBe("config");
    });

    it("détecte un timeout", () => {
      expect(classifyError(new Error("LLM invoke timeout (groq): requête annulée après 30s"))).toBe("timeout");
    });

    it("détecte une erreur d'authentification", () => {
      expect(classifyError(new Error("LLM invoke failed (groq): 401 Unauthorized"))).toBe("auth");
      expect(classifyError(new Error("invalid api key"))).toBe("auth");
    });

    it("détecte un rate limit", () => {
      expect(classifyError(new Error("LLM invoke failed: 429 Too Many Requests"))).toBe("rate_limit");
    });

    it("détecte une erreur serveur", () => {
      expect(classifyError(new Error("LLM invoke failed: 500 Internal Server Error"))).toBe("server");
    });

    it("détecte une erreur réseau", () => {
      expect(classifyError(new Error("fetch failed"))).toBe("network");
      expect(classifyError(new Error("connect ECONNREFUSED"))).toBe("network");
    });

    it("retourne unknown par défaut", () => {
      expect(classifyError(new Error("autre chose"))).toBe("unknown");
    });
  });

  describe("recordProviderFailure / cooldown", () => {
    it("passe à degraded après 1 échec, puis cooldown après 3", () => {
      recordProviderFailure("groq", "timeout", "timeout 1");
      expect(getProviderHealth("groq").status).toBe("degraded");
      expect(isProviderAvailable("groq")).toBe(true);

      recordProviderFailure("groq", "timeout", "timeout 2");
      expect(getProviderHealth("groq").status).toBe("degraded");
      expect(isProviderAvailable("groq")).toBe(true);

      recordProviderFailure("groq", "timeout", "timeout 3");
      expect(getProviderHealth("groq").status).toBe("cooldown");
      expect(getProviderHealth("groq").consecutiveFailures).toBe(3);
      expect(isProviderAvailable("groq")).toBe(false);
    });

    it("redevient healthy après un succès", () => {
      recordProviderFailure("groq", "server", "500");
      recordProviderFailure("groq", "server", "500");
      recordProviderFailure("groq", "server", "500");
      expect(isProviderAvailable("groq")).toBe(false);

      recordProviderSuccess("groq");
      expect(getProviderHealth("groq").status).toBe("healthy");
      expect(getProviderHealth("groq").consecutiveFailures).toBe(0);
      expect(isProviderAvailable("groq")).toBe(true);
    });

    it("une clé manquante marque le provider unconfigured sans cooldown", () => {
      recordProviderFailure("minimax", "config", "MINIMAX_API_KEY is not configured");
      const health = getProviderHealth("minimax");
      expect(health.status).toBe("unconfigured");
      expect(health.consecutiveFailures).toBe(0);
      expect(isProviderAvailable("minimax")).toBe(false);
    });

    it("le cooldown expire après la durée définie", () => {
      vi.useFakeTimers();
      recordProviderFailure("groq", "server", "500");
      recordProviderFailure("groq", "server", "500");
      recordProviderFailure("groq", "server", "500");
      expect(isProviderAvailable("groq")).toBe(false);

      // Avancer au-delà de COOLDOWN_MS (60_000)
      vi.advanceTimersByTime(60_001);
      expect(isProviderAvailable("groq")).toBe(true);
    });
  });

  describe("fallback events", () => {
    it("traque les bascules de fallback", () => {
      recordFallback("groq", "google", "timeout", "timeout");
      const events = getFallbackEvents();
      expect(events).toHaveLength(1);
      expect(events[0].from).toBe("groq");
      expect(events[0].to).toBe("google");
      expect(events[0].reason).toBe("timeout");
    });
  });

  describe("getAllProviderHealth", () => {
    it("retourne l'état de tous les providers", () => {
      const all = getAllProviderHealth();
      expect(all.map(h => h.provider)).toEqual(["groq", "google", "minimax", "aimlapi", "ollama"]);
      expect(all.every(h => h.status === "healthy")).toBe(true);
    });
  });
});