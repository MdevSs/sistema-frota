import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// MVP Mode: Desativar proteção de autenticação para testes
// Em produção, reativar este middleware
const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  // MVP: Permitir acesso sem autenticação
  // if (!ctx.user) {
  //   throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  // }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user || { id: 'mvp-user', name: 'MVP User', role: 'user', email: 'mvp@test.local' },
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

// MVP Mode: Permitir acesso admin para testes
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    // MVP: Permitir acesso admin sem verificação
    // if (!ctx.user || ctx.user.role !== 'admin') {
    //   throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    // }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user || { id: 'mvp-user', name: 'MVP User', role: 'admin', email: 'mvp@test.local' },
      },
    });
  }),
);
