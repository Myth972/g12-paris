import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.ts";
import { systemRouter } from "./_core/systemRouter.ts";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.ts";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
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
  deleteGalleryItem,
  createBiblicalVerse,
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
} from "./db.ts";
import { storagePut } from "./storage.ts";
import { nanoid } from "nanoid";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Accès réservé aux administrateurs",
    });
  }
  return next({ ctx });
});

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
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { ENV } = await import("./_core/env");
        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Mot de passe incorrect",
          });
        }

        const openId = "admin-local";
        const { upsertUser } = await import("./db");
        await upsertUser({
          openId,
          name: "Administrateur",
          role: "admin",
          lastSignedIn: new Date(),
        });

        const { sdk } = await import("./_core/sdk");
        const sessionToken = await sdk.createSessionToken(openId, {
          name: "Administrateur",
        });

        const { getSessionCookieOptions } = await import("./_core/cookies");
        const { ONE_YEAR_MS, COOKIE_NAME } = await import("../shared/const.js");
        const cookieOptions = getSessionCookieOptions(ctx.req);

        ctx.res.cookie(COOKIE_NAME, sessionToken, {
          ...cookieOptions,
          maxAge: ONE_YEAR_MS,
        });

        return { success: true };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  articles: router({
    // Public: list published articles
    list: publicProcedure
      .input(
        z
          .object({
            limit: z.number().min(1).max(50).default(12),
            offset: z.number().min(0).default(0),
            category: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ input }) => {
        const { limit = 12, offset = 0, category } = input ?? {};
        const [items, total] = await Promise.all([
          listPublishedArticles(limit, offset, category),
          countPublishedArticles(category),
        ]);
        return { items, total, limit, offset };
      }),

    // Public: get single article by slug
    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
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

    // Public: get single article by id
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
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

    // Admin: list all articles (including drafts)
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

    // Admin: create article
    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(1).max(500),
          excerpt: z.string().max(1000).optional(),
          content: z.string().min(1),
          coverImageUrl: z.string().optional(),
          coverImageKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
          category: z.string().max(100).default("actualité"),
          published: z.boolean().default(false),
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

    // Admin: update article
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().min(1).max(500).optional(),
          excerpt: z.string().max(1000).optional(),
          content: z.string().min(1).optional(),
          coverImageUrl: z.string().nullable().optional(),
          coverImageKey: z.string().nullable().optional(),
          youtubeUrl: z.string().nullable().optional(),
          category: z.string().max(100).optional(),
          published: z.boolean().optional(),
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

    // Admin: delete article
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteArticle(input.id);
      }),

    // Admin: upload image
    uploadImage: adminProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `articles/${ctx.user.id}/${nanoid(12)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),

  notifications: router({
    // User: get own notifications with read status
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

    // User: get unread count only (lightweight polling)
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      return countUnreadNotifications(ctx.user.id);
    }),

    // User: mark one notification as read
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return markNotificationAsRead(input.notificationId, ctx.user.id);
      }),

    // User: mark all notifications as read
    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      return markAllNotificationsAsRead(ctx.user.id);
    }),

    // Admin: list all notifications
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

    // Admin: create notification
    create: adminProcedure
      .input(
        z.object({
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

    // Admin: delete notification
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteNotification(input.id);
      }),
  }),

  gallery: router({
    // Public: get featured gallery items (Publication du jour)
    featured: publicProcedure.query(async () => {
      return getFeaturedGalleryItems();
    }),

    // Public: get all gallery items with pagination
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
        const items = await getAllGalleryItems(limit, offset);
        return { items };
      }),

    // Admin: create gallery item
    create: adminProcedure
      .input(
        z.object({
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

    // Admin: delete gallery item
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteGalleryItem(input.id);
      }),

    // Admin: upload image
    uploadImage: adminProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const fileKey = `gallery/${Date.now()}-${nanoid()}.${input.filename.split(".").pop()}`;
        const { url, key } = await storagePut(
          fileKey,
          buffer,
          input.contentType
        );
        return { url, key };
      }),
  }),

  verses: router({
    // Public: get latest verse
    latest: publicProcedure.query(async () => {
      const items = await getLatestBiblicalVerse();
      return items;
    }),

    // Admin: create biblical verse
    create: adminProcedure
      .input(
        z.object({
          reference: z.string().min(1).max(100),
          text: z.string().min(1),
          summary: z.string().min(1),
        })
      )
      .mutation(async ({ input }) => {
        return createBiblicalVerse(input);
      }),

    // Public: get verse by ID
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getBiblicalVerseById(input.id);
      }),

    // Admin: list all verses
    adminList: adminProcedure.query(async () => {
      const items = await listBiblicalVerses();
      return { items };
    }),

    // Admin: delete verse
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBiblicalVerse(input.id);
      }),
  }),

  pageContent: router({
    // Public: get page content
    byPage: publicProcedure
      .input(z.object({ pageId: z.string() }))
      .query(async ({ input }) => {
        return getPageContent(input.pageId);
      }),

    // Admin: list all page content for a page
    adminList: adminProcedure
      .input(
        z.object({
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

    // Admin: create page content
    create: adminProcedure
      .input(
        z.object({
          pageId: z.string(),
          contentType: z.enum(["image", "youtube_video", "mp4_video"]),
          title: z.string().min(1).max(300),
          mediaUrl: z.string().min(1),
          mediaKey: z.string().optional(),
          youtubeUrl: z.string().optional(),
          displayOrder: z.number().default(0),
          visible: z.boolean().default(true),
          loop: z.boolean().optional().default(false),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createPageContent({
          ...input,
          authorId: ctx.user.id,
        });
      }),

    // Admin: update page content
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          mediaUrl: z.string().optional(),
          youtubeUrl: z.string().optional(),
          displayOrder: z.number().optional(),
          visible: z.boolean().optional(),
          loop: z.boolean().optional(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePageContent(id, data);
      }),

    // Admin: delete page content
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePageContent(input.id);
      }),

    // Admin: upload media
    uploadMedia: adminProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const fileKey = `page-content/${Date.now()}-${nanoid()}.${input.filename.split(".").pop()}`;
        const { url, key } = await storagePut(
          fileKey,
          buffer,
          input.contentType
        );
        return { url, key };
      }),
  }),
  ai: router({
    chat: adminProcedure
      .input(
        z.object({
          messages: z.array(
            z.object({
              role: z.enum(["system", "user", "assistant"]),
              content: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
        const response = await invokeLLM({
          messages: input.messages as any,
        });
        return response.choices[0].message.content as string;
      }),

    generateDescription: adminProcedure
      .input(
        z.object({
          title: z.string(),
          contentType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import("./_core/llm");
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
        const { invokeLLM } = await import("./_core/llm");

        let prompt =
          "Génère un verset biblique inspirant (qui n'est pas déjà trop connu si possible). ";
        if (input?.reference) {
          prompt = `Génère le texte et un résumé inspirant pour le verset biblique suivant : ${input.reference}. `;
        } else if (input?.topic) {
          prompt += `Le thème doit être : ${input.topic}. `;
        }

        prompt += `Ton format de réponse DOIT ÊTRE UNIQUEMENT un objet JSON valide avec la structure suivante :
        {
          "reference": "Livre Chapitre:Verset",
          "text": "Le texte du verset...",
          "summary": "Un résumé court (2-3 phrases) et spirituellement inspirant de ce verset."
        }
        Ne rajoute AUCUN texte avant ou après le JSON.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "Tu es un érudit biblique et assistant éditorial. Tu réponds strictement en JSON.",
            },
            { role: "user", content: prompt },
          ],
        });

        const content = response.choices[0].message.content as string;
        try {
          // Clean up potential markdown wrapper from the response
          const jsonStr = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          return JSON.parse(jsonStr) as {
            reference: string;
            text: string;
            summary: string;
          };
        } catch (e) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Groq a renvoyé un format invalide. Réessayez.",
            cause: e,
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
