import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
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
  getFeaturedHomeContent,
} from "./db.js";
import { storagePut } from "./storage.js";
import { nanoid } from "nanoid";

const zod = {
  object: <T extends z.ZodRawShape>(shape: T) => z.object(shape).strict(),
};

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
      .input(zod.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { ENV } = await import("./_core/env.js");
        if (input.password !== ENV.adminPassword) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Mot de passe incorrect",
          });
        }

        const openId = "admin-local";
        const { upsertUser } = await import("./db.js");
        await upsertUser({
          openId,
          name: "Administrateur",
          role: "admin",
          lastSignedIn: new Date(),
        });

        const { sdk } = await import("./_core/sdk.js");
        const sessionToken = await sdk.createSessionToken(openId, {
          name: "Administrateur",
        });

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
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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

    // Public: get single article by id
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
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteArticle(input.id);
      }),

    // Admin: upload image
    uploadImage: adminProcedure
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
      .input(zod.object({ notificationId: z.number() }))
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

    // Admin: delete notification
    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
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

    // Admin: delete gallery item
    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteGalleryItem(input.id);
      }),

    // Admin: upload image
    uploadImage: adminProcedure
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
        zod.object({
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
      .input(zod.object({ id: z.number() }))
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
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deleteBiblicalVerse(input.id);
      }),
  }),

  pageContent: router({
    // Public: get page content
    byPage: publicProcedure
      .input(zod.object({ pageId: z.string() }))
      .query(async ({ input }) => {
        return getPageContent(input.pageId);
      }),

    // Public: get featured home content
    featuredHome: publicProcedure.query(async () => {
      return getFeaturedHomeContent();
    }),

    // Admin: list all page content for a page
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

    // Admin: create page content
    create: adminProcedure
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
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return updatePageContent(id, data);
      }),

    // Admin: delete page content
    delete: adminProcedure
      .input(zod.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return deletePageContent(input.id);
      }),

    // Admin: upload media
    uploadMedia: adminProcedure
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
        const { url, key } = await storagePut(
          fileKey,
          buffer,
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
          provider: "minimax", // Forcément MiniMax pour une meilleure compréhension spirituelle et contextuelle
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
    testProvider: adminProcedure
      .input(
        z
          .object({
            provider: z.enum(["google", "groq"]).optional(),
          })
          .optional()
      )
      .mutation(async ({ input }) => {
        let provider = input?.provider;
        if (!provider) {
          const { getDb } = await import("./db.js");
          const db = await getDb();
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
        }

        const { invokeLLM } = await import("./_core/llm.js");
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "Tu réponds uniquement par le mot OK.",
            },
            { role: "user", content: "Réponds OK." },
          ],
          provider,
        });

        return {
          ok: true,
          provider: provider || "default",
          model: response.model,
          content: response.choices[0].message.content,
        };
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
              model: "kling-ai/kling-v1-5-pro",
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
              model: "kling-video/v1.6/pro/text-to-video",
              prompt: input.prompt,
              negative_prompt: input.negativePrompt || "",
              duration: input.duration,
              aspect_ratio: input.aspectRatio,
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

    sendDigest: adminProcedure.mutation(async () => {
      const { getDb } = await import("./db.js");
      const { subscribers, articles } = await import("../drizzle/schema.js");
      const { desc, eq } = await import("drizzle-orm");
      const db = await getDb();

      const allSubscribers = await db.select().from(subscribers);
      if (allSubscribers.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Aucun abonné à contacter.",
        });
      }

      const latestArticles = await db
        .select()
        .from(articles)
        .where(eq(articles.published, true))
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
      await sendWeeklyDigest(emails, latestArticles as any);

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
});

export type AppRouter = typeof appRouter;
