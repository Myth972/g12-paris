import { getDb } from "../../db";
import { articles, userActivities } from "../../../drizzle/schema";
import { categoryInterests } from "../../../drizzle/personalization.schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

interface RecommendationScore {
  articleId: number;
  score: number;
  breakdown: {
    categoryScore: number;
    recencyScore: number;
    similarityScore: number;
    popularityScore: number;
    trendScore: number;
  };
}

export class ScoreCalculator {
  // Weights for the scoring algorithm
  private weights = {
    category: 0.3,
    recency: 0.2,
    similarity: 0.2,
    popularity: 0.15,
    trend: 0.15,
  };

  /**
   * Calculate personalized recommendations for a user
   */
  async calculateRecommendations(
    userId: number,
    limit: number = 20
  ): Promise<RecommendationScore[]> {
    const db = await getDb();
    if (!db) throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available"
    });

    // Get user's category interests
    const userInterests = await db
      .select()
      .from(categoryInterests)
      .where(eq(categoryInterests.userId, userId));

    // Get recently read articles
    const recentActivities = await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.timestamp))
      .limit(50);

    const recentArticleIds = recentActivities
      .map((a) => a.articleId)
      .filter((id) => id !== null);

    // Get published articles
    const allArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.published, true))
      .orderBy(desc(articles.createdAt))
      .limit(100);

    // Calculate scores for each article
    const scores: RecommendationScore[] = [];

    for (const article of allArticles) {
      // Skip if already read
      if (recentArticleIds.includes(article.id)) {
        continue;
      }

      const categoryScore = this.calculateCategoryScore(
        article.category,
        userInterests
      );
      const recencyScore = this.calculateRecencyScore(article.createdAt);
      const similarityScore = this.calculateSimilarityScore(
        article.id,
        recentArticleIds
      );
      const popularityScore = await this.calculatePopularityScore(article.id);
      const trendScore = await this.calculateTrendScore(article.id);

      const finalScore =
        this.weights.category * categoryScore +
        this.weights.recency * recencyScore +
        this.weights.similarity * similarityScore +
        this.weights.popularity * popularityScore +
        this.weights.trend * trendScore;

      scores.push({
        articleId: article.id,
        score: finalScore,
        breakdown: {
          categoryScore,
          recencyScore,
          similarityScore,
          popularityScore,
          trendScore,
        },
      });
    }

    // Sort by score and return top N
    return scores.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Calculate score based on user's category interests (0-100)
   */
  private calculateCategoryScore(
    category: string,
    userInterests: typeof categoryInterests.$inferSelect[]
  ): number {
    const interest = userInterests.find((i) => i.category === category);
    if (!interest) return 40; // Base score for unknown categories
    return Math.min(100, interest.score || 0);
  }

  /**
   * Calculate score based on article recency (0-100)
   */
  private calculateRecencyScore(createdAt: Date): number {
    const now = new Date();
    const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Articles within 24 hours: 100
    if (ageInHours < 24) return 100;
    // Articles within 7 days: scale down
    if (ageInHours < 7 * 24) return Math.max(60, 100 - ageInHours / 2);
    // Articles older than 7 days: lower score
    return Math.max(30, 60 - (ageInHours - 7 * 24) / 48);
  }

  /**
   * Calculate similarity based on same category (0-100)
   */
  private calculateSimilarityScore(
    articleId: number,
    recentArticleIds: (number | null)[]
  ): number {
    if (recentArticleIds.length === 0) return 50;
    // Simplified: just check if user reads similar articles frequently
    return Math.min(100, (recentArticleIds.length / 10) * 100);
  }

  /**
   * Calculate popularity based on view count (0-100)
   */
  private async calculatePopularityScore(articleId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const viewCount = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(userActivities)
      .where(
        and(
          eq(userActivities.articleId, articleId),
          eq(userActivities.action, "view")
        )
      );

    const count = viewCount[0]?.count || 0;
    // Normalize: 100 views = 100 score
    return Math.min(100, count);
  }

  /**
   * Calculate trend score based on recent views (0-100)
   */
  private async calculateTrendScore(articleId: number): Promise<number> {
    const db = await getDb();
    if (!db) return 0;

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentViews = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(userActivities)
      .where(
        and(
          eq(userActivities.articleId, articleId),
          eq(userActivities.action, "view"),
          gt(userActivities.timestamp, oneWeekAgo)
        )
      );

    const count = recentViews[0]?.count || 0;
    // Normalize: 50 views in last week = 100 score
    return Math.min(100, (count / 50) * 100);
  }
}

export const scoreCalculator = new ScoreCalculator();
