import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getHealthStatus } from "./health";
import { driversRouter } from "./routers/drivers";
import { vehiclesRouter } from "./routers/vehicles";
import { erpRouter } from "./routers/erp";
import { routesRouter } from "./routers/routes";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  health: router({
    check: publicProcedure.query(async () => {
      return await getHealthStatus();
    }),
  }),

  // Routers de funcionalidades
  drivers: driversRouter,
  vehicles: vehiclesRouter,
  erp: erpRouter,
  routes: routesRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;

// Tipos para uso no frontend
export type DriversRouter = typeof driversRouter;
export type VehiclesRouter = typeof vehiclesRouter;
export type ErpRouter = typeof erpRouter;
export type RoutesRouter = typeof routesRouter;
export type DashboardRouter = typeof dashboardRouter;
