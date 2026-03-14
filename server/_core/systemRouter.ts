import { publicProcedure, router } from "./trpc.ts";

export const systemRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
  })),
});
