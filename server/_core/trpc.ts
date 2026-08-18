import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context.js";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const ROLES = {
  ADMIN: "admin",
  EDITEUR: "editeur",
  BIBLIOTHEQUE: "bibliotheque",
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const createRoleProcedure = (allowedRoles: string[]) =>
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Accès réservé aux rôles: ${allowedRoles.join(", ")}`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  });

export const adminProcedure = t.procedure.use(
  createRoleProcedure([ROLES.ADMIN, ROLES.EDITEUR, ROLES.BIBLIOTHEQUE])
);
export const adminOnlyProcedure = t.procedure.use(
  createRoleProcedure([ROLES.ADMIN])
);
export const editeurProcedure = t.procedure.use(
  createRoleProcedure([ROLES.ADMIN, ROLES.EDITEUR])
);
export const bibliothequeProcedure = t.procedure.use(
  createRoleProcedure([ROLES.ADMIN, ROLES.BIBLIOTHEQUE])
);
