import { describe, it, expect } from "vitest";
import {
  resolveModel,
  DEFAULT_MODELS,
  getKnownDeprecations,
  isModelActive,
} from "./_core/modelRegistry.js";

describe("modelRegistry — obsolescence des modèles", () => {
  describe("resolveModel", () => {
    it("remplace un modèle Groq obsolète", () => {
      const res = resolveModel("groq", "llama-3.3-70b-versatile");
      expect(res.replaced).toBe(true);
      expect(res.model).toBe("openai/gpt-oss-120b");
      expect(res.from).toBe("llama-3.3-70b-versatile");
    });

    it("remplace un modèle Google obsolète", () => {
      const res = resolveModel("google", "gemini-2.0-flash-exp");
      expect(res.replaced).toBe(true);
      expect(res.model).toBe("gemini-3.5-flash");
    });

    it("remplace un modèle MiniMax obsolète", () => {
      const res = resolveModel("minimax", "MiniMax-M1");
      expect(res.replaced).toBe(true);
      expect(res.model).toBe("MiniMax-M2.1");
    });

    it("garde un modèle actuel tel quel", () => {
      const res = resolveModel("groq", "openai/gpt-oss-120b");
      expect(res.replaced).toBe(false);
      expect(res.model).toBe("openai/gpt-oss-120b");
    });

    it("utilise le modèle par défaut si aucun fourni", () => {
      const res = resolveModel("groq");
      expect(res.model).toBe(DEFAULT_MODELS.groq);
      expect(res.replaced).toBe(false);
    });
  });

  describe("getKnownDeprecations", () => {
    it("connaît la dépréciation Groq", () => {
      const deps = getKnownDeprecations("groq");
      expect(deps.some(d => d.deprecated === "llama-3.3-70b-versatile")).toBe(true);
      expect(deps.some(d => d.deprecated === "llama-3.1-8b-instant")).toBe(true);
    });
  });

  describe("isModelActive", () => {
    it("retourne true si le modèle est dans la liste live", () => {
      expect(isModelActive("openai/gpt-oss-120b", ["openai/gpt-oss-120b", "qwen/qwen3.6-27b"])).toBe(true);
    });

    it("retourne false si absent de la liste live", () => {
      expect(isModelActive("llama-3.3-70b-versatile", ["openai/gpt-oss-120b"])).toBe(false);
    });

    it("retourne true si la liste est vide (indisponible)", () => {
      expect(isModelActive("nimporte-quoi", [])).toBe(true);
    });
  });
});