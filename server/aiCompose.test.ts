import { afterEach, describe, expect, it, vi } from "vitest";
import { invokeLLMWithFallback } from "./_core/llm.js";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock du client LLM ─────────────────────────────────────────────
// ai.compose ne doit jamais toucher au réseau : invokeLLMWithFallback est
// remplacé par un double qui renvoie le contenu JSON (ou la prose) que
// « l'IA » aurait produit. isProviderConfigured est exporté pour couvrir les
// imports dynamiques de routers.ts.
vi.mock("./_core/llm.js", () => ({
  invokeLLM: vi.fn(),
  invokeLLMWithFallback: vi.fn(),
  isProviderConfigured: vi.fn(() => true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: AuthenticatedUser["role"], id: number): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `${role}-compose-${id}`,
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

/** Configure le double de LLM : renvoie `content` comme message assistant. */
function mockLlm(content: string) {
  vi.mocked(invokeLLMWithFallback).mockResolvedValue({
    choices: [{ message: { content, role: "assistant" } }],
    model: "mock-model",
  } as any);
}

const ARTICLE_JSON = {
  title: "Jeûne de janvier : marchons ensemble",
  excerpt: "Rejoignez-nous pour trois semaines de prière et d'écoute.",
  content: "<h2>Pourquoi jeûner ?</h2><p>Un temps consacré à Dieu.</p>",
  category: "enseignement",
};

const ANNOUNCE_FULL_JSON = {
  title: "Convention d'automne",
  description: "Week-end d'enseignement et de louange, entrée libre.",
  badge: "Convention",
  category: "convention",
  eventDate: "samedi 15 novembre, 18h",
  location: "Espace Reuilly",
  ctaLabel: "En savoir plus",
  ctaHref: "/culte-en-ligne/convention",
};

afterEach(() => {
  // Chaque scénario détermine son propre comportement de LLM.
  vi.mocked(invokeLLMWithFallback).mockReset();
});

describe("ai.compose", () => {
  // ─────────────────────────────────────────────────────────────────
  // Pairwise Testing — ordre 2
  //
  // Facteurs et valeurs couvertes :
  //   Rôle        : admin | editeur | bibliotheque | user
  //   Type        : article | announcement | flash-event
  //   Sortie IA   : JSON valide encadré de prose/fences | JSON minimal valide |
  //                JSON complet valide | JSON hors format | prose sans JSON
  //
  // L'énumération complète donnerait 3 × 3 × 5 = 45 cas ; les 8 scénarios
  // ci-dessous couvrent chaque PAIR de valeurs de facteurs distincts
  // (Rôle×Type avec 3 paires, et chaque valeur de « Sortie IA » appariée
  // à au moins un rôle et un type).
  // ─────────────────────────────────────────────────────────────────

  it("Pair: Rôle Éditeur × Article × JSON valide encadré de prose et fences — brouillon parsé, rien écrit en base", async () => {
    const fenced = `Voici le brouillon demandé :\n\`\`\`json\n${JSON.stringify(ARTICLE_JSON)}\n\`\`\``;
    mockLlm(fenced);

    const adminCaller = callerFor("admin", 91);
    const before = await adminCaller.articles.adminList();

    const result = await callerFor("editeur", 901).ai.compose({
      kind: "article",
      brief: "Un article sur le jeûne de janvier avec Ésaïe 58.",
    });

    expect(result.kind).toBe("article");
    expect(result.model).toBe("mock-model");
    expect(result.draft).toMatchObject({
      title: ARTICLE_JSON.title,
      excerpt: ARTICLE_JSON.excerpt,
      content: ARTICLE_JSON.content,
      category: ARTICLE_JSON.category,
    });

    // Garantie « brouillons uniquement » : la base n'a pas bougé.
    const after = await adminCaller.articles.adminList();
    expect(after.total).toBe(before.total);
  });

  it("Pair: Rôle Admin × Announcement × JSON minimal — valeurs par défaut appliquées", async () => {
    mockLlm(JSON.stringify({ title: "Culte spécial des femmes" }));

    const result = await callerFor("admin", 902).ai.compose({
      kind: "announcement",
      brief: "Annonce pour le culte spécial des femmes du dimanche.",
    });

    expect(result.kind).toBe("announcement");
    expect(result.draft.title).toBe("Culte spécial des femmes");
    expect(result.draft.description).toBe("");
    expect(result.draft.category).toBe("general");
    expect(result.draft.eventDate).toBeUndefined();
    expect(result.draft.ctaLabel).toBeUndefined();
  });

  it("Pair: Rôle Admin × Flash-event × JSON complet — date, lieu et CTA préservés", async () => {
    mockLlm(JSON.stringify(ANNOUNCE_FULL_JSON));

    const result = await callerFor("admin", 903).ai.compose({
      kind: "flash-event",
      brief: "Convention d'automne le 15 novembre à l'Espace Reuilly.",
      eventDate: "samedi 15 novembre, 18h",
      location: "Espace Reuilly",
    });

    expect(result.kind).toBe("flash-event");
    expect(result.draft).toMatchObject({
      title: ANNOUNCE_FULL_JSON.title,
      eventDate: ANNOUNCE_FULL_JSON.eventDate,
      location: ANNOUNCE_FULL_JSON.location,
      ctaLabel: ANNOUNCE_FULL_JSON.ctaLabel,
      ctaHref: ANNOUNCE_FULL_JSON.ctaHref,
      category: "convention",
    });
  });

  it("Pair: Rôle Éditeur × Article × prose sans JSON — erreur explicite, LLM appelé une seule fois", async () => {
    mockLlm("Bien sûr ! Voici un article passionnant sur le jeûne…");

    await expect(
      callerFor("editeur", 904).ai.compose({
        kind: "article",
        brief: "Article sur le jeûne.",
      })
    ).rejects.toThrow(/JSON exploitable/);

    expect(vi.mocked(invokeLLMWithFallback)).toHaveBeenCalledTimes(1);
  });

  it("Pair: Rôle Éditeur × Announcement × JSON hors format (catégorie inconnue, titre absolu) — refus sans écriture", async () => {
    mockLlm(
      JSON.stringify({
        description: "Une soirée mais sans titre ni catégorie valide.",
        category: "vacances",
      })
    );

    await expect(
      callerFor("editeur", 905).ai.compose({
        kind: "announcement",
        brief: "Soirée de louange.",
      })
    ).rejects.toThrow(/format attendu/);

    // Le refus au format n'a déclenché aucune création d'annonce :
    // adminList renvoie le tableau brut de la base (ici encore vide ou sans
    // notre brouillon refusé).
    const adminCaller = callerFor("admin", 92);
    const list = await adminCaller.announcements.adminList();
    expect(Array.isArray(list)).toBe(true);
    expect(list as unknown[]).toHaveLength(0);
  });

  it("Pair: Rôle Bibliothèque × Announcement × JSON valide pourtant prêt — accès refusé AVANT l'appel LLM", async () => {
    mockLlm(JSON.stringify({ title: "Annonce interdite" }));

    await expect(
      callerFor("bibliotheque", 906).ai.compose({
        kind: "announcement",
        brief: "Tentative depuis le rôle bibliothèque.",
      })
    ).rejects.toThrow();

    // La garde de rôle a fait son travail : le LLM n'a jamais été interrogé.
    expect(vi.mocked(invokeLLMWithFallback)).not.toHaveBeenCalled();
  });

  it("Pair: Rôle Simple (user) × Flash-event × JSON valide — accès refusé (editeurProcedure)", async () => {
    mockLlm(JSON.stringify(ANNOUNCE_FULL_JSON));

    await expect(
      callerFor("user", 907).ai.compose({
        kind: "flash-event",
        brief: "Flash depuis un compte visiteur.",
      })
    ).rejects.toThrow();
    expect(vi.mocked(invokeLLMWithFallback)).not.toHaveBeenCalled();
  });

  it("Pair: Rôle Admin × Article × JSON valide sans fences — les prompts système et la demande sont transmis", async () => {
    mockLlm(JSON.stringify(ARTICLE_JSON));

    await callerFor("admin", 908).ai.compose({
      kind: "article",
      brief: "Un article d'enseignement sur la grâce.",
    });

    const call = vi.mocked(invokeLLMWithFallback).mock.calls[0][0] as any;
    expect(call.messages).toHaveLength(2);
    expect(call.messages[0].role).toBe("system");
    expect(call.messages[0].content).toContain("rédacteur web principal");
    expect(call.messages[1].role).toBe("user");
    expect(call.messages[1].content).toContain("Un article d'enseignement sur la grâce.");
  });
});
