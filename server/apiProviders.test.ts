import { describe, it, expect, beforeAll } from "vitest";
import {
  listProviders,
  listEnabledProviders,
  getProviderConfig,
  upsertProvider,
  removeProvider,
  DEFAULT_PROVIDERS,
} from "./_core/apiProviders.js";

describe("apiProviders — liste dynamique des providers", () => {
  beforeAll(async () => {
    // Rétablir l'état par défaut
    for (const p of DEFAULT_PROVIDERS) {
      await upsertProvider({ ...p });
    }
  });

  it("liste les providers par défaut : tous présents, seuls Groq et Google activés", async () => {
    const providers = await listProviders();
    // Tous les providers par défaut figurent dans la liste (le connecteur
    // de clés doit pouvoir les gérer), mais seul le duo de chat Groq +
    // Google est activé : les autres (MiniMax, Ollama, AIMLAPI, Kling,
    // Replicate) attendent une activation explicite de l'admin.
    expect(providers.map(p => p.provider)).toEqual(
      expect.arrayContaining([
        "groq",
        "google",
        "minimax",
        "ollama",
        "aimlapi",
        "kling",
        "replicate",
      ])
    );
    const enabledByDefault = providers.filter(p => p.enabled).map(p => p.provider);
    expect(enabledByDefault).toHaveLength(2);
    expect(enabledByDefault).toEqual(expect.arrayContaining(["groq", "google"]));
  });

  it("retourne les providers activés : fallback du chat limité à Groq et Google", async () => {
    const enabled = await listEnabledProviders();
    expect(enabled).toHaveLength(2);
    expect(enabled).toEqual(expect.arrayContaining(["groq", "google"]));
    expect(enabled).not.toContain("minimax");
    expect(enabled).not.toContain("aimlapi");
  });

  it("récupère la config d'un provider", async () => {
    const config = await getProviderConfig("groq");
    expect(config?.model).toBe("openai/gpt-oss-120b");
  });

  it("ajoute un provider custom", async () => {
    await upsertProvider({
      provider: "openai",
      label: "OpenAI",
      model: "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1/chat/completions",
    });
    const config = await getProviderConfig("openai");
    expect(config?.enabled).toBe(true);
    expect(config?.baseUrl).toBe("https://api.openai.com/v1/chat/completions");
    await removeProvider("openai");
    expect(await getProviderConfig("openai")).toBeUndefined();
  });

  it("supprime un provider", async () => {
    await upsertProvider({
      provider: "testdel",
      label: "Test",
      model: "test",
    });
    await removeProvider("testdel");
    expect(await getProviderConfig("testdel")).toBeUndefined();
  });
});