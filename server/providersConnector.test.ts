import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import {
  DEFAULT_PROVIDERS,
  getProviderConfig,
  listEnabledProviders,
  listProviders,
  upsertProvider,
} from "./_core/apiProviders.js";

// ─── Mock du client LLM ─────────────────────────────────────────────
// Le connecteur ne parle jamais au réseau : le mock garantit que router
// s'importe sans initialisation de providers réelle (convention
// aiCompose.test.ts).
vi.mock("./_core/llm.js", () => ({
  invokeLLM: vi.fn(),
  invokeLLMWithFallback: vi.fn(),
  isProviderConfigured: vi.fn(() => true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: AuthenticatedUser["role"], id: number): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `${role}-connecteur-${id}`,
    email: `${role}${id}@example.com`,
    name: `${role} ${id}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function callerFor(role: AuthenticatedUser["role"], id: number) {
  return appRouter.createCaller(createCtx(role, id));
}

/** Contexte sans utilisateur (visiteur non connecté). */
function anonymCtx(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

const AIMLAPI_ADD = {
  provider: "aimlapi",
  label: "AIMLAPI",
  model: "flux/schnell",
  baseUrl: "https://api.aimlapi.com/v1/images/generations",
  enabled: true,
};

/** Remet AIMLAPI dans son état par défaut après la sagesse (désactivé). */
async function resetAimlapi() {
  const def = DEFAULT_PROVIDERS.find(p => p.provider === "aimlapi");
  await upsertProvider({ ...def! }); // enabled: false par défaut
}

/** État lisible de la blacklist AIMLAPI : présent ? actif ? */
async function aimlapiState() {
  const config = await getProviderConfig("aimlapi");
  return {
    present: config !== undefined,
    enabled: config?.enabled ?? false,
    inFallback: (await listEnabledProviders()).includes("aimlapi"),
  };
}

// ─── Remise en état de la table api_providers ───────────────────────
beforeAll(async () => {
  // État par défaut garanti (upsert = idempotent), quel que soit l'ordre
  // d'exécution des fichiers de test sur ce worker.
  for (const p of DEFAULT_PROVIDERS) {
    await upsertProvider({ ...p });
  }
});

afterAll(async () => {
  // L'état du worker doit ressortir propre pour les fichiers suivants.
  await upsertProvider({ provider: "tmp-connecteur", label: "Supprimable", model: "test-x" });
  const { removeProvider } = await import("./_core/apiProviders.js");
  await removeProvider("tmp-connecteur");
  for (const p of DEFAULT_PROVIDERS) {
    await upsertProvider({ ...p });
  }
});

describe("connecteur de clés — ai.providers.add / remove", () => {
  // ─────────────────────────────────────────────────────────────────
  // Pairwise Testing — ordre 2
  //
  // Facteurs et valeurs couvertes :
  //   Rôle   : admin | editeur | bibliotheque | user | anonyme
  //   Action : activation | désactivation | suppression (blacklist) |
  //            restauration | entrée invalide
  //
  // L'énumération 5 × 5 = 25 cas est inutile : les 8 scénarios ci-dessous
  // couvrent chaque PAIRE de valeurs distinctes (chaque rôle croisé avec
  // au moins une action, chaque action appariée à un rôle).
  //
  // Comportement imposé : les procédures du connecteur sont
  // `adminOnlyProcedure` (l'UI l'est déjà ; l'API alignée dessus).
  // ─────────────────────────────────────────────────────────────────

  it("Pair: Admin × Activation AIMLAPI — activable à chaud, entre dans le fallback du chat", async () => {
    await resetAimlapi(); // état par défaut : désactivé
    expect((await aimlapiState()).inFallback).toBe(false);

    const result = await callerFor("admin", 101).ai.providers.add(AIMLAPI_ADD);
    expect(result).toEqual({ ok: true });

    const state = await aimlapiState();
    expect(state.present).toBe(true);
    expect(state.enabled).toBe(true);
    // Choix explicite de l'admin : AIMLAPI rejoint le fallback.
    expect(state.inFallback).toBe(true);

    await resetAimlapi();
  });

  it("Pair: Admin × Désactivation (enabled:false) — AIMLAPI sort du fallback sans quitter la liste", async () => {
    // Partir d'un état activé pour prouver la bascule inverse.
    await callerFor("admin", 102).ai.providers.add(AIMLAPI_ADD);
    expect((await aimlapiState()).inFallback).toBe(true);

    // Basculer un provider existant passe par la charge complète (comme
    // l'UI : label/model/baseUrl sont requis par le schéma du connecteur).
    await callerFor("admin", 102).ai.providers.add({ ...AIMLAPI_ADD, enabled: false });

    const state = await aimlapiState();
    expect(state.present).toBe(true); // reste gérable dans le connecteur
    expect(state.enabled).toBe(false);
    expect(state.inFallback).toBe(false);
  });

  it("Pair: Admin × Suppression (blacklist) puis restauration — AIMLAPI réactivable", async () => {
    await callerFor("admin", 103).ai.providers.add(AIMLAPI_ADD);

    await callerFor("admin", 103).ai.providers.remove({ provider: "aimlapi" });
    const afterRemove = await aimlapiState();
    expect(afterRemove.present).toBe(false); // plus du tout dans la liste
    expect(afterRemove.inFallback).toBe(false);

    // La blacklist est réversible : le provider redevient gérable
    // (recréé désactivé = état par défaut, jamais auto-activé).
    await callerFor("admin", 103).ai.providers.add({ ...AIMLAPI_ADD, enabled: false });
    const restored = await aimlapiState();
    expect(restored.present).toBe(true);
    expect(restored.enabled).toBe(false);
    expect(restored.inFallback).toBe(false);
  });

  it("Pair: Admin × Entrée invalide (baseUrl non-URL) — validation Zod, rien persisté", async () => {
    await resetAimlapi();
    const before = await aimlapiState();

    await expect(
      callerFor("admin", 104).ai.providers.add({
        provider: "aimlapi",
        label: "AIMLAPI",
        model: "flux/schnell",
        baseUrl: "pas-une-url",
      })
    ).rejects.toThrow();

    // Aucun effet de bord : l'état n'a pas bougé.
    const after = await aimlapiState();
    expect(after.present).toBe(before.present);
    expect(after.enabled).toBe(before.enabled);
  });

  it("Pair: Admin × Normalisation de l'identifiant — « AIMLAPI » majuscules devient la même ligne", async () => {
    await resetAimlapi();
    await callerFor("admin", 105).ai.providers.add({ ...AIMLAPI_ADD, provider: "AIMLAPI" });

    const state = await aimlapiState();
    // Pas de doublon : l'upsert a touché la ligne existante.
    expect(state.present).toBe(true);
    expect(state.enabled).toBe(true);
    const all = await listProviders();
    expect(all.filter(p => /^aimlapi$/i.test(p.provider))).toHaveLength(1);

    await resetAimlapi();
  });

  it("Pair: Éditeur × Activation — refus FORBIDDEN, sans aucun effet", async () => {
    await resetAimlapi();
    const before = await aimlapiState();

    await expect(
      callerFor("editeur", 106).ai.providers.add(AIMLAPI_ADD)
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);

    const after = await aimlapiState();
    expect(after).toEqual({
      present: before.present,
      enabled: before.enabled,
      inFallback: false,
    });
  });

  it("Pair: Bibliothécaire × Suppression — refus FORBIDDEN, provider intact", async () => {
    await resetAimlapi(); // présent (désactivé)
    const before = await aimlapiState();

    await expect(
      callerFor("bibliotheque", 107).ai.providers.remove({ provider: "aimlapi" })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);

    const after = await aimlapiState();
    expect(after.present).toBe(before.present); // non blacklisté par un tiers
  });

  it("Pair: User simple × Activation — refus FORBIDDEN", async () => {
    await resetAimlapi();
    await expect(
      callerFor("user", 108).ai.providers.add(AIMLAPI_ADD)
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
    expect((await aimlapiState()).enabled).toBe(false);
  });

  it("Pair: Anonyme (non connecté) × Activation — refus FORBIDDEN", async () => {
    await expect(
      appRouter.createCaller(anonymCtx()).ai.providers.add(AIMLAPI_ADD)
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
    expect((await aimlapiState()).enabled).toBe(false);
  });
});

describe("connecteur de clés — ai.providers.toggle", () => {
  // Complément Pairwise de la procédure dédiée à l'interrupteur : charge
  // minimale { provider, enabled }, label/model/baseUrl intacts.

  it("Admin × toggle sur provider existant — bascule sans toucher label/model", async () => {
    await resetAimlapi(); // désactivé par défaut
    const before = await getProviderConfig("aimlapi");
    expect(before?.model).toBe("flux/schnell");

    await callerFor("admin", 201).ai.providers.toggle({
      provider: "aimlapi",
      enabled: true,
    });
    let config = await getProviderConfig("aimlapi");
    expect(config?.enabled).toBe(true);
    // Charge minimale : label, modèle et baseUrl conservés à l'identique.
    expect(config?.model).toBe("flux/schnell");
    expect(config?.baseUrl).toBe("https://api.aimlapi.com/v1/images/generations");

    // Idempotent : re-basculer au même état ne trompe personne.
    await callerFor("admin", 201).ai.providers.toggle({
      provider: "aimlapi",
      enabled: true,
    });
    expect((await getProviderConfig("aimlapi"))?.enabled).toBe(true);

    await callerFor("admin", 201).ai.providers.toggle({
      provider: "aimlapi",
      enabled: false,
    });
    config = await getProviderConfig("aimlapi");
    expect(config?.enabled).toBe(false);
    expect(config?.model).toBe("flux/schnell"); // toujours intact
  });

  it("Admin × toggle sur provider inconnu — NOT_FOUND, rien créé", async () => {
    await expect(
      callerFor("admin", 202).ai.providers.toggle({
        provider: "inconnu-tmp",
        enabled: true,
      })
    ).rejects.toThrow(/introuvable|NOT_FOUND/i);
    expect(await getProviderConfig("inconnu-tmp")).toBeUndefined();
  });

  it("Éditeur × toggle — refus FORBIDDEN, état inchangé", async () => {
    await resetAimlapi();
    await expect(
      callerFor("editeur", 203).ai.providers.toggle({
        provider: "aimlapi",
        enabled: true,
      })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
    expect((await aimlapiState()).enabled).toBe(false);
  });
});

describe("connecteur de clés — ai.apiKeys (les clés elles-mêmes)", () => {
  // Pair : Rôle (admin | editeur | bibliotheque | user) × Action (set |
  // list | remove). Le connecteur de clés est réservé à l'admin : poser,
  // retirer ou même LISTER des clés (valeurs masquées) est interdit aux
  // autres rôles.
  // Clé de test : provider fictif, jamais un vrai (groq/google…). Le
  // statut de la clé reste masqué dans list (jamais la valeur brute).
  const TMP = "tmp-connecteur-cle";
  const RAW = "k-test-0123456789abcdef";

  /** Le statut n'est listé que pour les providers connus : créer la ligne. */
  async function seedTmpProvider() {
    const { upsertProvider } = await import("./_core/apiProviders.js");
    await upsertProvider({ provider: TMP, label: TMP, model: "test-cle" });
  }

  afterAll(async () => {
    const { removeApiKey, resetApiKeyCache } = await import("./_core/apiKeys.js");
    await removeApiKey(TMP);
    resetApiKeyCache();
    const { removeProvider } = await import("./_core/apiProviders.js");
    await removeProvider(TMP);
  });

  it("Admin × set + list — clé posée, visible seulement masquée", async () => {
    await seedTmpProvider();
    await callerFor("admin", 301).ai.apiKeys.set({
      provider: TMP,
      value: RAW,
    });

    const statuses = await callerFor("admin", 301).ai.apiKeys.list();
    const row = statuses.find(s => s.provider === TMP);
    expect(row?.configured).toBe(true);
    expect(row?.source).toBe("db");
    // La réponse liste des valeurs masquées, jamais la clé en clair.
    expect(JSON.stringify(statuses)).not.toContain(RAW);
    expect(row?.masked).not.toBe(RAW);
    expect(row?.masked.length).toBeGreaterThan(0);
  });

  it("Éditeur × set — refus FORBIDDEN, clé jamais créée", async () => {
    await seedTmpProvider();
    // État propre : la clé posée par le scénario précédent est retirée,
    // pour prouver que c'est bien le refus qui empêche la création.
    const { removeApiKey, resetApiKeyCache } = await import("./_core/apiKeys.js");
    await removeApiKey(TMP);
    resetApiKeyCache();

    await expect(
      callerFor("editeur", 302).ai.apiKeys.set({ provider: TMP, value: RAW })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
    // Le provider figure dans la liste (ligne créée pour le test) mais
    // AUCUNE clé n'a été posée par l'éditeur refusé.
    const row = (await callerFor("admin", 302).ai.apiKeys.list())
      .find(s => s.provider === TMP);
    expect(row?.configured ?? false).toBe(false);
    expect(row?.source ?? "none").not.toBe("db");
  });

  it("Bibliothécaire × list — refus FORBIDDEN", async () => {
    await seedTmpProvider();
    await callerFor("admin", 303).ai.apiKeys.set({ provider: TMP, value: RAW });
    await expect(
      callerFor("bibliotheque", 303).ai.apiKeys.list()
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("User simple × remove — refus FORBIDDEN, clé intacte", async () => {
    await seedTmpProvider();
    await callerFor("admin", 304).ai.apiKeys.set({ provider: TMP, value: RAW });
    await expect(
      callerFor("user", 304).ai.apiKeys.remove({ provider: TMP })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
    // La clé est toujours là (l'admin peut la voir).
    const row = (await callerFor("admin", 304).ai.apiKeys.list())
      .find(s => s.provider === TMP);
    expect(row?.configured).toBe(true);
  });
});


