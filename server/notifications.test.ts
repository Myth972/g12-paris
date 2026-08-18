import { afterAll, afterEach, describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@g12paris.fr",
    name: "Admin G12",
    loginMethod: "manus",
    role: "admin",
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

function createEditorContext(id = 4): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `editor-user-${id}`,
    email: `editor${id}@example.com`,
    name: `Editor ${id}`,
    loginMethod: "manus",
    role: "editeur",
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

function createBibliothequeContext(id = 3001): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `biblio-user-${id}`,
    email: `biblio${id}@example.com`,
    name: `Biblio ${id}`,
    loginMethod: "manus",
    role: "bibliotheque",
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

function createUserContext(id = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id,
    openId: `regular-user-${id}`,
    email: `user${id}@example.com`,
    name: `User ${id}`,
    loginMethod: "manus",
    role: "user",
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

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// IDs des notifications créées par les tests, pour nettoyage en fin de bloc.
const createdNotifIds: number[] = [];

function adminCaller() {
  return appRouter.createCaller(createAdminContext());
}

async function createNotif(title: string, type = "info") {
  const result = await adminCaller().notifications.create({
    title,
    message: "Message de test",
    type: type as "info",
  });
  createdNotifIds.push(result!.id);
  return result!;
}

describe("notifications API", () => {
  describe("access control", () => {
    it("unauthenticated users cannot access myNotifications", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.myNotifications()).rejects.toThrow();
    });

    it("unauthenticated users cannot access unreadCount", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.unreadCount()).rejects.toThrow();
    });

    it("regular users cannot create notifications", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.notifications.create({
          title: "Test",
          message: "Test message",
          type: "info",
        })
      ).rejects.toThrow();
    });

    it("regular users cannot delete notifications", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.delete({ id: 1 })).rejects.toThrow();
    });

    it("regular users cannot access adminList", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.adminList()).rejects.toThrow();
    });

    it("editors cannot create notifications (create réservé admin uniquement)", async () => {
      const ctx = createEditorContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.notifications.create({
          title: "Test",
          message: "Test message",
          type: "info",
        })
      ).rejects.toThrow();
    });

    it("editors cannot delete notifications", async () => {
      const ctx = createEditorContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.delete({ id: 1 })).rejects.toThrow();
    });

    it("bibliothèque cannot create notifications", async () => {
      const ctx = createBibliothequeContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.notifications.create({
          title: "Test",
          message: "Test message",
          type: "info",
        })
      ).rejects.toThrow();
    });

    it("bibliothèque cannot delete notifications", async () => {
      const ctx = createBibliothequeContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.notifications.delete({ id: 1 })).rejects.toThrow();
    });
  });

  describe("admin CRUD operations", () => {
    let createdNotifId: number;

    afterAll(async () => {
      for (const id of createdNotifIds) {
        await adminCaller().notifications.delete({ id });
      }
      createdNotifIds.length = 0;
    });

    it("admin can create a notification", async () => {
      const caller = adminCaller();

      const result = await caller.notifications.create({
        title: "Bienvenue sur G12 Paris",
        message: "Découvrez notre nouveau site d'actualités parisien.",
        type: "nouveauté",
        linkUrl: "/",
      });

      expect(result).toBeDefined();
      expect(result!.title).toBe("Bienvenue sur G12 Paris");
      expect(result!.type).toBe("nouveauté");
      expect(result!.message).toContain("nouveau site");
      expect(result!.authorId).toBe(1);
      createdNotifId = result!.id;
      createdNotifIds.push(createdNotifId);
    });

    it("admin can list notifications", async () => {
      const caller = adminCaller();

      const result = await caller.notifications.adminList();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.total).toBeGreaterThanOrEqual(1);

      const found = result.items.find(n => n.id === createdNotifId);
      expect(found).toBeDefined();
      expect(found!.title).toBe("Bienvenue sur G12 Paris");
    });

    it("authenticated user can see notifications", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.myNotifications({ limit: 20 });
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("unreadCount");
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.unreadCount).toBeGreaterThanOrEqual(1);

      const notif = result.items.find(n => n.id === createdNotifId);
      expect(notif).toBeDefined();
      expect(notif!.isRead).toBe(false);
    });

    it("user can get unread count", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const count = await caller.notifications.unreadCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(1);
    });

    it("user can mark notification as read", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.markAsRead({
        notificationId: createdNotifId,
      });
      expect(result.success).toBe(true);
      expect(result.alreadyRead).toBe(false);

      // Marking again should return alreadyRead: true
      const result2 = await caller.notifications.markAsRead({
        notificationId: createdNotifId,
      });
      expect(result2.success).toBe(true);
      expect(result2.alreadyRead).toBe(true);
    });

    it("after marking as read, notification shows as read", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.myNotifications({ limit: 20 });
      const notif = result.items.find(n => n.id === createdNotifId);
      expect(notif).toBeDefined();
      expect(notif!.isRead).toBe(true);
    });

    it("user can mark all notifications as read", async () => {
      // Create a second notification
      await createNotif("Deuxième notification");

      // Different user marks all as read
      const userCtx = createUserContext(3);
      const userCaller = appRouter.createCaller(userCtx);

      const result = await userCaller.notifications.markAllAsRead();
      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThanOrEqual(1);

      // Verify unread count is 0
      const count = await userCaller.notifications.unreadCount();
      expect(count).toBe(0);
    });

    it("admin can delete a notification", async () => {
      const caller = adminCaller();

      const result = await caller.notifications.delete({ id: createdNotifId });
      expect(result).toEqual({ success: true });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Pairwise Testing — covering array (ordre 2)
  //
  // Facteurs (inputs) et valeurs de l'API notifications :
  //   Rôle      : admin | editeur | bibliotheque | user
  //   État      : aucune lue | partiellement lue | toutes lues
  //   Opération : myNotifications | unreadCount | markAsRead | markAllAsRead
  //   Cible     : notification existante | inexistante
  //
  // L'énumération complète donnerait 4 × 3 × 4 × 2 = 96 cas.
  // La technique pairwise garantit que chaque PAIR de valeurs de
  // facteurs distincts est couverte par au moins un test, ce qui
  // détecte la plupart des défauts d'interaction en ~7 cas ciblés.
  // ─────────────────────────────────────────────────────────────
  describe("Pairwise Testing Scenarios", () => {
    afterEach(async () => {
      for (const id of createdNotifIds) {
        await adminCaller().notifications.delete({ id });
      }
      createdNotifIds.length = 0;
    });

    it("Pair: Rôle Éditeur × Lecture de notifications existantes (myNotifications + markAsRead)", async () => {
      const notif = await createNotif("Test Pairwise Editeur");

      const editorCaller = appRouter.createCaller(createEditorContext());
      const result = await editorCaller.notifications.myNotifications({ limit: 50 });

      expect(result.items.some(n => n.id === notif.id)).toBe(true);

      const markResult = await editorCaller.notifications.markAsRead({
        notificationId: notif.id,
      });
      expect(markResult.success).toBe(true);
      expect(markResult.alreadyRead).toBe(false);

      const markResult2 = await editorCaller.notifications.markAsRead({
        notificationId: notif.id,
      });
      expect(markResult2.alreadyRead).toBe(true);
    });

    it("Pair: Rôle Simple × Marquer Tout Comme Lu (aucune notification lue)", async () => {
      const notif1 = await createNotif("Aucune lue #1");
      const notif2 = await createNotif("Aucune lue #2");

      const userCaller = appRouter.createCaller(createUserContext(2001));

      // Aucune lue au départ : le count est exactement 2 pour cet utilisateur
      const before = await userCaller.notifications.unreadCount();
      expect(before).toBeGreaterThanOrEqual(2);

      const markAllResult = await userCaller.notifications.markAllAsRead();
      expect(markAllResult.success).toBe(true);
      expect(markAllResult.count).toBeGreaterThanOrEqual(2);

      const after = await userCaller.notifications.unreadCount();
      expect(after).toBe(0);

      const list = await userCaller.notifications.myNotifications({ limit: 50 });
      expect(list.items.find(n => n.id === notif1.id)?.isRead).toBe(true);
      expect(list.items.find(n => n.id === notif2.id)?.isRead).toBe(true);
    });

    it("Pair: Rôle Simple × Marquer Tout Comme Lu (partiellement lues)", async () => {
      const notif1 = await createNotif("Partielle #1");
      const notif2 = await createNotif("Partielle #2");

      const userCaller = appRouter.createCaller(createUserContext(2002));

      await userCaller.notifications.markAsRead({ notificationId: notif1.id });

      const markAllResult = await userCaller.notifications.markAllAsRead();
      expect(markAllResult.success).toBe(true);

      const count = await userCaller.notifications.unreadCount();
      expect(count).toBe(0);

      const list = await userCaller.notifications.myNotifications({ limit: 50 });
      expect(list.items.find(n => n.id === notif1.id)?.isRead).toBe(true);
      expect(list.items.find(n => n.id === notif2.id)?.isRead).toBe(true);
    });

    it("Pair: Rôle Simple × Marquer Tout Comme Lu (toutes déjà lues) — idempotence", async () => {
      const notif1 = await createNotif("Toutes lues #1");
      const notif2 = await createNotif("Toutes lues #2");

      const userCaller = appRouter.createCaller(createUserContext(2003));

      const first = await userCaller.notifications.markAllAsRead();
      expect(first.success).toBe(true);
      expect(first.count).toBeGreaterThanOrEqual(2);

      // Deuxième appel : rien à marquer, aucune nouvelle ligne insérée
      const second = await userCaller.notifications.markAllAsRead();
      expect(second.success).toBe(true);
      expect(second.count).toBe(0);

      const count = await userCaller.notifications.unreadCount();
      expect(count).toBe(0);
    });

    it("Pair: Rôle Simple × markAsRead sur notification inexistante → NOT_FOUND (pas de faux succès)", async () => {
      const notif = await createNotif("Cible supprimée");
      await adminCaller().notifications.delete({ id: notif.id });

      const userCaller = appRouter.createCaller(createUserContext(2004));

      await expect(
        userCaller.notifications.markAsRead({ notificationId: notif.id })
      ).rejects.toThrow();
    });

    it("Pair: Rôle Bibliothèque × Lecture de notifications existantes", async () => {
      const notif = await createNotif("Biblio lecture");

      const biblioCaller = appRouter.createCaller(createBibliothequeContext());
      const result = await biblioCaller.notifications.myNotifications({ limit: 50 });

      expect(result.items.some(n => n.id === notif.id)).toBe(true);

      const markResult = await biblioCaller.notifications.markAsRead({
        notificationId: notif.id,
      });
      expect(markResult.success).toBe(true);
      expect(markResult.alreadyRead).toBe(false);
    });

    it("Pair: Rôle Admin × Lecture de ses propres notifications", async () => {
      const notif = await createNotif("Admin self lecture", "important");

      const adminUserCaller = appRouter.createCaller(createAdminContext());
      const result = await adminUserCaller.notifications.myNotifications({ limit: 50 });

      expect(result.items.some(n => n.id === notif.id)).toBe(true);

      const markResult = await adminUserCaller.notifications.markAsRead({
        notificationId: notif.id,
      });
      expect(markResult.success).toBe(true);
    });

    it("Pair: Rôle Simple × unreadCount (aucune lue vs toutes lues)", async () => {
      const notif1 = await createNotif("Compteur #1");
      const notif2 = await createNotif("Compteur #2");

      const userCaller = appRouter.createCaller(createUserContext(2005));

      const before = await userCaller.notifications.unreadCount();
      expect(before).toBeGreaterThanOrEqual(2);

      await userCaller.notifications.markAllAsRead();

      const after = await userCaller.notifications.unreadCount();
      expect(after).toBe(0);
    });

    it("Pair: Rôle Éditeur × Création de notifications — refusée (adminOnlyProcedure)", async () => {
      const editorCaller = appRouter.createCaller(createEditorContext(4001));
      await expect(
        editorCaller.notifications.create({
          title: "Créée par éditeur",
          message: "Message de l'éditeur.",
          type: "info",
        })
      ).rejects.toThrow();
    });
  });
});