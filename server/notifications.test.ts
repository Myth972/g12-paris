import { describe, expect, it } from "vitest";
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
    res: { clearCookie: () => {} } as TrpcContext["res"],
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
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
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
  });

  describe("admin CRUD operations", () => {
    let createdNotifId: number;

    it("admin can create a notification", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

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
    });

    it("admin can list notifications", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.adminList();
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.total).toBeGreaterThanOrEqual(1);

      const found = result.items.find((n) => n.id === createdNotifId);
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

      const notif = result.items.find((n) => n.id === createdNotifId);
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
      const notif = result.items.find((n) => n.id === createdNotifId);
      expect(notif).toBeDefined();
      expect(notif!.isRead).toBe(true);
    });

    it("user can mark all notifications as read", async () => {
      const ctx = createAdminContext();
      const adminCaller = appRouter.createCaller(ctx);

      // Create a second notification
      await adminCaller.notifications.create({
        title: "Deuxième notification",
        message: "Un autre message important.",
        type: "info",
      });

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
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.notifications.delete({ id: createdNotifId });
      expect(result).toEqual({ success: true });
    });
  });
});
