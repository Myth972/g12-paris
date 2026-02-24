import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  profileManager,
  activityTracker,
} from "./_core/personalization/profile-manager";
import { scoreCalculator } from "./_core/personalization/score-calculator";
import { layoutManager, layoutTemplateManager } from "./_core/personalization/layout-manager";
import { LAYOUT_PRESETS } from "./_core/personalization/layout-presets";

const LayoutConfigSchema = z.object({
  sections: z.array(
    z.object({
      id: z.string(),
      type: z.enum(["hero", "articles", "categories", "trending", "featured", "custom"]),
      position: z.object({ row: z.number(), col: z.number() }),
      size: z.object({ width: z.number(), height: z.number() }),
      settings: z.record(z.string(), z.any()),
    })
  ),
  responsive: z.optional(z.any()),
  theme: z.optional(z.any()),
});

export const personalizationRouter = router({
  // Profile endpoints
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated"
    });
    
    const profile = await profileManager.getOrCreateProfile(userId);
    const preferences = await profileManager.getPreferences(userId);
    const categoryScores = await activityTracker.getCategoryScores(userId);

    return {
      profile,
      preferences,
      categoryScores,
    };
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        themes: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        languages: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      const updated = await profileManager.updatePreferences(userId, input);
      return updated;
    }),

  // Activity tracking
  trackActivity: protectedProcedure
    .input(
      z.object({
        articleId: z.number(),
        action: z.enum(["view", "read", "click", "share", "scroll"]),
        durationMs: z.number().optional(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      const activity = await activityTracker.trackActivity(
        userId,
        input.articleId,
        input.action,
        input.durationMs,
        input.metadata
      );
      return activity;
    }),

  // Recommendations
  getRecommendations: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      const limit = input?.limit || 20;
      const recommendations = await scoreCalculator.calculateRecommendations(
        userId,
        limit
      );
      return recommendations;
    }),

  // Layout management
  getLayouts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated"
    });
    return await layoutManager.getUserLayouts(userId);
  }),

  getActiveLayout: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user?.id;
    if (!userId) throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not authenticated"
    });
    
    const layout = await layoutManager.getActiveLayout(userId);
    if (!layout) {
      // Return default grid layout if none active
      return LAYOUT_PRESETS.grid;
    }
    return layout;
  }),

  createLayout: protectedProcedure
    .input(
      z.object({
        layoutName: z.string(),
        layoutType: z.string(),
        config: LayoutConfigSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      return await layoutManager.createLayout(
        userId,
        input.layoutName,
        input.layoutType,
        input.config
      );
    }),

  updateLayout: protectedProcedure
    .input(
      z.object({
        layoutId: z.string(),
        config: LayoutConfigSchema,
        layoutName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await layoutManager.updateLayout(
        input.layoutId,
        input.config,
        input.layoutName
      );
    }),

  setActiveLayout: protectedProcedure
    .input(z.object({ layoutId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      await layoutManager.setActiveLayout(userId, input.layoutId);
      return { success: true };
    }),

  deleteLayout: protectedProcedure
    .input(z.object({ layoutId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      await layoutManager.deleteLayout(input.layoutId, userId);
      return { success: true };
    }),

  // Layout templates
  getLayoutTemplates: publicProcedure.query(async () => {
    return Object.values(LAYOUT_PRESETS);
  }),

  getLayoutTemplate: publicProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ input }) => {
      const template = LAYOUT_PRESETS[input.templateId as keyof typeof LAYOUT_PRESETS];
      return template || null;
    }),

  applyTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        layoutName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "User not authenticated"
      });
      
      const template = LAYOUT_PRESETS[input.templateId as keyof typeof LAYOUT_PRESETS];
      if (!template) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Template not found"
        });
      }

      const layout = await layoutManager.createLayout(
        userId,
        input.layoutName || template.name,
        template.layoutType,
        template.config
      );

      return layout;
    }),
});

export default personalizationRouter;
