import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create an admin context
function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@g12paris.fr",
      name: "Admin G12",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// Helper to create a regular user context
function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

// Helper to create a public (unauthenticated) context
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as unknown as TrpcContext["res"],
  };
}

describe("articles API", () => {
  describe("public routes", () => {
    it("list returns items and total for public users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.articles.list({ limit: 10, offset: 0 });

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("list with default params works", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.articles.list();

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(result.limit).toBe(12);
      expect(result.offset).toBe(0);
    });

    it("bySlug throws NOT_FOUND for non-existent slug", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.articles.bySlug({ slug: "non-existent-article-slug-xyz" })
      ).rejects.toThrow();
    });

    it("byId throws NOT_FOUND for non-existent id", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.articles.byId({ id: 999999 })).rejects.toThrow();
    });
  });

  describe("admin routes - access control", () => {
    it("adminList rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.articles.adminList()).rejects.toThrow();
    });

    it("adminList rejects regular users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.articles.adminList()).rejects.toThrow();
    });

    it("adminList works for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.articles.adminList();

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
    });

    it("create rejects regular users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.articles.create({
          title: "Test Article",
          content: "Test content",
          category: "actualité",
        })
      ).rejects.toThrow();
    });

    it("delete rejects regular users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.articles.delete({ id: 1 })).rejects.toThrow();
    });
  });

  describe("admin routes - CRUD operations", () => {
    let createdArticleId: number;

    it("admin can create an article", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.articles.create({
        title: "Test Article G12",
        excerpt: "Un article de test",
        content: "Contenu complet de l'article de test pour G12 Paris.",
        category: "actualité",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        published: true,
      });

      expect(result).toBeDefined();
      expect(result!.title).toBe("Test Article G12");
      expect(result!.category).toBe("actualité");
      expect(result!.published).toBe(true);
      expect(result!.slug).toContain("test-article-g12");
      expect(result!.authorId).toBe(1);
      createdArticleId = result!.id;
    });

    it("admin can update an article", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.articles.update({
        id: createdArticleId,
        title: "Test Article G12 Modifié",
        published: false,
      });

      expect(result).toBeDefined();
      expect(result!.title).toBe("Test Article G12 Modifié");
      expect(result!.published).toBe(false);
    });

    it("created article appears in public list when published", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Re-publish
      await caller.articles.update({
        id: createdArticleId,
        published: true,
      });

      const publicCtx = createPublicContext();
      const publicCaller = appRouter.createCaller(publicCtx);
      const list = await publicCaller.articles.list({ limit: 50, offset: 0 });

      const found = list.items.find((a: any) => a.id === createdArticleId);
      expect(found).toBeDefined();
    });

    it("admin can delete an article", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.articles.delete({ id: createdArticleId });
      expect(result).toEqual({ success: true });

      // Verify it's gone
      await expect(
        caller.articles.byId({ id: createdArticleId })
      ).rejects.toThrow();
    });
  });
});
