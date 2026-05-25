import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import {
  publicProcedure,
  protectedProcedure,
  router,
  adminProcedure,
  editeurProcedure,
  bibliothequeProcedure,
} from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import {
  createArticle,
  updateArticle,
  deleteArticle,
  getArticleById,
  getArticleBySlug,
  listPublishedArticles,
  countPublishedArticles,
  listAllArticles,
  countAllArticles,
  createNotification,
  deleteNotification,
  listNotifications,
  countNotifications,
  getUserNotifications,
  countUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getFeaturedGalleryItems,
  getAllGalleryItems,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  createBiblicalVerse,
  updateBiblicalVerse,
  getBiblicalVerseById,
  deleteBiblicalVerse,
  listBiblicalVerses,
  getLatestBiblicalVerse,
  getPageContent,
  createPageContent,
  updatePageContent,
  deletePageContent,
  listPageContent,
  countPageContent,
  getFeaturedHomeContent,
  listCategories,
  createCategory,
  deleteCategory,
  listThemes,
  createTheme,
  deleteTheme,
} from "./db.js";
import { storagePut } from "./storage.js";
import { nanoid } from "nanoid";

const zod = {
  object: <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict(),
};

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200) +
    "-" +
    nanoid(6)
  );
}

export const appRouter = router({
  system: systemRouter,
  bibliotheque: router({
    listMedias: adminProcedure
      .input(zod.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ input }) => {
        const items = await getAllGalleryItems(input.limit, input.offset);
        return { items };
      }),
    deleteMedia: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteGalleryItem(input.id);
      }),
    listCategories: adminProcedure.query(async () => {
      return listCategories();
    }),
    createCategory: adminProcedure
      .input(zod.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        const slug = input.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return createCategory({ name: input.name, slug, description: input.description });
      }),
    deleteCategory: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteCategory(input.id);
      }),
    listThemes: adminProcedure.query(async () => {
      return listThemes();
    }),
    createTheme: adminProcedure
      .input(zod.object({ name: z.string(), categoryId: z.number().optional(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        const slug = input.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return createTheme({ name: input.name, slug, categoryId: input.categoryId, description: input.description });
      }),
    deleteTheme: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteTheme(input.id);
      }),
    sendNewsletter: adminProcedure
      .input(zod.object({ subject: z.string().min(1).max(200), content: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const { subscribers } = await import("../drizzle/schema.js");
        const db = await getDb();
        
        const allSubscribers = await db.select().from(subscribers);
        if (allSubscribers.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun abonné." });
        }
        
        const emails = allSubscribers.map((s: any) => s.email);
        const { sendCustomNewsletter } = await import("./_core/newsletter.js");
        return sendCustomNewsletter(emails, input.subject, input.content);
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(zod.object({ 
        username: z.string().optional(),
        password: z.string() 
      }))
      .mutation(async ({ input, ctx }) => {
        const { ENV } = await import("./_core/env.js");
        
        let openId: string;
        let name: string;
        
        // Si username fourni, chercher par username + password
        if (input.username) {
          const { findUserByUsernameAndPassword } = await import("./db.js");
          const user = await findUserByUsernameAndPassword(input.username, input.password);
          
          if (!user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Nom d'utilisateur ou mot de passe incorrect",
            });
          }
          
          openId = user.openId;
          name = user.name || "Utilisateur";
        }
        // Sinon, vérifier le mot de passe admin global
        else if (input.password === ENV.adminPassword) {
          openId = "admin-local";
          name = "Administrateur";
          
          const { upsertUser } = await import("./db.js");
          await upsertUser({
            openId,
            name,
            role: "admin",
            lastSignedIn: new Date(),
          });
        } else {
          // Chercher un utilisateur avec ce mot de passe ( backward compat)
          const { findUserByPassword } = await import("./db.js");
          const user = await findUserByPassword(input.password);
          
          if (!user) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Mot de passe incorrect",
            });
          }
          
          openId = user.openId;
          name = user.name || "Utilisateur";
        }

        const { sdk } = await import("./_core/sdk.js");
        const sessionToken = await sdk.createSessionToken(openId, { name });

        const { getSessionCookieOptions } = await import("./_core/cookies.js");
        const { ONE_YEAR_MS, COOKIE_NAME } = await import("../shared/const.js");
        const cookieOptions = getSessionCookieOptions(ctx.req);

        (ctx.res as any).cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie(COOKIE_NAME, cookieOptions);
      return { success: true } as const;
    }),
  }),

  uploads: router({
    // Admin: generate a short-lived client upload token for Vercel Blob
    generateUploadToken: adminProcedure
      .input(
        zod.object({
          pathname: z.string().min(1).max(1024),
          contentType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { ENV } = await import("./_core/env.js");
        if (!ENV.blobToken) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Vercel Blob n'est pas configuré. Veuillez ajouter un token de lecture/écriture.",
          });
        }

        const cleaned = input.pathname
          .replace(/\\/g, "/")
          .replace(/^\/+/, "");

        if (cleaned.includes("..")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Chemin d'upload invalide.",
          });
        }

        const allowedPrefixes = [
          "articles/",
          "gallery/",
          "page-content/",
          "site/",
          "verses/",
        ];
        if (!allowedPrefixes.some(prefix => cleaned.startsWith(prefix))) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Chemin d'upload non autorisé.",
          });
        }

        if (
          input.contentType &&
          !input.contentType.startsWith("image/") &&
          !input.contentType.startsWith("video/")
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Type de fichier non autorisé.",
          });
        }

        const token = await generateClientTokenFromReadWriteToken({
          pathname: cleaned,
          token: ENV.blobToken,
          maximumSizeInBytes: 500 * 1024 * 1024,
          allowedContentTypes: ["image/*", "video/*"],
        });

        return { token, pathname: cleaned };
      }),

    localUpload: adminProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          folder: z.string(),
          contentType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const { storagePut } = await import("./storage.js");
        const folder = input.folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
        const key = `${folder}/${Date.now()}-${input.filename}`;
        
        let finalBuffer = buffer;
        if (input.contentType?.startsWith("image/")) {
            const sharp = await import("sharp");
            finalBuffer = await sharp.default(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        }
        
        return storagePut(key, finalBuffer, input.contentType);
      }),
  }),

  media: router({
    signedUrl: adminProcedure
      .input(zod.object({ key: z.string(), ttl: z.number().optional() }))
      .mutation(async ({ input }) => {
        const { getSignedUrl } = await import("./storage.js");
        return getSignedUrl(input.key, input.ttl ?? 3600);
      }),
    bulkSignedUrls: adminProcedure
      .input(zod.object({ keys: z.array(z.string()), ttl: z.number().optional() }))
      .mutation(async ({ input }) => {
        const { getSignedUrl } = await import("./storage.js");
        const ttl = input.ttl ?? 3600;
        const results = await Promise.all(
          input.keys.map((k) => getSignedUrl(k, ttl))
        );
        return results;
      }),
  }),

  articles: router({
    list: publicProcedure
      .input(
        zod.object({
          limit: z.number().min(1).max(100).default(12),
          offset: z.number().min(0).default(0),
          category: z.string().optional(),
          search: z.string().optional(),
          minPrice: z.number().optional(),
          maxPrice: z.number().optional(),
          type: z.string().optional(),
          theme: z.string().optional(),
          sort: z.enum(["newest", "popular", "price_asc", "price_desc"]).optional(),
        })
      )
      .query(async ({ input }) => {
        const { limit = 12, offset = 0, category, search, minPrice, maxPrice, type, theme, sort } = input ?? {};
        const { listPublishedArticles, countPublishedArticles } = await import("./db.js");
        const [items, total] = await Promise.all([
          listPublishedArticles(limit, offset, { category, search, minPrice, maxPrice, type, theme, sort }),
          countPublishedArticles({ category, search, minPrice, maxPrice, type, theme }),
        ]);
        return { items, total, limit, offset };
      }),

    bySlug: publicProcedure
      .input(zod.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await getArticleBySlug(input.slug);
        if (!article || !article.published) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article introuvable",
          });
        }
        return article;
      }),

    byId: publicProcedure
      .input(zod.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await getArticleById(input.id);
        if (!article) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article introuvable",
          });
        }
        return article;
      }),

    adminList: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { limit = 50, offset = 0 } = input ?? {};
        const [items, total] = await Promise.all([
          listAllArticles(limit, offset),
          countAllArticles(),
        ]);
        return { items, total, limit, offset };
      }),

    create: editeurProcedure
      .input(
        zod.object({
          title: z.string().min(1).max(500),
          excerpt: z.string().max(1000).optional(),
          content: z.string().min(1),
          coverImageUrl: z.string().optional(),
          coverImageKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
          category: z.string().max(100).default("actualité"),
          published: z.boolean().default(false),
          verseId: z.number().nullable().optional(),
          price: z.number().optional(),
          meta: z.string().optional(),
          affiliateUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const slug = generateSlug(input.title);
        return createArticle({
          ...input,
          slug,
          authorId: ctx.user.id,
        });
      }),

    update: editeurProcedure
      .input(
        zod.object({
          id: z.number(),
          title: z.string().min(1).max(500).optional(),
          excerpt: z.string().max(1000).optional(),
          content: z.string().min(1).optional(),
          coverImageUrl: z.string().nullable().optional(),
          coverImageKey: z.string().nullable().optional(),
          youtubeUrl: z.string().nullable().optional(),
          category: z.string().max(100).optional(),
          published: z.boolean().optional(),
          verseId: z.number().nullable().optional(),
          price: z.number().optional(),
          meta: z.string().optional(),
          affiliateUrl: z.string().url().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const existing = await getArticleById(id);
        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Article introuvable",
          });
        }
        const updateData: Record<string, unknown> = { ...data };
        if (data.title && data.title !== existing.title) {
          updateData.slug = generateSlug(data.title);
        }
        return updateArticle(id, updateData);
      }),

    delete: editeurProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteArticle(input.id);
      }),

    uploadImage: editeurProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `articles/${ctx.user.id}/${nanoid(12)}.${ext}`;
        
        let finalBuffer = buffer;
        if (input.contentType.startsWith("image/")) {
            const sharp = await import("sharp");
            finalBuffer = await sharp.default(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        }
        
        const { url } = await storagePut(key, finalBuffer, input.contentType);
        return { url, key };
      }),
  }),

  notifications: router({
    myNotifications: protectedProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(50).default(20),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const limit = input?.limit ?? 20;
        const [items, unreadCount] = await Promise.all([
          getUserNotifications(ctx.user.id, limit),
          countUnreadNotifications(ctx.user.id),
        ]);
        return { items, unreadCount };
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return countUnreadNotifications(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(zod.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return markNotificationAsRead(input.notificationId, ctx.user.id);
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      return markAllNotificationsAsRead(ctx.user.id);
    }),

    adminList: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { limit = 50, offset = 0 } = input ?? {};
        const [items, total] = await Promise.all([
          listNotifications(limit, offset),
          countNotifications(),
        ]);
        return { items, total };
      }),

    create: adminProcedure
      .input(
        zod.object({
          title: z.string().min(1).max(300),
          message: z.string().min(1),
          type: z
            .enum(["info", "alerte", "nouveauté", "important"])
            .default("info"),
          linkUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createNotification({
          ...input,
          authorId: ctx.user.id,
        });
      }),

    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteNotification(input.id);
      }),
  }),

  gallery: router({
    featured: publicProcedure.query(async () => {
      return getFeaturedGalleryItems();
    }),

    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { limit = 20, offset = 0 } = input ?? {};
        const items = await getAllGalleryItems(limit, offset, true);
        return { items };
      }),

    listAdmin: adminProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(100).default(50),
            offset: z.number().min(0).default(0),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { limit = 50, offset = 0 } = input ?? {};
        const items = await getAllGalleryItems(limit, offset, false);
        return { items };
      }),

    create: adminProcedure
      .input(
        zod.object({
          title: z.string().min(1).max(300),
          type: z.enum(["image", "video"]),
          mediaUrl: z.string().min(1),
          mediaKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
          verseId: z.number().optional(),
          displayOrder: z.number().default(0),
          featured: z.boolean().default(false),
          loop: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ input }) => {
        return createGalleryItem(input);
      }),

    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteGalleryItem(input.id);
      }),

    update: adminProcedure
      .input(
        zod.object({
          id: z.number(),
          title: z.string().min(1).max(300).optional(),
          visible: z.boolean().optional(),
          featured: z.boolean().optional(),
          loop: z.boolean().optional(),
          verseId: z.number().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateGalleryItem(id, data);
      }),

    uploadImage: editeurProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const fileKey = `gallery/${Date.now()}-${nanoid()}.${input.filename.split(".").pop()}`;
        
        let finalBuffer = buffer;
        if (input.contentType.startsWith("image/")) {
            const sharp = await import("sharp");
            finalBuffer = await sharp.default(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        }
        
        const { url, key } = await storagePut(
          fileKey,
          finalBuffer,
          input.contentType
        );
        return { url, key };
      }),
  }),

  verses: router({
    latest: publicProcedure.query(async () => {
      const items = await getLatestBiblicalVerse();
      return items;
    }),

    create: adminProcedure
      .input(
        zod.object({
          reference: z.string().min(1).max(100),
          text: z.string().min(1),
          summary: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return createBiblicalVerse(input);
      }),

    byId: publicProcedure
      .input(zod.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBiblicalVerseById(input.id);
      }),

    adminList: adminProcedure.query(async () => {
      const items = await listBiblicalVerses();
      return { items };
    }),

    update: adminProcedure
      .input(
        zod.object({
          id: z.number(),
          reference: z.string().min(1).max(100).optional(),
          text: z.string().min(1).optional(),
          summary: z.string().min(1).optional(),
          imageUrl: z.string().nullable().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updateBiblicalVerse(id, data);
      }),

    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBiblicalVerse(input.id);
      }),
  }),

  pageContent: router({
    byPage: publicProcedure
      .input(zod.object({ pageId: z.string() }))
      .query(async ({ input }) => {
        return getPageContent(input.pageId);
      }),

    featuredHome: publicProcedure.query(async () => {
      return getFeaturedHomeContent();
    }),

    adminList: adminProcedure
      .input(
        zod.object({
          pageId: z.string(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const { pageId, limit, offset } = input;
        const [items, total] = await Promise.all([
          listPageContent(pageId, limit, offset),
          countPageContent(pageId),
        ]);
        return { items, total };
      }),

    create: editeurProcedure
      .input(
        zod.object({
          pageId: z.string(),
          contentType: z.enum(["image", "youtube_video", "mp4_video"]),
          title: z.string().min(1).max(300),
          mediaUrl: z.string().min(1),
          mediaKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
          displayOrder: z.number().default(0),
          visible: z.boolean().default(true),
          loop: z.boolean().optional().default(false),
          featuredHome: z.boolean().optional().default(false),
          description: z.string().optional(),
          ctaLabel: z.string().optional(),
          ctaHref: z.string().optional(),
          textColor: z.string().optional(),
          titleColor: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createPageContent({
          ...input,
          authorId: ctx.user.id,
        });
      }),

    update: editeurProcedure
      .input(
        zod.object({
          id: z.number(),
          title: z.string().optional(),
          mediaUrl: z.string().optional(),
          youtubeUrl: z.string().optional(),
          displayOrder: z.number().optional(),
          visible: z.boolean().optional(),
          loop: z.boolean().optional(),
          featuredHome: z.boolean().optional(),
          description: z.string().optional(),
          ctaLabel: z.string().optional(),
          ctaHref: z.string().optional(),
          textColor: z.string().optional(),
          titleColor: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePageContent(id, data);
      }),

    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePageContent(input.id);
      }),

    uploadMedia: editeurProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const fileKey = `page-content/${Date.now()}-${nanoid()}.${input.filename.split(".").pop()}`;
        
        let finalBuffer = buffer;
        if (input.contentType.startsWith("image/")) {
            const sharp = await import("sharp");
            finalBuffer = await sharp.default(buffer).resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
        } else if (input.contentType.startsWith("video/")) {
            const { promisify } = await import("util");
            const exec = promisify((await import("child_process")).exec);
            const tmpFile = `/tmp/${Date.now()}-${nanoid()}`;
            const fs = await import("fs/promises");
            await fs.writeFile(tmpFile, buffer);
            await exec(`ffmpeg -i ${tmpFile} -vcodec libx264 -crf 28 -preset medium -acodec aac -b:a 128k ${tmpFile}.mp4`);
            finalBuffer = await fs.readFile(`${tmpFile}.mp4`);
            await fs.unlink(tmpFile);
            await fs.unlink(`${tmpFile}.mp4`);
        }
        
        const { url, key } = await storagePut(
          fileKey,
          finalBuffer,
          input.contentType
        );
        return { url, key };
      }),
  }),
  ai: router({
    status: publicProcedure.query(async () => {
      const { ENV } = await import("./_core/env.js");
      const { getDb } = await import("./db.js");
      const db = await getDb();
      let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined = ENV.preferredAiProvider as any;

      if (db) {
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const rows = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "aiProvider"))
          .limit(1);
        const value = rows[0]?.value;
        provider = value as any;
      }

      const hasGroq = Boolean(ENV.groqApiKey);
      const hasGoogle = Boolean((ENV as any).forgeApiKey || ENV.googleApiKey);

      const ok =
        provider === "groq"
          ? hasGroq
          : provider === "google"
            ? hasGoogle
            : false;

      return {
        ok,
        provider: provider ?? "unset",
      };
    }),
    chat: adminProcedure
      .input(
        zod.object({
          messages: z.array(
            zod.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        const { invokeLLM } = await import("./_core/llm.js");
        const response = await invokeLLM({
          messages: input.messages as any,
          provider,
        });
        return response.choices[0].message.content as string;
      }),
    
    testProvider: adminProcedure
      .input(zod.object({ provider: z.enum(["google", "groq", "minimax", "aimlapi"]).optional() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();
        let provider = input.provider;
        
        if (!provider && db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          provider = rows[0]?.value as any;
        }

        const { invokeLLM } = await import("./_core/llm.js");
        const response = await invokeLLM({
          messages: [{ role: "user", content: "Dis 'OK' si tu fonctionnes." }],
          provider: provider as any,
        });
        
        const { getProviderInfo } = await import("../shared/aiProviders.js");
        const info = getProviderInfo(provider as any || "groq");
        
        return { 
          ok: true, 
          provider: provider || "groq",
          model: info.model,
          response: response.choices[0].message.content 
        };
      }),

    generateDescription: adminProcedure
      .input(
        zod.object({
          title: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        const { invokeLLM } = await import("./_core/llm.js");
        const prompt = `Rédige une description courte (2-3 phrases) et percutante pour un contenu de type "${input.contentType}" intitulé "${input.title}". Le ton doit être inspirant et spirituel.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Tu es un assistant éditorial pour un site d'informations chrétien.",
            },
            { role: "user", content: prompt },
          ],
          provider,
        });
        return response.choices[0].message.content as string;
      }),

    generateVerse: adminProcedure
      .input(
        z
          .object({
            reference: z.string().optional(),
            topic: z.string().optional(),
          })
          .optional()
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        const { invokeLLM } = await import("./_core/llm.js");

        let prompt = "";
        if (input?.reference) {
          prompt = `Fournis le texte biblique complet pour la référence : "${input.reference}". Ajoute ensuite un résumé spirituel de 2-3 phrases sur son sens.`;
        } else if (input?.topic) {
          prompt = `Suggère LE verset biblique le plus puissant et pertinent sur le thème : "${input.topic}". Fournis sa référence, le texte exact complet, et un résumé spirituel de 2-3 phrases expliquant pourquoi il correspond à ce thème.`;
        } else {
          prompt = `Génère un verset biblique aléatoire, connu pour être très encourageant ou profond. Fournis sa référence, le texte exact complet, et ajoute un résumé spirituel de 2-3 phrases sur son sens profond pour un chrétien aujourd'hui.`;
        }

        prompt += `\nTon format de réponse DOIT ÊTRE UNIQUEMENT un objet JSON valide avec la structure suivante :
        {
          "reference": "Livre Chapitre:Verset",
          "text": "Le texte du verset...",
          "summary": "Un résumé court (2-3 phrases) et spirituellement inspirant de ce verset."
        }`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Tu es un érudit biblique et assistant éditorial. Tu réponds strictement en JSON.",
            },
            { role: "user", content: prompt },
          ],
          provider,
        });

        const raw = (response.choices[0].message.content as string) || "";

        let parsed: {
          reference: string;
          text: string;
          summary: string;
        } | null = null;

        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1].trim());
          } catch {}
        }

        if (!parsed) {
          const braceMatch = raw.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try {
              parsed = JSON.parse(braceMatch[0]);
            } catch {}
          }
        }

        if (!parsed) {
          try {
            parsed = JSON.parse(
              raw
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim()
            );
          } catch {}
        }

        if (parsed && parsed.reference && parsed.text) {
          return {
            reference: parsed.reference,
            text: parsed.text,
            summary: parsed.summary || "Verset généré par l'IA.",
          };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Format JSON invalide. Réponse brute : ${raw.substring(0, 200)}`,
        });
      }),

    suggestVerseForArticle: adminProcedure
      .input(
        zod.object({
          title: z.string(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        const { invokeLLM } = await import("./_core/llm.js");
        const prompt = `En tant qu'érudit biblique, suggère le verset biblique le plus pertinent pour accompagner l'article suivant :
        Titre : "${input.title}"
        Contenu : "${input.content.substring(0, 1000)}..."
        
        Ton format de réponse DOIT ÊTRE UNIQUEMENT un objet JSON valide :
        {
          "reference": "Livre Chapitre:Verset",
          "text": "Le texte du verset...",
          "summary": "Un résumé court (2-3 phrases) expliquant pourquoi ce verset est pertinent pour cet article."
        }`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Tu réponds strictement en JSON.",
            },
            { role: "user", content: prompt },
          ],
          provider: provider || "minimax", // Utilise le fournisseur préféré ou MiniMax par défaut
        });

        const raw = (response.choices[0].message.content as string) || "";

        let parsed: {
          reference: string;
          text: string;
          summary: string;
        } | null = null;

        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          try {
            parsed = JSON.parse(codeBlockMatch[1].trim());
          } catch {}
        }

        if (!parsed) {
          const braceMatch = raw.match(/\{[\s\S]*\}/);
          if (braceMatch) {
            try {
              parsed = JSON.parse(braceMatch[0]);
            } catch {}
          }
        }

        if (!parsed) {
          try {
            parsed = JSON.parse(
              raw
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim()
            );
          } catch {}
        }

        if (parsed && parsed.reference && parsed.text) {
          return {
            reference: parsed.reference,
            text: parsed.text,
            summary: parsed.summary || "Verset suggéré par l'IA.",
          };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Format JSON invalide. Réponse brute : ${raw.substring(0, 200)}`,
        });
      }),

    translate: adminProcedure
      .input(
        zod.object({
          text: z.string(),
          targetLanguage: z.enum(["en", "es"]),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        const { invokeLLM } = await import("./_core/llm.js");
        const languageName =
          input.targetLanguage === "en" ? "anglais" : "espagnol";
        const prompt = `Voici un texte en français (qui peut contenir du HTML). Traduis-le en ${languageName} en gardant exactement la même structure HTML s'il y en a. Renvoie UNIQUEMENT la traduction, sans aucun commentaire ou texte avant ou après :\n\n${input.text}`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Tu es un traducteur expert spécialisé dans les textes spirituels chrétiens. Tu renvoies uniquement la traduction demandée.",
            },
            { role: "user", content: prompt },
          ],
          provider,
        });

        const content = response.choices[0].message.content as string;
        // remove code blocks if the LLM wrapped the HTML
        return content
          .replace(/^```html/i, "")
          .replace(/^```/i, "")
          .replace(/```$/i, "")
          .trim();
      }),

    search: publicProcedure
      .input(
        zod.object({
          query: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const db = await getDb();

        let contextText = "";
        if (db) {
          // Very basic text search for context feeding
          const { articles } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select({
              title: articles.title,
              excerpt: articles.excerpt,
              content: articles.content,
            })
            .from(articles)
            .where(eq(articles.published, true))
            .limit(10);

          contextText = rows
            .map(
              (a: any) =>
                `Titre: ${a.title}\nContenu: ${a.excerpt || a.content.substring(0, 200)}`
            )
            .join("\n\n");
        }

        const { invokeLLM } = await import("./_core/llm.js");
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          const { siteSettings } = await import("../drizzle/schema.js");
          const { eq } = await import("drizzle-orm");
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        const prompt = `L'utilisateur pose cette question ou recherche: "${input.query}".\n\nVoici quelques extraits des récents articles du site:\n${contextText}\n\nRéponds de manière spirituelle et bienveillante en utilisant les articles comme contexte si pertinent, sinon donne une réponse inspirante chrétienne globale. Reste concis (1-3 paragraphes).`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Tu es l'assistant IA spirituel de G12 Paris Media. Tu réponds avec bienveillance et sagesse.",
            },
            { role: "user", content: prompt },
          ],
          provider,
        });

        return response.choices[0].message.content as string;
      }),

    // ─── Kling AI Image Generation ─────────────────────────────────
    generateImage: adminProcedure
      .input(
        z.object({
          prompt: z.string().min(1).max(1000),
          aspectRatio: z
            .enum(["1:1", "16:9", "9:16", "4:3", "3:4"])
            .default("16:9"),
          negativePrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { ENV } = await import("./_core/env.js");
        if (!ENV.aimlApiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AIMLAPI_KEY non configurée",
          });
        }

        // AIMLAPI Kling image generation endpoint
        const response = await fetch(
          "https://api.aimlapi.com/v1/images/generations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.aimlApiKey}`,
            },
            body: JSON.stringify({
              model: "flux/schnell",
              prompt: input.prompt,
              negative_prompt: input.negativePrompt || "",
              aspect_ratio: input.aspectRatio,
              n: 1,
            }),
          }
        );

        if (!response.ok) {
          const err = await response.text();
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Kling API error: ${response.status} – ${err}`,
          });
        }

        const data = (await response.json()) as any;
        const imageUrl =
          data?.data?.[0]?.url || data?.images?.[0]?.url || data?.url;
        if (!imageUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Pas d'image dans la réponse: ${JSON.stringify(data).substring(0, 200)}`,
          });
        }
        return { url: imageUrl };
      }),

    // ─── Kling AI Video Generation ─────────────────────────────────
    generateVideo: adminProcedure
      .input(
        z.object({
          prompt: z.string().min(1).max(1000),
          duration: z.enum(["5", "10"]).default("5"),
          aspectRatio: z.enum(["1:1", "16:9", "9:16"]).default("16:9"),
          negativePrompt: z.string().optional(),
          imageUrl: z.string().url().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { ENV } = await import("./_core/env.js");
        if (!ENV.aimlApiKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AIMLAPI_KEY non configurée",
          });
        }

        // Step 1: Submit the generation request
        const submitResp = await fetch(
          "https://api.aimlapi.com/v2/generate/video/kling/generation",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ENV.aimlApiKey}`,
            },
            body: JSON.stringify({
              model: input.imageUrl ? "kling-video/v1.6/pro/image-to-video" : "kling-video/v1.6/pro/text-to-video",
              prompt: input.prompt,
              negative_prompt: input.negativePrompt || "",
              duration: input.duration,
              aspect_ratio: input.aspectRatio,
              ...(input.imageUrl ? { image_url: input.imageUrl } : {}),
            }),
          }
        );

        if (!submitResp.ok) {
          const err = await submitResp.text();
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Kling video submit error: ${submitResp.status} – ${err}`,
          });
        }

        const submitData = (await submitResp.json()) as any;
        const generationId = submitData?.id || submitData?.generation_id;
        if (!generationId) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Pas d'ID de génération: ${JSON.stringify(submitData).substring(0, 200)}`,
          });
        }

        // Step 2: Poll for result (max 90s)
        for (let i = 0; i < 18; i++) {
          await new Promise(r => setTimeout(r, 5000));
          const pollResp = await fetch(
            `https://api.aimlapi.com/v2/generate/video/kling/generation?generation_id=${generationId}`,
            {
              headers: { Authorization: `Bearer ${ENV.aimlApiKey}` },
            }
          );
          if (!pollResp.ok) continue;
          const pollData = (await pollResp.json()) as any;
          const status = pollData?.status;
          if (status === "completed" || status === "success") {
            const videoUrl =
              pollData?.video?.url || pollData?.output?.url || pollData?.url;
            if (videoUrl) return { url: videoUrl, generationId };
          }
          if (status === "failed" || status === "error") {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: `Génération vidéo échouée: ${JSON.stringify(pollData).substring(0, 200)}`,
            });
          }
        }

        // Return generationId to let client poll later
        return { url: null, generationId, pending: true };
      }),
  }),
  // Newsletter router for managing subscriptions
  newsletter: router({
    subscribe: publicProcedure
      .input(
        zod.object({
          email: z.string().email(),
          name: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const { subscribers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();

        const existing = await db
          .select()
          .from(subscribers)
          .where(eq(subscribers.email, input.email))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Cet email est déjà inscrit.",
          });
        }

        await db.insert(subscribers).values({
          email: input.email,
          name: input.name,
        });

        // Try to send a welcome email if Resend is configured
        const { sendWelcomeEmail } = await import("./_core/newsletter.js");
        await sendWelcomeEmail(input.email, input.name);

        return { success: true };
      }),

    listSubscribers: adminProcedure.query(async () => {
      const { getDb } = await import("./db.js");
      const { subscribers } = await import("../drizzle/schema.js");
      const { desc } = await import("drizzle-orm");
      const db = await getDb();
      return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
    }),

    deleteSubscriber: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const { subscribers } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        await db.delete(subscribers).where(eq(subscribers.id, input.id));
        return { success: true };
      }),

    sendDigest: adminProcedure
      .input(zod.object({ 
        subject: z.string().optional(),
        category: z.string().optional()
      }).optional())
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const { subscribers, articles } = await import("../drizzle/schema.js");
        const { desc, eq, and, like } = await import("drizzle-orm");
        const db = await getDb();

        const allSubscribers = await db.select().from(subscribers);
        if (allSubscribers.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Aucun abonné à contacter.",
          });
        }

        let query = db
          .select()
          .from(articles)
          .where(eq(articles.published, true));
        
        if (input?.category) {
          // Use like for flexible category matching (e.g. bibliothèque:bible)
          query = db
            .select()
            .from(articles)
            .where(and(
              eq(articles.published, true),
              like(articles.category, `${input.category}%`)
            ));
        }

        const latestArticles = await query
          .orderBy(desc(articles.createdAt))
          .limit(3);

        if (latestArticles.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Aucun article publié à envoyer.",
          });
        }

        const emails = allSubscribers.map((s: any) => s.email);

        const { sendWeeklyDigest } = await import("./_core/newsletter.js");
        await sendWeeklyDigest(emails, latestArticles as any, input?.subject);

        return { success: true, count: emails.length };
      }),
  }),

  siteSettings: router({
    // Public: get a setting by key
    get: publicProcedure
      .input(zod.object({ key: z.string() }))
      .query(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) return null;
        const rows = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, input.key))
          .limit(1);
        return rows[0]?.value ?? null;
      }),

    // Public: get all settings
    getAll: publicProcedure.query(async () => {
      const { getDb } = await import("./db.js");
      const { siteSettings } = await import("../drizzle/schema.js");
      const db = await getDb();
      if (!db) return {};
      const rows = await db.select().from(siteSettings);
      return Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
    }),

    // Admin: set a setting
    set: adminProcedure
      .input(zod.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        const { getDb } = await import("./db.js");
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "DB unavailable",
          });

        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, input.key))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(siteSettings)
            .set({ value: input.value })
            .where(eq(siteSettings.key, input.key));
        } else {
          await db
            .insert(siteSettings)
            .values({ key: input.key, value: input.value });
        }
        return { success: true };
      }),

    // Admin: upload logo
    uploadLogo: adminProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop();
        const fileKey = `site/logo-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);

        // Save to site_settings
        const { getDb } = await import("./db.js");
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "DB unavailable",
          });

        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "logoUrl"))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(siteSettings)
            .set({ value: url })
            .where(eq(siteSettings.key, "logoUrl"));
        } else {
          await db.insert(siteSettings).values({ key: "logoUrl", value: url });
        }

        return { url };
      }),
    uploadHomeHeroBackground: adminProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop();
        const fileKey = `site/home-hero-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);

        const { getDb } = await import("./db.js");
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "DB unavailable",
          });

        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "homeHeroBgUrl"))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(siteSettings)
            .set({ value: url })
            .where(eq(siteSettings.key, "homeHeroBgUrl"));
        } else {
          await db
            .insert(siteSettings)
            .values({ key: "homeHeroBgUrl", value: url });
        }

        return { url };
      }),
    uploadCulteHeroBackground: adminProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop();
        const fileKey = `site/culte-hero-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);

        const { getDb } = await import("./db.js");
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "DB unavailable",
          });

        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "culteHeroBgUrl"))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(siteSettings)
            .set({ value: url })
            .where(eq(siteSettings.key, "culteHeroBgUrl"));
        } else {
          await db
            .insert(siteSettings)
            .values({ key: "culteHeroBgUrl", value: url });
        }

        return { url };
      }),
    uploadCulteBanner: adminProcedure
      .input(
        zod.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop();
        const fileKey = `site/culte-banner-${Date.now()}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.contentType);

        const { getDb } = await import("./db.js");
        const { siteSettings } = await import("../drizzle/schema.js");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "DB unavailable",
          });

        const existing = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "culteBannerUrl"))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(siteSettings)
            .set({ value: url })
            .where(eq(siteSettings.key, "culteBannerUrl"));
        } else {
          await db
            .insert(siteSettings)
            .values({ key: "culteBannerUrl", value: url });
        }

return { url };
      }),
   }),

  // ─── User Management ───────────────────────────────────────────
  users: router({
    list: adminProcedure.query(async () => {
      const { listAllUsers } = await import("./db.js");
      return listAllUsers();
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getUserById } = await import("./db.js");
        const user = await getUserById(input.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur non trouvé" });
        }
        return user;
      }),

    create: adminProcedure
      .input(
        z.object({
          openId: z.string(),
          name: z.string(),
          email: z.string().optional(),
          role: z.enum(["user", "admin", "editeur", "bibliotheque"]),
          password: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { createUser } = await import("./db.js");
        return createUser({
          openId: input.openId,
          name: input.name,
          email: input.email,
          role: input.role,
          password: input.password,
          loginMethod: "manual",
        });
      }),

    updateRole: adminProcedure
      .input(
        z.object({
          userId: z.number(),
          role: z.enum(["user", "admin", "editeur", "bibliotheque"]),
        })
      )
      .mutation(async ({ input }) => {
        const { updateUserRole } = await import("./db.js");
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteUser } = await import("./db.js");
        try {
          await deleteUser(input.userId);
          return { success: true };
        } catch (error: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message || "Erreur lors de la suppression",
          });
        }
      }),

    updatePassword: protectedProcedure
      .input(
        z.object({
          userId: z.number(),
          currentPassword: z.string(),
          newPassword: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Only allow user to change their own password, or admin
        if (ctx.user.role !== "admin" && ctx.user.id !== input.userId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur",
          });
        }

        const { getUserById, verifyUserPasswordById, updateUserPassword } = await import("./db.js");
        const user = await getUserById(input.userId);

        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur non trouvé" });
        }

        // Verify current password (unless admin)
        if (ctx.user.role !== "admin") {
          const isValid = await verifyUserPasswordById(input.userId, input.currentPassword);
          if (!isValid) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Mot de passe actuel incorrect",
            });
          }
        }

        // Update password
        await updateUserPassword(input.userId, input.newPassword);
        return { success: true };
      }),
  }),

  // ─── Announcements (Annonces & Événements flash) ──────────────
  announcements: router({
    list: publicProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const { listAnnouncements } = await import("./db.js");
        return listAnnouncements(input?.type);
      }),

    adminList: adminProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        const { adminListAnnouncements } = await import("./db.js");
        return adminListAnnouncements(input?.type);
      }),

    create: editeurProcedure
      .input(z.object({
        type: z.enum(["announcement", "flash-event"]),
        title: z.string().min(1).max(300),
        description: z.string().optional().default(""),
        mediaUrl: z.string().min(1),
        badge: z.string().optional(),
        eventDate: z.string().optional(),
        location: z.string().optional(),
        ctaLabel: z.string().optional(),
        ctaHref: z.string().optional(),
        variant: z.enum(["poster", "default", "compact"]).optional().default("poster"),
        displayOrder: z.number().optional().default(0),
        textColor: z.string().optional(),
        titleColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { createAnnouncement } = await import("./db.js");
        return createAnnouncement(input);
      }),

    update: editeurProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["announcement", "flash-event"]).optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        mediaUrl: z.string().optional(),
        badge: z.string().optional(),
        eventDate: z.string().optional(),
        location: z.string().optional(),
        ctaLabel: z.string().optional(),
        ctaHref: z.string().optional(),
        variant: z.enum(["poster", "default", "compact"]).optional(),
        displayOrder: z.number().optional(),
        visible: z.boolean().optional(),
        textColor: z.string().optional(),
        titleColor: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { updateAnnouncement } = await import("./db.js");
        const { id, ...data } = input;
        return updateAnnouncement(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteAnnouncement } = await import("./db.js");
        return deleteAnnouncement(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
