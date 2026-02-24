import { getDb } from "../../db";
import {
  userLayouts,
  layoutTemplates,
  layoutChanges,
} from "../../../drizzle/personalization.schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export interface LayoutSection {
  id: string;
  type:
    | "hero"
    | "articles"
    | "categories"
    | "trending"
    | "featured"
    | "custom";
  position: { row: number; col: number };
  size: { width: number; height: number };
  settings: Record<string, any>;
}

export interface LayoutConfig {
  sections: LayoutSection[];
  responsive?: {
    mobile?: { sections: LayoutSection[] };
    tablet?: { sections: LayoutSection[] };
  };
  theme?: {
    columns?: number;
    gap?: string;
    displayMode?: "cards" | "list" | "minimal";
  };
}

export class LayoutManager {
  async createLayout(
    userId: number,
    layoutName: string,
    layoutType: string,
    config: LayoutConfig
  ) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const layout = {
      id: nanoid(),
      userId,
      layoutName,
      layoutType,
      config: JSON.stringify(config),
      isActive: false,
      isDefault: false,
    };

    await db.insert(userLayouts).values(layout);

    // Track change
    await this.trackChange(
      userId,
      layout.id,
      "created",
      JSON.stringify({ layoutType, layoutName })
    );

    return layout;
  }

  async updateLayout(
    layoutId: string,
    config: LayoutConfig,
    layoutName?: string
  ) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const layout = await db
      .select()
      .from(userLayouts)
      .where(eq(userLayouts.id, layoutId))
      .limit(1);

    if (layout.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Layout not found"
      });
    }

    const oldConfig = JSON.parse(layout[0].config);

    await db
      .update(userLayouts)
      .set({
        config: JSON.stringify(config),
        layoutName: layoutName || layout[0].layoutName,
        updatedAt: new Date(),
      })
      .where(eq(userLayouts.id, layoutId));

    // Track change
    await this.trackChange(layout[0].userId, layoutId, "updated", {
      oldConfig,
      newConfig: config,
    });

    return layout[0];
  }

  async setActiveLayout(userId: number, layoutId: string) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    // Deactivate all other layouts
    await db
      .update(userLayouts)
      .set({ isActive: false })
      .where(eq(userLayouts.userId, userId));

    // Activate this one
    await db
      .update(userLayouts)
      .set({ isActive: true })
      .where(
        and(
          eq(userLayouts.id, layoutId),
          eq(userLayouts.userId, userId)
        )
      );
  }

  async setDefaultLayout(userId: number, layoutId: string) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    // Remove default from all other layouts
    await db
      .update(userLayouts)
      .set({ isDefault: false })
      .where(eq(userLayouts.userId, userId));

    // Set this as default
    await db
      .update(userLayouts)
      .set({ isDefault: true })
      .where(
        and(
          eq(userLayouts.id, layoutId),
          eq(userLayouts.userId, userId)
        )
      );
  }

  async getLayout(layoutId: string) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const layout = await db
      .select()
      .from(userLayouts)
      .where(eq(userLayouts.id, layoutId))
      .limit(1);

    if (layout.length === 0) {
      return null;
    }

    return {
      ...layout[0],
      config: JSON.parse(layout[0].config),
    };
  }

  async getUserLayouts(userId: number) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const layouts = await db
      .select()
      .from(userLayouts)
      .where(eq(userLayouts.userId, userId));

    return layouts.map((layout) => ({
      ...layout,
      config: JSON.parse(layout.config),
    }));
  }

  async getActiveLayout(userId: number) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const layouts = await db
      .select()
      .from(userLayouts)
      .where(
        and(
          eq(userLayouts.userId, userId),
          eq(userLayouts.isActive, true)
        )
      )
      .limit(1);

    if (layouts.length === 0) {
      return null;
    }

    return {
      ...layouts[0],
      config: JSON.parse(layouts[0].config),
    };
  }

  async deleteLayout(layoutId: string, userId: number) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const layout = await db
      .select()
      .from(userLayouts)
      .where(eq(userLayouts.id, layoutId))
      .limit(1);

    if (layout.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Layout not found"
      });
    }

    // Cannot delete if active or default
    if (layout[0].isActive || layout[0].isDefault) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Cannot delete active or default layout"
      });
    }

    await db
      .delete(userLayouts)
      .where(eq(userLayouts.id, layoutId));

    // Track change
    await this.trackChange(userId, layoutId, "deleted", {});
  }

  private async trackChange(
    userId: number,
    layoutId: string,
    changeType: string,
    changes: any
  ) {
    const db = await getDb();
    if (!db) return;

    await db.insert(layoutChanges).values({
      id: nanoid(),
      userId,
      layoutId,
      changeType,
      changes: JSON.stringify(changes),
    });
  }
}

export class LayoutTemplateManager {
  async getTemplates() {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    return await db
      .select()
      .from(layoutTemplates)
      .where(eq(layoutTemplates.isFeatured, true));
  }

  async getTemplate(templateId: string) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const template = await db
      .select()
      .from(layoutTemplates)
      .where(eq(layoutTemplates.id, templateId))
      .limit(1);

    if (template.length === 0) {
      return null;
    }

    return {
      ...template[0],
      config: JSON.parse(template[0].config),
    };
  }

  async createTemplateFromLayout(
    layoutName: string,
    layoutType: string,
    config: LayoutConfig,
    description?: string,
    previewImage?: string
  ) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    const template = {
      id: nanoid(),
      name: layoutName,
      description: description || "",
      layoutType,
      config: JSON.stringify(config),
      previewImage: previewImage || null,
      isFeatured: false,
    };

    await db.insert(layoutTemplates).values(template);
    return template;
  }
}

export const layoutManager = new LayoutManager();
export const layoutTemplateManager = new LayoutTemplateManager();
