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

  it("liste les providers par défaut sans AIMLAPI", async () => {
    const providers = await listProviders();
    expect(providers.map(p => p.provider)).not.toContain("aimlapi");
    expect(providers.map(p => p.provider)).toEqual(
      expect.arrayContaining(["groq", "google", "minimax", "ollama"])
    );
  });

  it("retourne les providers activés", async () => {
    const enabled = await listEnabledProviders();
    expect(enabled).not.toContain("aimlapi");
    expect(enabled).toContain("groq");
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