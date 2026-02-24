import { getDb } from "../../db";
import {
  userProfiles,
  userActivities,
  categoryInterests,
} from "../../../drizzle/personalization.schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

export class ProfileManager {
  async getOrCreateProfile(userId: number) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length > 0) {
      return profile[0];
    }

    const newProfile = {
      id: nanoid(),
      userId,
      preferences: JSON.stringify({
        themes: [],
        categories: [],
        languages: ["fr"],
      }),
    };

    await db.insert(userProfiles).values(newProfile);
    return newProfile;
  }

  async updatePreferences(userId: number, preferences: Record<string, any>) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    const profile = await this.getOrCreateProfile(userId);

    await db
      .update(userProfiles)
      .set({
        preferences: JSON.stringify(preferences),
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, profile.id));

    return {
      ...profile,
      preferences: JSON.stringify(preferences),
    };
  }

  async getPreferences(userId: number) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    const profile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    if (profile.length === 0) {
      return {
        themes: [],
        categories: [],
        languages: ["fr"],
      };
    }

    return JSON.parse(profile[0].preferences);
  }
}

export class ActivityTracker {
  async trackActivity(
    userId: number,
    articleId: number,
    action: string,
    durationMs?: number,
    metadata?: Record<string, any>
  ) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    const activity = {
      id: nanoid(),
      userId,
      articleId,
      action,
      durationMs: durationMs || 0,
      metadata: JSON.stringify(metadata || {}),
    };

    await db.insert(userActivities).values(activity);

    // Update category interests if reading
    if (action === "read") {
      await this.updateCategoryScore(userId, articleId, 10);
    }
    // Update category interests if clicking
    else if (action === "click") {
      await this.updateCategoryScore(userId, articleId, 2);
    }

    return activity;
  }

  private async updateCategoryScore(
    userId: number,
    articleId: number,
    scoreIncrease: number
  ) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    // This would normally fetch article category from articles table
    // For now, we'll just track the score
    const category = "news"; // Default category

    const existingInterest = await db
      .select()
      .from(categoryInterests)
      .where(
        and(
          eq(categoryInterests.userId, userId),
          eq(categoryInterests.category, category)
        )
      )
      .limit(1);

    if (existingInterest.length > 0) {
      const current = existingInterest[0];
      await db
        .update(categoryInterests)
        .set({
          score: Math.min(100, (current.score || 0) + scoreIncrease),
          viewCount: (current.viewCount || 0) + 1,
          lastUpdated: new Date(),
        })
        .where(eq(categoryInterests.id, current.id));
    } else {
      await db.insert(categoryInterests).values({
        id: nanoid(),
        userId,
        category,
        score: scoreIncrease,
        viewCount: 1,
      });
    }
  }

  async getUserActivities(userId: number, limit: number = 100) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    return await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy((col) => col.timestamp)
      .limit(limit);
  }

  async getCategoryScores(userId: number) {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });
    
    return await db
      .select()
      .from(categoryInterests)
      .where(eq(categoryInterests.userId, userId));
  }
}

export const profileManager = new ProfileManager();
export const activityTracker = new ActivityTracker();
