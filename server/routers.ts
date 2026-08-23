import { systemRouter } from "./_core/systemRouter.js";
import {
  publicProcedure,
  protectedProcedure,
  router,
  adminProcedure,
  adminOnlyProcedure,
  editeurProcedure,
  bibliothequeProcedure,
} from "./_core/trpc.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { generateClientTokenFromReadWriteToken } from "@vercel/blob/client";
import {
  checkUserQuota,
  estimateTokens,
  logAiUsage,
  getAiStats,
  getUserQuotaInfo,
} from "./_core/aiQuota.js";
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
  countGalleryItems,
  getFeaturedGalleryItems,
  getAllGalleryItems,
  getGalleryItemById,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
  createBiblicalVerse,
  updateBiblicalVerse,
  getBiblicalVerseById,
  deleteBiblicalVerse,
  listBiblicalVerses,
  getLatestBiblicalVerse,
  getVerseOfTheDay,
  countBiblicalVerses,
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
  getDb,
  listAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserById,
  verifyUserPasswordById,
  updateUserPassword,
  listAnnouncements,
  adminListAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  findUserByUsernameAndPassword,
  upsertUser,
  findUserByPassword,
} from "./db.js";
import { storagePut, getSignedUrl } from "./storage.js";
import { nanoid } from "nanoid";
import { themeRouter } from "./themeRouter.js";
import { withCache, clearCache } from "./_core/cache.js";
import { siteSettings, announcements, subscribers, articles, biblicalVerses, galleryItems } from "../drizzle/schema.js";
import { eq, desc, asc, and, like } from "drizzle-orm";
import { ENV } from "./_core/env.js";
import { invokeLLM, invokeLLMWithFallback } from "./_core/llm.js";
import { getProviderInfo, type AiProvider } from "../shared/aiProviders.js";
import { sdk } from "./_core/sdk.js";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { sendWelcomeEmail, sendWeeklyDigest, sendCustomNewsletter } from "./_core/newsletter.js";

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
  theme: themeRouter,
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
        
        
        const db = getDb();
        
        const allSubscribers = await db.select().from(subscribers);
        if (allSubscribers.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Aucun abonné." });
        }
        
        const emails = allSubscribers.map((s: any) => s.email);
        
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
        
        
        let openId: string;
        let name: string;
        
        // Si username fourni, chercher par username + password
        if (input.username) {
          
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
          
          
          await upsertUser({
            openId,
            name,
            role: "admin",
            lastSignedIn: new Date(),
          });
        } else {
          // Chercher un utilisateur avec ce mot de passe ( backward compat)
          
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

        
        const sessionToken = await sdk.createSessionToken(openId, { name });

        
        
        const cookieOptions = getSessionCookieOptions(ctx.req);

        (ctx.res as any).cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
        
        const folder = input.folder.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
        const key = `${folder}/${Date.now()}-${input.filename}`;
        
        let finalBuffer: any = buffer;
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
        
        return getSignedUrl(input.key, input.ttl ?? 3600);
      }),
    bulkSignedUrls: adminProcedure
      .input(zod.object({ keys: z.array(z.string()), ttl: z.number().optional() }))
      .mutation(async ({ input }) => {
        
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
        }).optional()
      )
      .query(async ({ input }) => {
        const { limit = 12, offset = 0, category, search, minPrice, maxPrice, type, theme, sort } = input ?? {};
        
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
          excerpt: input.excerpt?.slice(0, 1000),
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
        if (data.excerpt) {
          updateData.excerpt = data.excerpt.slice(0, 1000);
        }
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
        
        let finalBuffer: any = buffer;
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

    create: adminOnlyProcedure
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

    delete: adminOnlyProcedure
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
            category: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { limit = 20, offset = 0, category } = input ?? {};
        const [items, total] = await Promise.all([
          getAllGalleryItems(limit, offset, true, category),
          countGalleryItems(true, category),
        ]);
        return { items, total };
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
          coverImageUrl: z.string().optional(),
          coverImageKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
          verseId: z.number().optional(),
          category: z.string().optional().default("general"),
          displayOrder: z.number().default(0),
          featured: z.boolean().default(false),
          loop: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const item = await createGalleryItem(input);
        if (input.featured) {
          await createNotification({
            title: `Nouveau média à la une : ${input.title}`,
            message: `"${input.title}" a été publié dans les publications du jour.`,
            type: "nouveauté",
            linkUrl: "/publication-du-jour",
            authorId: ctx.user.id,
          });
        }
        return item;
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
          category: z.string().optional(),
          coverImageUrl: z.string().optional(),
          coverImageKey: z.string().optional(),
          mediaUrl: z.string().optional(),
          mediaKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const current = await getGalleryItemById(id);
        if (data.featured === true && current && !current.featured) {
          const title = data.title || current.title;
          await createNotification({
            title: `Média mis à la une : ${title}`,
            message: `"${title}" est maintenant en vedette dans les publications du jour.`,
            type: "nouveauté",
            linkUrl: "/publication-du-jour",
            authorId: ctx.user.id,
          });
        } else if (data.visible === true && current && !current.visible) {
          const title = data.title || current.title;
          await createNotification({
            title: `Nouveau média publié : ${title}`,
            message: `"${title}" a été publié dans la galerie.`,
            type: "nouveauté",
            linkUrl: "/galeries",
            authorId: ctx.user.id,
          });
        }
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
        
        let finalBuffer: any = buffer;
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
      const verse = await getVerseOfTheDay();
      return verse;
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

    adminList: adminProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const { limit = 50, offset = 0 } = input ?? {};
        const items = await listBiblicalVerses(limit, offset);
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
        
        let finalBuffer: any = buffer;
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
      
      
      const db = getDb();
      let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined = ENV.preferredAiProvider as any;

      if (db) {
        
        
        const rows = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "aiProvider"))
          .limit(1);
        const value = rows[0]?.value;
        provider = value as any;
      }

      const hasGroq = Boolean(ENV.groqApiKey);
      const hasGoogle = Boolean(ENV.googleApiKey);

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
              content: z.string().max(4000),
            })
          ).max(20),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        const inputTokens = input.messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
        checkUserQuota(userId, inputTokens);

        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          
          
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        
        const startTime = Date.now();
        try {
          const response = await invokeLLMWithFallback({
            messages: input.messages as any,
            provider,
          });
          const outputTokens = estimateTokens(response.choices[0].message.content as string);
          logAiUsage({
            timestamp: new Date(),
            userId,
            provider: provider || "groq",
            model: response.model,
            endpoint: "ai.chat",
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            success: true,
            durationMs: Date.now() - startTime,
          });
          return response.choices[0].message.content as string;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(),
            userId,
            provider: provider || "groq",
            model: "unknown",
            endpoint: "ai.chat",
            inputTokens,
            outputTokens: 0,
            totalTokens: inputTokens,
            success: false,
            error: err.message,
            durationMs: Date.now() - startTime,
          });
          throw err;
        }
      }),

    chatbot: publicProcedure
      .input(
        zod.object({
          messages: z.array(
            zod.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(4000),
            })
          ).max(30),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Base de données indisponible",
          });
        }

        // Vérifier si le chatbot est activé (en dev, toujours autorisé)
        if (process.env.NODE_ENV !== "development") {
          const chatbotSetting = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "chatbot_enabled"))
            .limit(1);
          if (chatbotSetting[0]?.value !== "true") {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Le chatbot est actuellement désactivé.",
            });
          }
        }

        const userId = ctx.user?.id?.toString() || "anonymous";
        const inputTokens = input.messages.reduce(
          (sum, m) => sum + estimateTokens(m.content),
          0
        );
        checkUserQuota(userId, inputTokens + 500);

        // Récupérer le provider actif
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        const providerRows = await db
          .select()
          .from(siteSettings)
          .where(eq(siteSettings.key, "aiProvider"))
          .limit(1);
        provider = providerRows[0]?.value as any;

        // Récupérer le contexte du site
        const [recentArticles, latestVerse, upcomingAnnouncements] =
          await Promise.all([
            db
              .select({
                title: articles.title,
                slug: articles.slug,
                excerpt: articles.excerpt,
                category: articles.category,
              })
              .from(articles)
              .where(eq(articles.published, true))
              .orderBy(desc(articles.createdAt))
              .limit(5),
            db
              .select()
              .from(biblicalVerses)
              .orderBy(desc(biblicalVerses.createdAt))
              .limit(1),
            db
              .select({
                title: announcements.title,
                description: announcements.description,
                eventDate: announcements.eventDate,
                location: announcements.location,
              })
              .from(announcements)
              .where(eq(announcements.visible, true))
              .orderBy(asc(announcements.displayOrder))
              .limit(3),
          ]);

        // Construire le system prompt avec contexte
        const siteContext = `
Tu es l'assistant virtuel de G12 Paris Infos Médias, un site d'informations et de ressources spirituelles.

CONTEXTE DU SITE :
- Derniers articles publiés :
${recentArticles.map((a: { title: string; category: string; excerpt: string | null }) => `  • "${a.title}" (${a.category}) — ${a.excerpt?.substring(0, 100) || "Pas de résumé"}`).join("\n")}

- Verset du jour :
${latestVerse[0] ? `  "${latestVerse[0].reference}" — "${latestVerse[0].text}"` : "  Aucun verset disponible"}

- Événements à venir :
${upcomingAnnouncements.length > 0 ? upcomingAnnouncements.map((a: { title: string; description: string; eventDate: string | null; location: string | null }) => `  • "${a.title}"${a.eventDate ? ` le ${a.eventDate}` : ""}${a.location ? ` à ${a.location}` : ""}`).join("\n") : "  Aucun événement à venir"}

RÈGLES :
- Réponds toujours en français.
- Sois chaleureux, concis et utile.
- Utilise le contexte du site pour enrichir tes réponses.
- Si on te pose une question sur les articles, les versets ou les événements, utilise les informations ci-dessus.
- Pour des questions spirituelles profondes, propose des versets pertinents.
- Si tu ne connais pas la réponse, honnêtement dis-le.
- Termine par une question ou suggestion pour continuer la conversation.
`.trim();

        const startTime = Date.now();
        try {
          const messagesWithSystem = [
            { role: "system" as const, content: siteContext },
            ...input.messages.map(
              (m) => ({ role: m.role as "user" | "assistant", content: m.content })
            ),
          ];

          const response = await invokeLLMWithFallback({
            messages: messagesWithSystem,
            provider,
          });

          const assistantMessage =
            response.choices[0].message.content as string;
          const outputTokens = estimateTokens(assistantMessage);

          logAiUsage({
            timestamp: new Date(),
            userId,
            provider: provider || "groq",
            model: response.model,
            endpoint: "ai.chatbot",
            inputTokens,
            outputTokens,
            totalTokens: inputTokens + outputTokens,
            success: true,
            durationMs: Date.now() - startTime,
          });

          return assistantMessage;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(),
            userId,
            provider: provider || "groq",
            model: "unknown",
            endpoint: "ai.chatbot",
            inputTokens,
            outputTokens: 0,
            totalTokens: inputTokens,
            success: false,
            error: err.message,
            durationMs: Date.now() - startTime,
          });
          throw err;
        }
      }),

    testProvider: adminProcedure
      .input(zod.object({ provider: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { listEnabledProviders } = await import("./_core/apiProviders.js");
        const enabledProviders = await listEnabledProviders();
        
        let provider = input.provider;
        
        if (!provider) {
          const db = getDb();
          if (db) {
            const rows = await db
              .select()
              .from(siteSettings)
              .where(eq(siteSettings.key, "aiProvider"))
              .limit(1);
            provider = rows[0]?.value as string || "groq";
          } else {
            provider = "groq";
          }
        }

        // Valider que le provider est activé
        if (!enabledProviders.includes(provider)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Provider "${provider}" non activé`,
          });
        }

        const response = await invokeLLM({
          messages: [{ role: "user", content: "Dis 'OK' si tu fonctionnes." }],
          provider,
        });

        const info = getProviderInfo(provider);
        
        return { 
          ok: true, 
          provider,
          model: info.model,
          response: response.choices[0].message.content 
        };
      }),

    updateProviders: adminProcedure.mutation(async () => {
      const { isProviderConfigured } = await import("./_core/llm.js");
      const {
        recordProviderFailure,
        recordProviderSuccess,
        getProviderHealth,
      } = await import("./_core/providerHealth.js");

      const { listEnabledProviders } = await import("./_core/apiProviders.js");
      const providers = await listEnabledProviders();
      const results: Array<{
        provider: string;
        configured: boolean;
        ok: boolean;
        model?: string;
        modelReplaced?: boolean;
        modelFrom?: string;
        obsolete?: boolean;
        error?: string;
        status?: string;
      }> = [];

      for (const provider of providers) {
        const configured = await isProviderConfigured(provider);
        if (!configured) {
          recordProviderFailure(provider, "config", "Clé API non configurée");
          results.push({
            provider,
            configured: false,
            ok: false,
            status: getProviderHealth(provider).status,
            error: "Clé API non configurée",
          });
          continue;
        }

        // Vérification d'obsolescence du modèle
        const { resolveModel, fetchActiveModels } = await import("./_core/modelRegistry.js");
        const { getApiKey } = await import("./_core/apiKeys.js");
        const apiKey = (await getApiKey(provider)) || "";
        const defaultModel = resolveModel(provider).model;
        let obsolete = false;
        let activeModels: string[] = [];
        if (provider === "groq" || provider === "aimlapi") {
          activeModels = await fetchActiveModels(provider, apiKey);
          if (activeModels.length > 0 && !activeModels.includes(defaultModel)) {
            obsolete = true;
            console.warn(
              `[AI Model] ${provider}: "${defaultModel}" absent de la liste live des modèles actifs`
            );
          }
        }

        try {
          const response = await invokeLLM({
            messages: [{ role: "user", content: "Dis 'OK' si tu fonctionnes." }],
            provider,
            maxTokens: 10,
          });
          recordProviderSuccess(provider);
          const info = getProviderInfo(provider);
          const resolved = resolveModel(provider, response.model);
          results.push({
            provider,
            configured: true,
            ok: true,
            model: response.model || info.model,
            modelReplaced: resolved.replaced,
            modelFrom: resolved.replaced ? resolved.from : undefined,
            obsolete,
            status: "healthy",
          });
        } catch (err: any) {
          const { classifyError } = await import("./_core/providerHealth.js");
          const kind = classifyError(err);
          recordProviderFailure(provider, kind, err.message);
          results.push({
            provider,
            configured: true,
            ok: false,
            obsolete,
            status: getProviderHealth(provider).status,
            error: err.message,
          });
        }
      }

      return { ok: true, results };
    }),

    // ─── Connecteur de clés API ───────────────────────────────────
    apiKeys: router({
      list: adminProcedure.query(async () => {
        const { listApiKeyStatus } = await import("./_core/apiKeys.js");
        return listApiKeyStatus();
      }),

      set: adminProcedure
        .input(
          zod.object({
            provider: z.string().min(1),
            value: z.string(),
          })
        )
        .mutation(async ({ input }) => {
          const { setApiKey, resetApiKeyCache } = await import("./_core/apiKeys.js");
          const { resetProviderHealth } = await import("./_core/providerHealth.js");
          await setApiKey(input.provider as any, input.value);
          resetApiKeyCache();
          resetProviderHealth(input.provider as any);
          return { ok: true };
        }),

      remove: adminProcedure
        .input(
          zod.object({
            provider: z.string().min(1),
          })
        )
        .mutation(async ({ input }) => {
          const { removeApiKey, resetApiKeyCache } = await import("./_core/apiKeys.js");
          const { resetProviderHealth } = await import("./_core/providerHealth.js");
          await removeApiKey(input.provider as any);
          resetApiKeyCache();
          resetProviderHealth(input.provider as any);
          return { ok: true };
        }),
    }),

    // ─── Gestion dynamique des providers ───────────────────────────
    providers: router({
      list: adminProcedure.query(async () => {
        const { listProviders } = await import("./_core/apiProviders.js");
        return listProviders();
      }),

      add: adminProcedure
        .input(
          zod.object({
            provider: z.string().min(1).max(50),
            label: z.string().min(1).max(100),
            model: z.string().min(1).max(100),
            baseUrl: z.string().url().optional(),
            enabled: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { upsertProvider, resetProviderCache } = await import("./_core/apiProviders.js");
          await upsertProvider({
            provider: input.provider.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            label: input.label,
            model: input.model,
            baseUrl: input.baseUrl,
            enabled: input.enabled,
          });
          resetProviderCache();
          return { ok: true };
        }),

      remove: adminProcedure
        .input(zod.object({ provider: z.string().min(1) }))
        .mutation(async ({ input }) => {
          const { removeProvider, resetProviderCache } = await import("./_core/apiProviders.js");
          const { resetProviderHealth } = await import("./_core/providerHealth.js");
          await removeProvider(input.provider);
          resetProviderCache();
          resetProviderHealth(input.provider as any);
          return { ok: true };
        }),
    }),

    generateDescription: adminProcedure
      .input(
        zod.object({
          title: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        checkUserQuota(userId, estimateTokens(input.title) + 200);

        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          
          
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        
        const prompt = `Rédige une description courte (2-3 phrases) et percutante pour un contenu de type "${input.contentType}" intitulé "${input.title}". Le ton doit être inspirant et spirituel.`;
        const startTime = Date.now();
        try {
          const response = await invokeLLMWithFallback({
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
          const content = response.choices[0].message.content as string;
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: response.model, endpoint: "ai.generateDescription",
            inputTokens: estimateTokens(prompt), outputTokens: estimateTokens(content),
            totalTokens: estimateTokens(prompt) + estimateTokens(content),
            success: true, durationMs: Date.now() - startTime,
          });
          return content;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: "unknown", endpoint: "ai.generateDescription",
            inputTokens: estimateTokens(prompt), outputTokens: 0,
            totalTokens: estimateTokens(prompt), success: false,
            error: err.message, durationMs: Date.now() - startTime,
          });
          throw err;
        }
      }),

    improveText: adminProcedure
      .input(
        zod.object({
          text: z.string().min(1),
          tone: z.enum(["biblical", "normal"]),
          field: z.enum(["excerpt", "content"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | "ollama" | undefined;
        if (db) {
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          provider = rows[0]?.value as any;
        }

        const systemPrompt =
          input.tone === "biblical"
            ? "Tu es un assistant rédactionnel chrétien. Améliore le texte donné en lui donnant une tonalité spirituelle et biblique, avec des références aux Écritures si pertinent. Garde la structure et la longueur similaires."
            : "Tu es un assistant rédactionnel expert en reformulation. Réécris le texte en substituant des mots, des phrases et des paragraphes pour le rendre unique et plus attrayant tout en transmettant fidèlement le message d'origine. Garde la structure et la longueur similaires.";

        const fieldHint =
          input.field === "excerpt"
            ? " (résumé / description courte)"
            : " (contenu principal)";

        const prompt = `Améliore le texte suivant${fieldHint} :\n\n${input.text}`;
        const startTime = Date.now();
        checkUserQuota(userId, estimateTokens(input.text) + 200);

        try {
          const response = await invokeLLMWithFallback({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt },
            ],
            provider,
          });
          const improved = response.choices[0].message.content as string;
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq", model: response.model,
            endpoint: "ai.improveText", inputTokens: estimateTokens(input.text),
            outputTokens: estimateTokens(improved), totalTokens: estimateTokens(input.text) + estimateTokens(improved),
            success: true, durationMs: Date.now() - startTime,
          });
          return improved;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: "unknown", endpoint: "ai.improveText",
            inputTokens: estimateTokens(input.text), outputTokens: 0,
            totalTokens: estimateTokens(input.text), success: false,
            error: err.message, durationMs: Date.now() - startTime,
          });
          throw err;
        }
      }),

    spellCheck: adminProcedure
      .input(z.object({ text: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | "ollama" | undefined;
        if (db) {
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          provider = rows[0]?.value as any;
        }

        const prompt = `Corrige uniquement les fautes d'orthographe, de grammaire et de conjugaison dans le texte suivant. Ne modifie PAS le style, le ton ou le contenu. Réponds uniquement avec le texte corrigé, sans commentaires.\n\n${input.text}`;
        const startTime = Date.now();
        checkUserQuota(userId, estimateTokens(input.text) + 100);

        try {
          const response = await invokeLLMWithFallback({
            messages: [
              {
                role: "system",
                content: "Tu es un correcteur orthographique français. Tu corriges uniquement les erreurs sans reformuler.",
              },
              { role: "user", content: prompt },
            ],
            provider,
          });
          const corrected = response.choices[0].message.content as string;
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq", model: response.model,
            endpoint: "ai.spellCheck", inputTokens: estimateTokens(input.text),
            outputTokens: estimateTokens(corrected), totalTokens: estimateTokens(input.text) + estimateTokens(corrected),
            success: true, durationMs: Date.now() - startTime,
          });
          return corrected;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: "unknown", endpoint: "ai.spellCheck",
            inputTokens: estimateTokens(input.text), outputTokens: 0,
            totalTokens: estimateTokens(input.text), success: false,
            error: err.message, durationMs: Date.now() - startTime,
          });
          throw err;
        }
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
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        checkUserQuota(userId, 500);

        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          
          
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        

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

        const response = await invokeLLMWithFallback({
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
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: response.model, endpoint: "ai.generateVerse",
            inputTokens: 500, outputTokens: estimateTokens(raw),
            totalTokens: 500 + estimateTokens(raw), success: true,
            durationMs: 0,
          });
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
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        checkUserQuota(userId, estimateTokens(input.title + input.content) + 300);

        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          
          
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        
        const prompt = `En tant qu'érudit biblique, suggère le verset biblique le plus pertinent pour accompagner l'article suivant :
        Titre : "${input.title}"
        Contenu : "${input.content.substring(0, 1000)}..."
        
        Ton format de réponse DOIT ÊTRE UNIQUEMENT un objet JSON valide :
        {
          "reference": "Livre Chapitre:Verset",
          "text": "Le texte du verset...",
          "summary": "Un résumé court (2-3 phrases) expliquant pourquoi ce verset est pertinent pour cet article."
        }`;

        const response = await invokeLLMWithFallback({
          messages: [
            {
              role: "system",
              content: "Tu réponds strictement en JSON.",
            },
            { role: "user", content: prompt },
          ],
          provider: provider || "minimax",
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
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "minimax",
            model: response.model, endpoint: "ai.suggestVerseForArticle",
            inputTokens: 300, outputTokens: estimateTokens(raw),
            totalTokens: 300 + estimateTokens(raw), success: true, durationMs: 0,
          });
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
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        checkUserQuota(userId, estimateTokens(input.text) + 200);

        const db = getDb();
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          
          
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }
        
        const languageName =
          input.targetLanguage === "en" ? "anglais" : "espagnol";
        const prompt = `Voici un texte en français (qui peut contenir du HTML). Traduis-le en ${languageName} en gardant exactement la même structure HTML s'il y en a. Renvoie UNIQUEMENT la traduction, sans aucun commentaire ou texte avant ou après :\n\n${input.text}`;

        const startTime = Date.now();
        try {
          const response = await invokeLLMWithFallback({
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
          const result = content
            .replace(/^```html/i, "")
            .replace(/^```/i, "")
            .replace(/```$/i, "")
            .trim();
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: response.model, endpoint: "ai.translate",
            inputTokens: estimateTokens(prompt), outputTokens: estimateTokens(content),
            totalTokens: estimateTokens(prompt) + estimateTokens(content),
            success: true, durationMs: Date.now() - startTime,
          });
          return result;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: "unknown", endpoint: "ai.translate",
            inputTokens: estimateTokens(prompt), outputTokens: 0,
            totalTokens: estimateTokens(prompt), success: false,
            error: err.message, durationMs: Date.now() - startTime,
          });
          throw err;
        }
      }),

    search: publicProcedure
      .input(
        zod.object({
          query: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const isAuthenticated = !!ctx.user;
        const userId = ctx.user?.id?.toString() || "anonymous-demo";

        // Mode démo : limite plus stricte
        if (!isAuthenticated) {
          checkUserQuota(userId, estimateTokens(input.query) + 200);
        } else {
          checkUserQuota(userId, estimateTokens(input.query) + 500);
        }

        const db = getDb();

        let contextText = "";
        if (db) {
          
          
          // Mode démo: 3 articles | Connecté: 10 articles
          const limit = isAuthenticated ? 10 : 3;
          const rows = await db
            .select({
              title: articles.title,
              excerpt: articles.excerpt,
              content: articles.content,
            })
            .from(articles)
            .where(eq(articles.published, true))
            .limit(limit);

          contextText = rows
            .map(
              (a: any) =>
                `Titre: ${a.title}\nContenu: ${a.excerpt || a.content.substring(0, 200)}`
            )
            .join("\n\n");
        }

        
        let provider: "google" | "groq" | "minimax" | "aimlapi" | undefined;
        if (db) {
          
          
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          const value = rows[0]?.value;
          provider = value as any;
        }

        // Prompt différent selon le mode
        const systemPrompt = isAuthenticated
          ? "Tu es l'assistant IA spirituel de G12 Paris Media. Tu réponds avec bienveillance et sagesse."
          : "Tu es l'assistant IA de démonstration de G12 Paris Media. Réponds de manière concise (1 court paragraphe maximum). Si la question nécessite une réponse longue, suggère à l'utilisateur de se connecter pour une réponse complète.";

        const userPrompt = isAuthenticated
          ? `L'utilisateur pose cette question ou recherche: "${input.query}".\n\nVoici quelques extraits des récents articles du site:\n${contextText}\n\nRéponds de manière spirituelle et bienveillante en utilisant les articles comme contexte si pertinent, sinon donne une réponse inspirante chrétienne globale. Reste concis (1-3 paragraphes).`
          : `Question de démonstration: "${input.query}"\n\n${contextText ? `Extraits du site:\n${contextText}\n\n` : ""}Réponds en 1 court paragraphe maximum. Sois concis et inspirant.`;

        const startTime = Date.now();
        try {
          const response = await invokeLLMWithFallback({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            provider,
          });

          const content = response.choices[0].message.content as string;
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: response.model, endpoint: isAuthenticated ? "ai.search" : "ai.search.demo",
            inputTokens: estimateTokens(userPrompt), outputTokens: estimateTokens(content),
            totalTokens: estimateTokens(userPrompt) + estimateTokens(content),
            success: true, durationMs: Date.now() - startTime,
          });

          // Mode démo: préfixer avec un avertissement
          if (!isAuthenticated) {
            return content + "\n\n---\n*🔒 Connectez-vous pour des réponses plus complètes et personnalisées.*";
          }
          return content;
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq",
            model: "unknown", endpoint: isAuthenticated ? "ai.search" : "ai.search.demo",
            inputTokens: estimateTokens(userPrompt), outputTokens: 0,
            totalTokens: estimateTokens(userPrompt), success: false,
            error: err.message, durationMs: Date.now() - startTime,
          });
          throw err;
        }
      }),

    // ─── AI Image Generation (Google Imagen) ──────────────────────
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
        let imageUrl: string | undefined;

        // Try Cloudflare Workers AI first
        if (ENV.cloudflareApiToken && ENV.cloudflareAccountId) {
          try {
            const cfResponse = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${ENV.cloudflareApiToken}`,
                },
                body: JSON.stringify({ prompt: input.prompt.substring(0, 500) }),
              }
            );
            if (cfResponse.ok) {
              const cfData = (await cfResponse.json()) as any;
              const base64 = cfData?.result?.image;
              if (base64) imageUrl = `data:image/jpeg;base64,${base64}`;
            }
          } catch { /* fallback */ }
        }

        // Fallback: aimlapi
        if (!imageUrl && ENV.aimlApiKey) {
          try {
            const aimlResponse = await fetch(
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
                  aspect_ratio: input.aspectRatio === "16:9" ? "16:9" : "1:1",
                  n: 1,
                }),
              }
            );
            if (aimlResponse.ok) {
              const aimlData = (await aimlResponse.json()) as any;
              imageUrl = aimlData?.data?.[0]?.url || aimlData?.images?.[0]?.url || aimlData?.url;
            }
          } catch { /* fall through */ }
        }

        if (!imageUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Aucune API d'image disponible",
          });
        }
        return { url: imageUrl };
      }),

    // ─── Check API Credits ─────────────────────────────────────────
    checkApiCredits: adminProcedure.query(async () => {
      const results: Record<string, { ok: boolean; error?: string; credits?: string }> = {};

      // AIMLAPI
      results.aimlapi = { ok: !!ENV.aimlApiKey };
      if (ENV.aimlApiKey) {
        try {
          const test = await fetch(
            "https://api.aimlapi.com/v1/models",
            { headers: { Authorization: `Bearer ${ENV.aimlApiKey}` }, signal: AbortSignal.timeout(5000) }
          );
          if (test.ok) results.aimlapi = { ok: true, credits: "Connexion OK" };
          else {
            const err = await test.text();
            results.aimlapi = { ok: false, error: `HTTP ${test.status}: ${err.substring(0, 100)}` };
          }
        } catch (e: any) {
          results.aimlapi = { ok: false, error: e.message };
        }
      } else {
        results.aimlapi = { ok: false, error: "Clé non configurée" };
      }

      // Groq
      results.groq = { ok: !!ENV.groqApiKey };
      if (ENV.groqApiKey) {
        try {
          const resp = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${ENV.groqApiKey}` },
            signal: AbortSignal.timeout(5000),
          });
          if (resp.ok) {
            const data = await resp.json();
            const models = data?.data?.length ?? 0;
            results.groq = { ok: true, credits: `${models} modèles disponibles` };
          } else {
            const err = await resp.text();
            results.groq = { ok: false, error: `HTTP ${resp.status}: ${err.substring(0, 100)}` };
          }
        } catch (e: any) {
          results.groq = { ok: false, error: e.message };
        }
      } else {
        results.groq = { ok: false, error: "Clé non configurée" };
      }

      return results;
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
        const { getApiKey } = await import("./_core/apiKeys.js");
        const klingKey = await getApiKey("kling");

        if (!klingKey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Clé API Kling non configurée (connecteur de clés API)",
          });
        }

        // Step 1: Submit the generation request (Kling direct API)
        const submitResp = await fetch(
          "https://api.klingai.com/v1/video/generations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${klingKey}`,
            },
            body: JSON.stringify({
              model: input.imageUrl ? "kling-v1-6-image-to-video" : "kling-v1-6-text-to-video",
              prompt: input.prompt,
              negative_prompt: input.negativePrompt || "",
              duration: input.duration === "5" ? 5 : 10,
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
        const generationId = submitData?.data?.task_id || submitData?.id || submitData?.task_id;
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
            `https://api.klingai.com/v1/video/generations/${generationId}`,
            {
              headers: { Authorization: `Bearer ${klingKey}` },
            }
          );
          if (!pollResp.ok) continue;
          const pollData = (await pollResp.json()) as any;
          const status = pollData?.data?.task_status || pollData?.status;
          if (status === "completed" || status === "success" || status === "succeeded") {
            const videoUrl =
              pollData?.data?.task_result?.videos?.[0]?.url ||
              pollData?.video?.url ||
              pollData?.output?.url ||
              pollData?.url;
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

    // ─── AI Stats & Quota ──────────────────────────────────────────
    stats: adminProcedure.query(async ({ ctx }) => {
      const stats = getAiStats();
      const userId = ctx.user?.id?.toString() || "anonymous";
      const quota = getUserQuotaInfo(userId);
      const { getAllProviderHealth, getFallbackEvents } = await import("./_core/providerHealth.js");
      const { listEnabledProviders } = await import("./_core/apiProviders.js");
      const providers = await listEnabledProviders();
      return {
        ...stats,
        userQuota: quota,
        providerHealth: getAllProviderHealth(providers),
        fallbackEvents: getFallbackEvents(),
      };
    }),

    resetProviderHealth: adminProcedure
      .input(zod.object({ provider: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { resetProviderHealth } = await import("./_core/providerHealth.js");
        if (input.provider) {
          resetProviderHealth(input.provider as any);
        } else {
          const { listEnabledProviders } = await import("./_core/apiProviders.js");
          const providers = await listEnabledProviders();
          for (const p of providers) {
            resetProviderHealth(p as any);
          }
        }
        return { ok: true };
      }),

    quota: adminProcedure.query(async ({ ctx }) => {
      const userId = ctx.user?.id?.toString() || "anonymous";
      return getUserQuotaInfo(userId);
    }),

    // ─── AI Article Writer — Maker (génère l'article) ────────────
    writeArticle: editeurProcedure
      .input(
        zod.object({
          topic: z.string().min(3).max(1000),
          keywords: z.string().max(500).optional(),
          tone: z.enum(["informatif", "spirituel", "inspirationnel", "biblique"]).default("spirituel"),
          language: z.enum(["fr", "en", "es"]).default("fr"),
          category: z.string().max(100).default("actualité"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        const estimatedTokens = 4000;
        checkUserQuota(userId, estimatedTokens);

        const db = getDb();
        let provider;
        if (db) {
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, "aiProvider"))
            .limit(1);
          provider = rows[0]?.value as any;
        }

        const langLabel = input.language === "fr" ? "français" : input.language === "en" ? "anglais" : "espagnol";

        const toneDesc = input.tone === "biblique" ? "centré sur les Écritures, exégétique" : input.tone === "spirituel" ? "édifiant, accessible, avec une perspective chrétienne" : input.tone === "inspirationnel" ? "motivant, encourageant, tourné vers l'action" : "informatif, journalistique, clair";

        // ─── Phase 1 : MAKER — Génère l'article ───────────────
        const makerSystem = `Tu es un rédacteur professionnel pour "G12 Paris Infos Médias", site chrétien d'actualités et de ressources spirituelles.

Écris un article complet en ${langLabel} sur : "${input.topic}"
${input.keywords ? `Mots-clés : ${input.keywords}` : ""}
Ton : ${toneDesc}

RÈGLES :
- HTML simple : <h2>, <p>, <blockquote>, <em>, <strong>, <ul>/<li>
- 800-1500 mots, introduction + conclusion
- Références bibliques pertinentes
- Conclusion encourageante

JSON UNIQUEMENT :
{
  "title": "Titre accrocheur (60-80 car.)",
  "excerpt": "Résumé 2-3 phrases (150-200 car.)",
  "sections": ["Section 1", "Section 2", "Section 3"],
  "content": "HTML complet",
  "suggestedVerse": { "reference": "...", "text": "...", "summary": "..." },
  "seo": { "metaDescription": "...", "tags": ["..."] }
}`;

        const startTime = Date.now();
        let data: any;
        try {
          const response = await invokeLLMWithFallback({
            messages: [
              { role: "system", content: makerSystem },
              { role: "user", content: `Écris un article ${input.tone} en ${langLabel} sur : "${input.topic}"` },
            ],
            provider,
            responseFormat: { type: "json_object" },
          });
          const raw = response.choices[0].message.content as string;
          data = JSON.parse(raw);
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq", model: "unknown",
            endpoint: "ai.writeArticle.maker", inputTokens: estimatedTokens, outputTokens: 0,
            totalTokens: estimatedTokens, success: false, error: err.message, durationMs: Date.now() - startTime,
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Échec de la génération: ${err.message}` });
        }

        // ─── Phase 2 : PAS DE CHECKER — Retour direct du Maker ──────────
          const totalTokens = estimatedTokens;

          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq", model: "maker-direct",
            endpoint: "ai.writeArticle",
            inputTokens: estimatedTokens,
            outputTokens: totalTokens,
            totalTokens,
            success: true,
            durationMs: Date.now() - startTime,
          });

          return {
            title: data.title || "",
            excerpt: data.excerpt || "",
            content: data.content || "",
            sections: data.sections || [],
            suggestedVerse: data.suggestedVerse || null,
            seo: data.seo || { metaDescription: "", tags: [] },
            review: { approved: true, score: 10, issues: [], suggestions: [] },
          };
      }),

    // ─── AI Article Feedback Loop — Améliore un article existant ────
    improveArticle: editeurProcedure
      .input(
        zod.object({
          title: z.string(),
          excerpt: z.string().optional(),
          content: z.string(),
          feedback: z.string().min(3).max(2000),
          tone: z.enum(["informatif", "spirituel", "inspirationnel", "biblique"]).default("spirituel"),
          language: z.enum(["fr", "en", "es"]).default("fr"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        const estimatedTokens = 2000;
        checkUserQuota(userId, estimatedTokens);

        const db = getDb();
        let provider;
        if (db) {
          const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "aiProvider")).limit(1);
          provider = rows[0]?.value as any;
        }

        const langLabel = input.language === "fr" ? "français" : input.language === "en" ? "anglais" : "espagnol";
        const startTime = Date.now();

        try {
          const response = await invokeLLMWithFallback({
            messages: [
              { role: "system", content: `Tu améliores un article pour G12 Paris Infos Médias en ${langLabel}.

Retourne UNIQUEMENT ce JSON :
{
  "title": "Titre amélioré ou inchangé",
  "excerpt": "Résumé amélioré ou inchangé",
  "content": "Contenu HTML amélioré",
  "changelog": "Résumé des modifications apportées"
}

Feedback utilisateur : "${input.feedback}"
${input.tone === "biblique" ? "Style exégétique, centré sur les Écritures." : input.tone === "spirituel" ? "Style édifiant, accessible." : input.tone === "inspirationnel" ? "Style motivant, encourageant." : "Style informatif, journalistique."}
Applique le feedback sans dénaturer le fond.` },
              { role: "user", content: `Titre: ${input.title}\nRésumé: ${input.excerpt || ""}\n\nContenu:\n${input.content.substring(0, 4000)}\n\nFeedback: ${input.feedback}` },
            ],
            provider,
            responseFormat: { type: "json_object" },
          });

          const raw = response.choices[0].message.content as string;
          const data = JSON.parse(raw);

          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq", model: response.model,
            endpoint: "ai.improveArticle", inputTokens: estimatedTokens,
            outputTokens: estimateTokens(raw), totalTokens: estimatedTokens + estimateTokens(raw),
            success: true, durationMs: Date.now() - startTime,
          });

          return { title: data.title || input.title, excerpt: data.excerpt || input.excerpt, content: data.content || input.content, changelog: data.changelog || "" };
        } catch (err: any) {
          logAiUsage({
            timestamp: new Date(), userId, provider: provider || "groq", model: "unknown",
            endpoint: "ai.improveArticle", inputTokens: estimatedTokens, outputTokens: 0,
            totalTokens: estimatedTokens, success: false, error: err.message, durationMs: Date.now() - startTime,
          });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Échec de l'amélioration: ${err.message}` });
        }
      }),

    // ─── AI Image Loop — Génération + Édition + Upload ──────────
    generateImageLoop: editeurProcedure
      .input(
        z.object({
          prompt: z.string().min(1).max(1000),
          referenceImage: z.string().optional(),
          editFeedback: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        checkUserQuota(userId, 500);

        const genImage = async (p: string): Promise<string | undefined> => {
          // Try Cloudflare
          if (ENV.cloudflareApiToken && ENV.cloudflareAccountId) {
            try {
              const res = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENV.cloudflareApiToken}` },
                  body: JSON.stringify({ prompt: p.substring(0, 500) }),
                }
              );
              if (res.ok) {
                const d = (await res.json()) as any;
                if (d?.result?.image) return `data:image/jpeg;base64,${d.result.image}`;
              }
            } catch { /* fallback */ }
          }
          // Fallback aimlapi
          if (ENV.aimlApiKey) {
            try {
              const res = await fetch("https://api.aimlapi.com/v1/images/generations", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENV.aimlApiKey}` },
                body: JSON.stringify({ model: "flux/schnell", prompt: p.substring(0, 500), aspect_ratio: "16:9", n: 1 }),
              });
              if (res.ok) {
                const d = (await res.json()) as any;
                return d?.data?.[0]?.url || d?.images?.[0]?.url || d?.url;
              }
            } catch { /* fall through */ }
          }
          return undefined;
        };

        const startTime = Date.now();
        let phase = "generation";
        let imageUrl: string | undefined;

        // Phase 1: Generate
        imageUrl = await genImage(input.prompt);
        if (!imageUrl) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Échec de la génération d'image" });
        }

        // Phase 2: Edit if feedback provided
        if (input.editFeedback) {
          phase = "editing";
          const editPrompt = `${input.prompt}. ${input.editFeedback}`;
          const edited = await genImage(editPrompt);
          if (edited) imageUrl = edited;
        }

        logAiUsage({
          timestamp: new Date(), userId, provider: "cloudflare", model: "flux-1-schnell",
          endpoint: "ai.generateImageLoop", inputTokens: 500, outputTokens: 0,
          totalTokens: 500, success: true, durationMs: Date.now() - startTime,
        });

        return { url: imageUrl, phase };
      }),

    // ─── Generate Article Cover Image ────────────────────────────
    generateArticleCover: editeurProcedure
      .input(
        z.object({
          title: z.string().min(1).max(500),
          excerpt: z.string().optional(),
          tone: z.enum(["informatif", "spirituel", "inspirationnel", "biblique"]).default("spirituel"),
          verse: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const userId = ctx.user?.id?.toString() || "anonymous";
        checkUserQuota(userId, 200);

        const db = getDb();
        let provider;
        if (db) {
          const rows = await db.select().from(siteSettings).where(eq(siteSettings.key, "aiProvider")).limit(1);
          provider = rows[0]?.value as any;
        }

        const visualPrompt = `Tu génères un prompt pour une IA de génération d'image (Flux Schnell).

Transforme ce titre d'article chrétien en un prompt visuel court et efficace (max 200 car.) :
- Style : ${input.tone === "biblique" ? "art biblique, style classique" : input.tone === "spirituel" ? "lumineux, doux, spirituel" : input.tone === "inspirationnel" ? "moderne, dynamique, inspirant" : "journalistique, épuré, professionnel"}
- Format : paysage 16:9
- Le verset biblique "${input.verse || ""}" doit être intégré textuellement dans l'image, de façon élégante (typographie sobre, en bas ou au centre)
- Pas de personnes identifiables (Jésus, etc.)

Retourne UNIQUEMENT le prompt, pas de JSON.`;

        try {
          const llmResponse = await invokeLLMWithFallback({
            messages: [
              { role: "system", content: visualPrompt },
              { role: "user", content: `Titre: "${input.title}"${input.excerpt ? `\nRésumé: ${input.excerpt}` : ""}` },
            ],
            provider,
          });

          const imagePrompt = llmResponse.choices[0].message.content as string;

          let imageUrl: string | undefined;

          // Try Cloudflare Workers AI first
          if (ENV.cloudflareApiToken && ENV.cloudflareAccountId) {
            try {
              const cfResponse = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ENV.cloudflareApiToken}`,
                  },
                  body: JSON.stringify({ prompt: imagePrompt.substring(0, 500) }),
                }
              );
              if (cfResponse.ok) {
                const cfData = (await cfResponse.json()) as any;
                const base64 = cfData?.result?.image;
                if (base64) imageUrl = `data:image/jpeg;base64,${base64}`;
              }
            } catch { /* fallback */ }
          }

          // Fallback: aimlapi
          if (!imageUrl && ENV.aimlApiKey) {
            try {
              const aimlResponse = await fetch(
                "https://api.aimlapi.com/v1/images/generations",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${ENV.aimlApiKey}`,
                  },
                  body: JSON.stringify({
                    model: "flux/schnell",
                    prompt: imagePrompt.substring(0, 500),
                    aspect_ratio: "16:9",
                    n: 1,
                  }),
                }
              );
              if (aimlResponse.ok) {
                const aimlData = (await aimlResponse.json()) as any;
                imageUrl = aimlData?.data?.[0]?.url || aimlData?.images?.[0]?.url || aimlData?.url;
              }
            } catch { /* fall through */ }
          }

          if (!imageUrl) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Aucune API d'image disponible" });
          }

          return { url: imageUrl, prompt: imagePrompt };
        } catch (err: any) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Échec de la génération d'image: ${err.message}` });
        }
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
        
        
        
        const db = getDb();

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
        
        await sendWelcomeEmail(input.email, input.name);

        return { success: true };
      }),

    listSubscribers: adminProcedure
      .input(z.object({ limit: z.number().default(100), offset: z.number().default(0) }).optional())
      .query(async ({ input }) => {
        const db = getDb();
        const { limit = 100, offset = 0 } = input ?? {};
        const items = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit).offset(offset);
        return { items };
      }),

    deleteSubscriber: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        
        
        
        const db = getDb();
        await db.delete(subscribers).where(eq(subscribers.id, input.id));
        return { success: true };
      }),

    sendDigest: adminProcedure
      .input(zod.object({ 
        subject: z.string().optional(),
        category: z.string().optional()
      }).optional())
      .mutation(async ({ input }) => {
        const db = getDb();

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

        
        await sendWeeklyDigest(emails, latestArticles as any, input?.subject);

        return { success: true, count: emails.length };
      }),
  }),

  siteSettings: router({
    get: publicProcedure
      .input(zod.object({ key: z.string() }))
      .query(async ({ input }) => {
        return withCache(`site:${input.key}`, async () => {
          const db = getDb();
          if (!db) return null;
          const rows = await db
            .select()
            .from(siteSettings)
            .where(eq(siteSettings.key, input.key))
            .limit(1);
          return rows[0]?.value ?? null;
        }, 30_000);
      }),

    getAll: publicProcedure.query(async () => {
      return withCache("site:all", async () => {
        const db = getDb();
        if (!db) return {};
        const rows = await db.select().from(siteSettings);
        return Object.fromEntries(rows.map((r: any) => [r.key, r.value]));
      }, 30_000);
    }),

    set: adminProcedure
      .input(zod.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ input }) => {
        clearCache(`site:${input.key}`);
        clearCache("site:all");
        const db = getDb();
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
        
        
        
        const db = getDb();
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

        
        
        
        const db = getDb();
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

        
        
        
        const db = getDb();
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

        
        
        
        const db = getDb();
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
      
      return listAllUsers();
    }),

    get: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        
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
        
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        
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
        
        return listAnnouncements(input?.type);
      }),

    adminList: adminProcedure
      .input(z.object({ type: z.string().optional() }).optional())
      .query(async ({ input }) => {
        
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
        
        const { id, ...data } = input;
        return updateAnnouncement(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        
        return deleteAnnouncement(input.id);
      }),
  }),
  agents: router({
    list: adminProcedure.query(async () => {
      const { listAgents } = await import("./_core/agents.js");
      return listAgents();
    }),
    run: adminProcedure
      .input(z.object({ id: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { runAgent } = await import("./_core/agents.js");
        return runAgent(input.id);
      }),
    logs: adminProcedure
      .input(z.object({ limit: z.number().optional().default(50) }))
      .query(async ({ input }) => {
        const { getAgentLogs } = await import("./_core/agents.js");
        return getAgentLogs(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
