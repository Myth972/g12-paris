import { t, protectedProcedure } from "../_core/trpc.js";
import { z } from "zod";
import { getDb } from "./db.js";
import { userTheme } from "../drizzle/schema.js";

export const themeRouter = t.router({
  /** Get the stored theme for the authenticated user */
  getUserTheme: protectedProcedure
    .output(z.object({ theme: z.string() }))
    .query(async ({ ctx }) => {
      const db = await getDb();
      const rows = await db.select().from(userTheme).where({ userId: ctx.session.userId }).limit(1);
      if (rows.length === 0) return { theme: "light" };
      return { theme: rows[0].theme };
    }),

  /** Set or update the theme for the authenticated user */
  setUserTheme: protectedProcedure
    .input(z.object({ theme: z.enum(["light", "dark"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      // Upsert logic: try insert, on conflict update
      await db
        .insert(userTheme)
        .values({ userId: ctx.session.userId, theme: input.theme })
        .onConflictDoUpdate({
          target: userTheme.userId,
          set: { theme: input.theme, updatedAt: new Date() },
        });
      return { success: true };
    }),
});
