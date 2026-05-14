import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AdminUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AdminUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as unknown as TrpcContext["res"],
  };
}

describe("pageContent API", () => {
  describe("public routes", () => {
    it("byPage returns content for a specific page", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageContent.byPage({ pageId: "home" });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("admin routes", () => {
    it("admin can create page content", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageContent.create({
        pageId: "home",
        contentType: "image",
        title: "Test Image",
        mediaUrl: "https://example.com/test.jpg",
        displayOrder: 0,
      });

      expect(result).toBeDefined();
      expect(result.title).toBe("Test Image");
      expect(result.pageId).toBe("home");
      expect(result.contentType).toBe("image");
    });

    it("admin can list page content", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageContent.adminList({
        pageId: "home",
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    it("admin can update page content", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Create content first
      const created = await caller.pageContent.create({
        pageId: "home",
        contentType: "image",
        title: "Original Title",
        mediaUrl: "https://example.com/test.jpg",
        displayOrder: 0,
      });

      // Update it
      const updated = await caller.pageContent.update({
        id: created.id,
        title: "Updated Title",
      });

      expect(updated.title).toBe("Updated Title");
    });

    it("admin can delete page content", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Create content first
      const created = await caller.pageContent.create({
        pageId: "home",
        contentType: "image",
        title: "To Delete",
        mediaUrl: "https://example.com/test.jpg",
        displayOrder: 0,
      });

      // Delete it
      const result = await caller.pageContent.delete({ id: created.id });

      expect(result.success).toBe(true);
    });

    it("admin can upload media", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Create a simple base64 image (1x1 pixel PNG)
      const base64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const result = await caller.pageContent.uploadMedia({
        base64,
        filename: "test.png",
        contentType: "image/png",
      });

      expect(result).toBeDefined();
      expect(result.url).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.url).toContain("/uploads/");
    });

    it("admin can create youtube video content", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageContent.create({
        pageId: "home",
        contentType: "youtube_video",
        title: "Test YouTube Video",
        mediaUrl: "https://example.com/youtube-placeholder.jpg",
        youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        displayOrder: 1,
      });

      expect(result).toBeDefined();
      expect(result.contentType).toBe("youtube_video");
      expect(result.youtubeUrl).toBe(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      );
    });

    it("admin can create mp4 video content", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.pageContent.create({
        pageId: "home",
        contentType: "mp4_video",
        title: "Test MP4 Video",
        mediaUrl: "https://example.com/video.mp4",
        displayOrder: 2,
      });

      expect(result).toBeDefined();
      expect(result.contentType).toBe("mp4_video");
      expect(result.mediaUrl).toContain("mp4");
    });
  });
});
