/**
 * Router de Dashboard
 * Estatísticas e resumos do sistema
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { drivers, vehicles, routes, deliveries } from '../../drizzle/schema';
import { eq, count } from 'drizzle-orm';
import { logger } from '../logger';
import { TRPCError } from '@trpc/server';

export const dashboardRouter = router({
  /**
   * Obter resumo geral do sistema
   */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      logger.info('Dashboard', 'Obtendo resumo geral');

      const db = getDb('logistica');
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      // Contar motoristas ativos
      const driversCount = await db
        .select({ count: count() })
        .from(drivers)
        .where(eq(drivers.ativo, true));

      // Contar veículos ativos
      const vehiclesCount = await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.ativo, true));

      // Contar rotas
      const routesCount = await db.select({ count: count() }).from(routes);

      // Contar entregas
      const deliveriesCount = await db.select({ count: count() }).from(deliveries);

      // Contar entregas pendentes
      const pendingDeliveries = await db
        .select({ count: count() })
        .from(deliveries)
        .where(eq(deliveries.status, 'pendente'));

      // Contar entregas concluídas
      const completedDeliveries = await db
        .select({ count: count() })
        .from(deliveries)
        .where(eq(deliveries.status, 'entregue'));

      logger.info('Dashboard', 'Resumo obtido com sucesso');

      return {
        success: true,
        message: 'Resumo obtido com sucesso',
        data: {
          motoristas: driversCount[0].count,
          veiculos: vehiclesCount[0].count,
          rotas: routesCount[0].count,
          entregas: deliveriesCount[0].count,
          entregasPendentes: pendingDeliveries[0].count,
          entregasConcluidas: completedDeliveries[0].count,
        },
      };
    } catch (error: any) {
      logger.error('Dashboard', 'Erro ao obter resumo', error);

      if (error instanceof TRPCError) {
        throw error;
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao obter resumo do dashboard',
      });
    }
  }),

  /**
   * Obter estatísticas de motoristas
   */
  getDriversStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      logger.info('Dashboard', 'Obtendo estatísticas de motoristas');

      const db = getDb('logistica');
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      // Total de motoristas
      const totalDrivers = await db
        .select({ count: count() })
        .from(drivers);

      // Motoristas ativos
      const activeDrivers = await db
        .select({ count: count() })
        .from(drivers)
        .where(eq(drivers.ativo, true));

      // Motoristas inativos
      const inactiveDrivers = await db
        .select({ count: count() })
        .from(drivers)
        .where(eq(drivers.ativo, false));

      return {
        success: true,
        message: 'Estatísticas de motoristas obtidas',
        data: {
          total: totalDrivers[0].count,
          ativos: activeDrivers[0].count,
          inativos: inactiveDrivers[0].count,
        },
      };
    } catch (error: any) {
      logger.error('Dashboard', 'Erro ao obter estatísticas de motoristas', error);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao obter estatísticas de motoristas',
      });
    }
  }),

  /**
   * Obter estatísticas de veículos
   */
  getVehiclesStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      logger.info('Dashboard', 'Obtendo estatísticas de veículos');

      const db = getDb('logistica');
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      // Total de veículos
      const totalVehicles = await db
        .select({ count: count() })
        .from(vehicles);

      // Veículos ativos
      const activeVehicles = await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.ativo, true));

      // Veículos inativos
      const inactiveVehicles = await db
        .select({ count: count() })
        .from(vehicles)
        .where(eq(vehicles.ativo, false));

      return {
        success: true,
        message: 'Estatísticas de veículos obtidas',
        data: {
          total: totalVehicles[0].count,
          ativos: activeVehicles[0].count,
          inativos: inactiveVehicles[0].count,
        },
      };
    } catch (error: any) {
      logger.error('Dashboard', 'Erro ao obter estatísticas de veículos', error);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao obter estatísticas de veículos',
      });
    }
  }),

  /**
   * Obter estatísticas de rotas
   */
  getRoutesStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      logger.info('Dashboard', 'Obtendo estatísticas de rotas');

      const db = getDb('logistica');
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      // Total de rotas
      const totalRoutes = await db.select({ count: count() }).from(routes);

      // Rotas planejadas
      const plannedRoutes = await db
        .select({ count: count() })
        .from(routes)
        .where(eq(routes.status, 'planejada'));

      // Rotas em rota
      const inRouteRoutes = await db
        .select({ count: count() })
        .from(routes)
        .where(eq(routes.status, 'em_rota'));

      // Rotas concluídas
      const completedRoutes = await db
        .select({ count: count() })
        .from(routes)
        .where(eq(routes.status, 'concluida'));

      return {
        success: true,
        message: 'Estatísticas de rotas obtidas',
        data: {
          total: totalRoutes[0].count,
          planejadas: plannedRoutes[0].count,
          emRota: inRouteRoutes[0].count,
          concluidas: completedRoutes[0].count,
        },
      };
    } catch (error: any) {
      logger.error('Dashboard', 'Erro ao obter estatísticas de rotas', error);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao obter estatísticas de rotas',
      });
    }
  }),

  /**
   * Obter estatísticas de entregas
   */
  getDeliveriesStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      logger.info('Dashboard', 'Obtendo estatísticas de entregas');

      const db = getDb('logistica');
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      // Total de entregas
      const totalDeliveries = await db.select({ count: count() }).from(deliveries);

      // Entregas pendentes
      const pendingDeliveries = await db
        .select({ count: count() })
        .from(deliveries)
        .where(eq(deliveries.status, 'pendente'));

      // Entregas em rota
      const inRouteDeliveries = await db
        .select({ count: count() })
        .from(deliveries)
        .where(eq(deliveries.status, 'em_rota'));

      // Entregas concluídas
      const completedDeliveries = await db
        .select({ count: count() })
        .from(deliveries)
        .where(eq(deliveries.status, 'entregue'));

      // Entregas não realizadas
      const failedDeliveries = await db
        .select({ count: count() })
        .from(deliveries)
        .where(eq(deliveries.status, 'nao_entregue'));

      // Taxa de sucesso
      const successRate =
        totalDeliveries[0].count > 0
          ? ((completedDeliveries[0].count / totalDeliveries[0].count) * 100).toFixed(2)
          : 0;

      return {
        success: true,
        message: 'Estatísticas de entregas obtidas',
        data: {
          total: totalDeliveries[0].count,
          pendentes: pendingDeliveries[0].count,
          emRota: inRouteDeliveries[0].count,
          concluidas: completedDeliveries[0].count,
          naoRealizadas: failedDeliveries[0].count,
          taxaSucesso: parseFloat(successRate as string),
        },
      };
    } catch (error: any) {
      logger.error('Dashboard', 'Erro ao obter estatísticas de entregas', error);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao obter estatísticas de entregas',
      });
    }
  }),
});
