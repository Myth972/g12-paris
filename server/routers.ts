import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
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
  listGalleries,
  createGalleryItem,
  deleteGalleryItem,
  listPublications,
  createPublicationItem,
  deletePublicationItem,
  listPages,
  getPageBySlug,
  upsertPage,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { invokeLLM, Role } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";



function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 200) + "-" + nanoid(6);
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
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
        z.object({
          limit: z.number().min(1).max(50).default(12),
          offset: z.number().min(0).default(0),
          category: z.string().optional(),
        }).optional()
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
          throw new TRPCError({ code: "NOT_FOUND", message: "Article introuvable" });
        }
        return article;
      }),

    // Public: get single article by id
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await getArticleById(input.id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article introuvable" });
        }
        return article;
      }),

    // Admin: list all articles (including drafts)
    adminList: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        }).optional()
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
          weight: z.number().default(0),
          config: z.string().optional(),
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
          weight: z.number().optional(),
          config: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const existing = await getArticleById(id);
        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article introuvable" });
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
        z.object({
          limit: z.number().min(1).max(50).default(20),
        }).optional()
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
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        }).optional()
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
          type: z.enum(["info", "alerte", "nouveauté", "important"]).default("info"),
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

  galleries: router({
    list: publicProcedure.query(async () => {
      return listGalleries();
    }),
    create: adminProcedure
      .input(z.object({ src: z.string(), alt: z.string().optional(), weight: z.number().default(0) }))
      .mutation(async ({ input }) => {
        return createGalleryItem(input);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteGalleryItem(input.id);
      }),
  }),

  publications: router({
    list: publicProcedure.query(async () => {
      return listPublications();
    }),
    create: adminProcedure
      .input(z.object({
        type: z.string(),
        content: z.string(),
        title: z.string().optional(),
        weight: z.number().default(0)
      }))
      .mutation(async ({ input }) => {
        return createPublicationItem(input);
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePublicationItem(input.id);
      }),
  }),

  ai: router({
    generateText: adminProcedure
      .input(z.object({
        prompt: z.string(),
        context: z.string().optional(),
        type: z.enum(["summary", "title", "correction", "content"]),
      }))
      .mutation(async ({ input }) => {
        let systemPrompt = "Tu es un assistant éditorial expert pour un site d'actualités.";

        switch (input.type) {
          case "summary":
            systemPrompt += " Ton but est de générer un résumé captivant et professionnel (chapô) de l'article. Le ton doit être journalistique, informatif mais engageant. Limite-toi à 2-3 phrases maximum.";
            break;
          case "title":
            systemPrompt += " Ton but est de suggérer 5 titres percutants et variés (informatif, intrigant, narratif, etc.) qui donneront envie de cliquer. Évite le sensationnalisme excessif.";
            break;
          case "correction":
            systemPrompt += " Ton but est d'agir comme un correcteur professionnel. Améliore la fluidité, corrige toutes les fautes, et assure un niveau de langue soutenu mais accessible. Conserve la voix de l'auteur.";
            break;
          case "content":
            systemPrompt += " Ton but est de rédiger un contenu riche, structuré avec des paragraphes clairs, et informatif. Utilise un ton bienveillant et professionnel adapté à un média d'inspiration chrétienne.";
            break;
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.prompt }
          ],
          max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content;
        if (typeof content === "string") return content;
        return "Erreur de génération";
      }),

    generateImage: adminProcedure
      .input(z.object({ prompt: z.string() }))
      .mutation(async ({ input }) => {
        const { url } = await generateImage({ prompt: input.prompt });
        const key = url?.split("storage/")[1] ?? "";
        return { url, key };
      }),
  }),

  pages: router({
    list: adminProcedure.query(async () => {
      return listPages();
    }),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getPageBySlug(input.slug);
      }),
    upsert: adminProcedure
      .input(
        z.object({
          slug: z.string(),
          title: z.string(),
          description: z.string().optional(),
          config: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return upsertPage(input);
      }),
  }),

  media: router({
    upload: adminProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          contentType: z.string(),
          prefix: z.string().default("media"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "jpg";
        const key = `${input.prefix}/${ctx.user.id}/${nanoid(12)}.${ext}`;
        const { url } = await storagePut(key, buffer, input.contentType);
        return { url, key };
      }),
  }),
});

export type AppRouter = typeof appRouter;
