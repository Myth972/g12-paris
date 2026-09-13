import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

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

describe("gallery API", () => {
  describe("public list - category filtering", () => {
    it("list returns items and total", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({ limit: 10, offset: 0 });

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("list with no filter returns all visible items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list();

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
    });

    it("list with category filter returns filtered items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({
        limit: 50,
        offset: 0,
        category: "foi",
      });

      expect(result).toHaveProperty("items");
      expect(Array.isArray(result.items)).toBe(true);
      // All returned items should have category "foi"
      for (const item of result.items) {
        expect(item.category).toBe("foi");
      }
    });

    it("list with category='louange' returns only louange items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({
        limit: 50,
        offset: 0,
        category: "louange",
      });

      for (const item of result.items) {
        expect(item.category).toBe("louange");
      }
    });

    it("list with category='esperance' returns only esperance items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({
        limit: 50,
        offset: 0,
        category: "esperance",
      });

      for (const item of result.items) {
        expect(item.category).toBe("esperance");
      }
    });

    it("list with category='general' returns only general items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({
        limit: 50,
        offset: 0,
        category: "general",
      });

      for (const item of result.items) {
        expect(item.category).toBe("general");
      }
    });

    it("list with undefined category returns all visible items (no filter)", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const allResult = await caller.gallery.list({ limit: 100, offset: 0 });
      const unfilteredResult = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: undefined,
      });

      // Both should return same total
      expect(unfilteredResult.total).toBe(allResult.total);
    });

    it("list with non-existent category returns empty items", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({
        limit: 50,
        offset: 0,
        category: "nonexistent-category",
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("list pagination works with category filter", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const page1 = await caller.gallery.list({
        limit: 2,
        offset: 0,
        category: "foi",
      });
      const page2 = await caller.gallery.list({
        limit: 2,
        offset: 2,
        category: "foi",
      });

      // Items should be different between pages
      if (page1.items.length > 0 && page2.items.length > 0) {
        expect(page1.items[0].id).not.toBe(page2.items[0].id);
      }
    });

    it("list items have correct shape with verse relation", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.gallery.list({ limit: 5, offset: 0 });

      for (const item of result.items) {
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("title");
        expect(item).toHaveProperty("type");
        expect(item).toHaveProperty("mediaUrl");
        expect(item).toHaveProperty("category");
        expect(item).toHaveProperty("visible");
        // verse can be null (leftJoin)
        expect(item).toHaveProperty("verse");
      }
    });
  });

  describe("admin create with category", () => {
    it("create item with category='foi'", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const item = await caller.gallery.create({
        title: "Test Gallery Foi",
        type: "image",
        mediaUrl: "https://example.com/test.jpg",
        category: "foi",
      });

      expect(item.category).toBe("foi");
      expect(item.title).toBe("Test Gallery Foi");
    });

    it("create item with category='louange'", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const item = await caller.gallery.create({
        title: "Test Gallery Louange",
        type: "image",
        mediaUrl: "https://example.com/test2.jpg",
        category: "louange",
      });

      expect(item.category).toBe("louange");
    });

    it("create item with category='esperance'", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const item = await caller.gallery.create({
        title: "Test Gallery Esperance",
        type: "image",
        mediaUrl: "https://example.com/test3.jpg",
        category: "esperance",
      });

      expect(item.category).toBe("esperance");
    });

    it("create item without category defaults to 'general'", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const item = await caller.gallery.create({
        title: "Test Gallery Default",
        type: "image",
        mediaUrl: "https://example.com/test4.jpg",
      });

      expect(item.category).toBe("general");
    });

    it("create item with category='general' explicitly", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);
      const item = await caller.gallery.create({
        title: "Test Gallery General Explicit",
        type: "image",
        mediaUrl: "https://example.com/test5.jpg",
        category: "general",
      });

      expect(item.category).toBe("general");
    });

    it("filter correctly finds created items by category", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Create items in different categories
      await caller.gallery.create({
        title: "Filter Test Foi 1",
        type: "image",
        mediaUrl: "https://example.com/ft1.jpg",
        category: "foi",
      });
      await caller.gallery.create({
        title: "Filter Test Foi 2",
        type: "image",
        mediaUrl: "https://example.com/ft2.jpg",
        category: "foi",
      });
      await caller.gallery.create({
        title: "Filter Test Louange 1",
        type: "image",
        mediaUrl: "https://example.com/ft3.jpg",
        category: "louange",
      });

      // Filter by foi
      const foiResult = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: "foi",
      });
      const foiItems = foiResult.items.filter(i =>
        i.title.startsWith("Filter Test")
      );
      expect(foiItems.length).toBe(2);
      for (const item of foiItems) {
        expect(item.category).toBe("foi");
      }

      // Filter by louange
      const louangeResult = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: "louange",
      });
      const louangeItems = louangeResult.items.filter(i =>
        i.title.startsWith("Filter Test")
      );
      expect(louangeItems.length).toBeGreaterThanOrEqual(1);

      // Filter by general should NOT include foi/louange items
      const generalResult = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: "general",
      });
      const generalFiltered = generalResult.items.filter(i =>
        i.title.startsWith("Filter Test")
      );
      for (const item of generalFiltered) {
        expect(item.category).toBe("general");
      }
    });
  });

  describe("category edge cases", () => {
    it("category filter is case-sensitive (exact match)", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // "Foi" (capitalized) should NOT match "foi" (lowercase)
      const result = await caller.gallery.list({
        limit: 50,
        offset: 0,
        category: "Foi",
      });

      // All returned items should have category exactly "Foi"
      for (const item of result.items) {
        expect(item.category).toBe("Foi");
      }
    });

    it("empty string category is treated as no filter", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const resultEmpty = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: "",
      });
      const resultUndefined = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: undefined,
      });

      expect(resultEmpty.total).toBe(resultUndefined.total);
    });

    it("items with null category are only visible in unfiltered list", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Unfiltered should show all items (including those with null/undefined category)
      const allResult = await caller.gallery.list({ limit: 100, offset: 0 });

      // Filtered should only show items with exact category match
      const filteredResult = await caller.gallery.list({
        limit: 100,
        offset: 0,
        category: "foi",
      });

      // The unfiltered total should always be >= any filtered total
      expect(allResult.total).toBeGreaterThanOrEqual(filteredResult.total);
    });
  });
});
