import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users, pageContent, conventionRegistrations } from "../drizzle/schema.js";

// ─── Mock du client LLM ─────────────────────────────────────────────
// Aucune de ces procédures ne doit parler au réseau : le connecteur LLM
// est remplacé par un double local (convention aiCompose.test.ts /
// providersConnector.test.ts).
vi.mock("./_core/llm.js", () => ({
  invokeLLM: vi.fn(),
  invokeLLMWithFallback: vi.fn(async () => ({
    choices: [{ message: { content: "Réponse IA de test" } }],
    model: "mock-model",
  })),
  isProviderConfigured: vi.fn(() => true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCtx(role: AuthenticatedUser["role"], id: number): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `${role}-perm-${id}`,
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

function anonymCtx(): TrpcContext {
  return {
    user: undefined,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

const ADMIN = 701;
const EDITEUR = 702;
const BIBLIO = 703;
const USER = 704;

// Compte éditeur de test créé par l'admin, nettoyé en fin de fichier.
let testUserId = 0;

beforeAll(async () => {
  // Nettoyage préventif : aucune trace d'un run précédent du fichier.
  const db = getDb()!;
  await db.delete(users).where(eq(users.openId, "tmp-perm-cible"));
  await db.delete(pageContent).where(eq(pageContent.pageId, "tmp-perm-test"));
  await db
    .delete(conventionRegistrations)
    .where(eq(conventionRegistrations.email, "tmp-perm-conv@example.com"));
});

afterAll(async () => {
  // Remise à zéro : le worker ne doit rien laisser derrière lui.
  const db = getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.openId, "tmp-perm-cible"));
  await db.delete(pageContent).where(eq(pageContent.pageId, "tmp-perm-test"));
  await db
    .delete(conventionRegistrations)
    .where(eq(conventionRegistrations.email, "tmp-perm-conv@example.com"));
  testUserId = 0;
});

describe("users — gestion des comptes réservée à l'admin (adminOnlyProcedure)", () => {
  // ─────────────────────────────────────────────────────────────────
  // Pairwise Testing — Rôle × Action de gestion de compte
  //
  // Avant ce tour, users.list/get/create/updateRole/delete montait sur
  // adminProcedure (= admin + éditeur + bibliothécaire) : un éditeur
  // pouvait créer un compte ADMIN ou se promouvoir lui-même via un
  // simple appel tRPC. L'UI ne rend l'onglet Utilisateurs que pour
  // l'admin (showFullAdmin) ; l'API est alignée dessus.
  // ─────────────────────────────────────────────────────────────────

  it("Pair: Admin × list — visible", async () => {
    const list = await callerFor("admin", ADMIN).users.list();
    expect(Array.isArray(list)).toBe(true);
  });

  it("Pair: Admin × create + delete — cycle complet permis", async () => {
    const created = await callerFor("admin", ADMIN).users.create({
      openId: "tmp-perm-cible",
      name: "Cible de test",
      role: "editeur",
    });
    testUserId = (created as { id: number }).id;
    expect(testUserId).toBeGreaterThan(0);

    const deleted = await callerFor("admin", ADMIN).users.delete({
      userId: testUserId,
    });
    expect(deleted).toEqual({ success: true });
    testUserId = 0; // déjà supprimé par le cycle
  });

  it("Pair: Éditeur × updateRole sur lui-même — refus FORBIDDEN, rôle inchangé", async () => {
    // Compte éditeur créé PAR L'ADMIN (seul habilité) pour la cible.
    const created = await callerFor("admin", ADMIN).users.create({
      openId: "tmp-perm-cible",
      name: "Cible de test",
      role: "editeur",
    });
    testUserId = (created as { id: number }).id;

    await expect(
      callerFor("editeur", EDITEUR).users.updateRole({
        userId: testUserId,
        role: "admin", // tentative d'escalade
      })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);

    // Preuve d'état : le rôle reste « editeur » côté DB.
    const found = (await callerFor("admin", ADMIN).users.list()).find(
      u => u.id === testUserId
    );
    expect(found?.role).toBe("editeur");
  });

  it("Pair: Bibliothécaire × create — refus FORBIDDEN, aucun compte créé", async () => {
    await expect(
      callerFor("bibliotheque", BIBLIO).users.create({
        openId: "tmp-perm-fantome",
        name: "Fantôme",
        role: "admin",
      })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);

    // Aucune trace du compte refusé dans la table users.
    const db = getDb()!;
    const ghosts = await db
      .select()
      .from(users)
      .where(eq(users.openId, "tmp-perm-fantome"));
    expect(ghosts).toHaveLength(0);
  });

  it("Pair: User simple × list — refus FORBIDDEN", async () => {
    await expect(callerFor("user", USER).users.list()).rejects.toThrow(
      /FORBIDDEN|Accès réservé/i
    );
  });

  it("Pair: Anonyme × get — refusé (accès administrateur nécessaire)", async () => {
    // Le middleware de rôles refuse avec FORBIDDEN (« Accès réservé aux
    // rôles ») même sans session : pas de message UNAUTHORIZED dédié.
    await expect(
      appRouter.createCaller(anonymCtx()).users.get({ id: 1 })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });
});

describe("cms (pageContent) — rédaction permise aux éditeurs, pas aux visiteurs", () => {
  // pageContent.create est volontairement editeurProcedure : le CMS est
  // le cœur du métier de rédaction. La matrice vérifie que l'éditeur
  // passe, et que les autres rôles (hors admin) n'entrent pas.

  it("Pair: Éditeur × create — autorisé, contenu créé à son nom", async () => {
    const created = await callerFor("editeur", EDITEUR).pageContent.create({
      pageId: "tmp-perm-test",
      contentType: "image",
      title: "Contenu de test",
      mediaUrl: "https://example.com/test.jpg",
    });
    const id = (created as { id: number }).id;
    expect(id).toBeGreaterThan(0);
    // Traçable : l'auteur est bien l'éditeur appelant.
    expect((created as { authorId?: number }).authorId).toBe(EDITEUR);

    // L'admin nettoie (route delete adminProcedure, objet du test suivant).
    await expect(
      callerFor("admin", ADMIN).pageContent.delete({ id })
    ).resolves.toEqual({ success: true });
  });

  it("Pair: Bibliothécaire × create — refus FORBIDDEN (hors éditeur)", async () => {
    await expect(
      callerFor("bibliotheque", BIBLIO).pageContent.create({
        pageId: "tmp-perm-test",
        contentType: "image",
        title: "Refusé",
        mediaUrl: "https://example.com/x.jpg",
      })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("Pair: User simple × update — refus FORBIDDEN", async () => {
    await expect(
      callerFor("user", USER).pageContent.update({ id: 1, title: "Hack" })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("Pair: Anonyme × adminList — refus", async () => {
    await expect(
      appRouter
        .createCaller(anonymCtx())
        .pageContent.adminList({ pageId: "tmp-perm-test" })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });
});

describe("conventionRegistrations — gestion réservée à l'admin, inscription publique", () => {
  // Avant ce tour, list/listAll/stats/count/delete/toggleActive/bulkDelete
  // montaient sur adminProcedure : un éditeur ou bibliothécaire pouvait
  // consulter (et supprimer) les inscriptions — e-mails et dates person-
  // nels des participants. L'UI ne rend l'onglet Inscriptions que si
  // showFullAdmin ; l'API est alignée dessus. L'inscription publique
  // (create/checkEmail/verifyCode/publicCount) reste accessible à tous.

  let adminRegistrationId = 0;

  it("Pair: Anonyme × stats — refus", async () => {
    await expect(
      appRouter.createCaller(anonymCtx()).conventionRegistrations.stats()
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("Pair: Bibliothécaire × list — refus FORBIDDEN", async () => {
    await expect(
      callerFor("bibliotheque", BIBLIO).conventionRegistrations.list()
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("Pair: Admin × create (public) + toggleActive + delete — cycle permis", async () => {
    // L'inscription elle-même est publique : l'admin utilise la même porte.
    const created = await appRouter
      .createCaller(anonymCtx())
      .conventionRegistrations.create({
        firstName: "Pairwise",
        lastName: "Convention",
        email: "tmp-perm-conv@example.com",
      });
    const registration = (
      created as { registration: { id: number; isActive?: boolean } }
    ).registration;
    adminRegistrationId = registration.id;
    expect(adminRegistrationId).toBeGreaterThan(0);

    // L'admin seul peut basculer le statut puis supprimer la ligne.
    const toggled = await callerFor("admin", ADMIN).conventionRegistrations.toggleActive({
      id: adminRegistrationId,
    });
    expect(toggled).toMatchObject({ success: true });

    const deleted = await callerFor("admin", ADMIN).conventionRegistrations.delete({
      id: adminRegistrationId,
    });
    expect(deleted).toMatchObject({ success: true });
    adminRegistrationId = 0; // déjà supprimé par le cycle
  });

  it("Pair: Éditeur × listAll — refus FORBIDDEN, aucune ligne exposée", async () => {
    await expect(
      callerFor("editeur", EDITEUR).conventionRegistrations.listAll()
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("Pair: User simple × delete — refus FORBIDDEN, ligne intacte", async () => {
    // L'admin crée une ligne de référence, la suppression visitieur est
    // refusée, la ligne existe toujours après coup ; puis nettoyage admin.
    const created = await appRouter
      .createCaller(anonymCtx())
      .conventionRegistrations.create({
        firstName: "Pairwise",
        lastName: "Invite",
        email: "tmp-perm-conv@example.com",
      });
    adminRegistrationId = (
      created as { registration: { id: number } }
    ).registration.id;

    await expect(
      callerFor("user", USER).conventionRegistrations.delete({
        id: adminRegistrationId,
      })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);

    const db = getDb()!;
    const intact = await db
      .select()
      .from(conventionRegistrations)
      .where(eq(conventionRegistrations.email, "tmp-perm-conv@example.com"));
    expect(intact).toHaveLength(1);

    // Nettoyage immédiat par le seul rôle habilité.
    await callerFor("admin", ADMIN).conventionRegistrations.delete({
      id: adminRegistrationId,
    });
    adminRegistrationId = 0;
  });
});

describe("ai.chat — espace admin élargi (staff éditeur inclus), pas aux visiteurs", () => {
  // ai.chat est adminProcedure (admin + éditeur + bibliothécaire) : le
  // chatbot de rédaction est accessible au staff — au contraire du
  // connecteur de clés, adminOnly. ai.compose (éditeur) est déjà couvert
  // par aiCompose.test.ts ; ici on verrouille la frontière visiteur.

  const MESSAGES = [{ role: "user" as const, content: "Bonjour" }];

  it("Pair: Admin × chat — autorisé, réponse LLM retournée", async () => {
    const reply = await callerFor("admin", ADMIN).ai.chat({
      messages: MESSAGES,
    });
    expect(reply).toBe("Réponse IA de test");
  });

  it("Pair: Éditeur × chat — autorisé (staff du chatbot admin)", async () => {
    const reply = await callerFor("editeur", EDITEUR).ai.chat({
      messages: MESSAGES,
    });
    expect(reply).toBe("Réponse IA de test");
  });

  it("Pair: User simple × chat — refus FORBIDDEN", async () => {
    await expect(
      callerFor("user", USER).ai.chat({ messages: MESSAGES })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });

  it("Pair: Anonyme × chat — refus", async () => {
    await expect(
      appRouter
        .createCaller(anonymCtx())
        .ai.chat({ messages: MESSAGES as never })
    ).rejects.toThrow(/FORBIDDEN|Accès réservé/i);
  });
});
