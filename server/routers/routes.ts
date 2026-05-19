/**
 * Router de Rotas e Entregas
 * Gerenciar criação, atualização e consulta de rotas
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { routes, deliveries, drivers, vehicles } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../logger';
import { TRPCError } from '@trpc/server';

// Schema de validação
const createRouteSchema = z.object({
  motoristaId: z.number().positive('Motorista é obrigatório'),
  veiculoId: z.number().positive('Veículo é obrigatório'),
  dataRota: z.date('Data da rota é obrigatória'),
  pedidos: z.array(
    z.object({
      numeroPedido: z.number(),
      nomeCliente: z.string(),
      telefone: z.string().optional(),
      rua: z.string(),
      numero: z.string(),
      bairro: z.string(),
      cidade: z.string(),
      estado: z.string().length(2),
      cep: z.string(),
      complemento: z.string().optional(),
    })
  ),
});

export const routesRouter = router({
  /**
   * Criar nova rota com múltiplos pedidos
   */
  create: protectedProcedure
    .input(createRouteSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Routes', 'Criando nova rota', {
          motoristaId: input.motoristaId,
          veiculoId: input.veiculoId,
          totalPedidos: input.pedidos.length,
        });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        // Verificar se motorista existe
        const driver = await db
          .select()
          .from(drivers)
          .where(and(eq(drivers.id, input.motoristaId), eq(drivers.ativo, true)))
          .limit(1);

        if (driver.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Motorista não encontrado ou inativo',
          });
        }

        // Verificar se veículo existe
        const vehicle = await db
          .select()
          .from(vehicles)
          .where(and(eq(vehicles.id, input.veiculoId), eq(vehicles.ativo, true)))
          .limit(1);

        if (vehicle.length === 0) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Veículo não encontrado ou inativo',
          });
        }

        // Criar rota
        const routeResult = await db
          .insert(routes)
          .values({
            dataRota: input.dataRota,
            motorista_id: input.motoristaId,
            veiculo_id: input.veiculoId,
            status: 'planejada' as const,
            ativo: true,
          })
          .returning();

        const routeId = routeResult[0].id;

        // Criar entregas
        const deliveriesData = input.pedidos.map((pedido) => ({
          rota_id: routeId,
          numero_pedido: pedido.numeroPedido.toString(),
          cliente: pedido.nomeCliente,
          telefone: pedido.telefone || null,
          endereco: pedido.rua,
          numero: pedido.numero,
          complemento: pedido.complemento || null,
          bairro: pedido.bairro,
          cidade: pedido.cidade,
          estado: pedido.estado,
          cep: pedido.cep,
          status: 'pendente' as const,
        }));

        const deliveriesResult = await db
          .insert(deliveries)
          .values(deliveriesData)
          .returning();

        logger.info('Routes', 'Rota criada com sucesso', {
          routeId,
          totalEntregas: deliveriesResult.length,
        });

        return {
          success: true,
          message: `Rota criada com ${deliveriesResult.length} entrega(s)`,
          data: {
            route: routeResult[0],
            deliveries: deliveriesResult,
          },
        };
      } catch (error: any) {
        logger.error('Routes', 'Erro ao criar rota', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao criar rota',
        });
      }
    }),

  /**
   * Listar rotas
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['planejada', 'em_rota', 'concluida', 'cancelada']).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Routes', 'Listando rotas', { status: input.status });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        let query: any = db.select().from(routes);

        if (input.status) {
          query = query.where(eq(routes.status, input.status as any));
        }

        const result = await query.orderBy(routes.dataRota);

        logger.info('Routes', 'Rotas listadas', { total: result.length });

        return {
          success: true,
          message: `${result.length} rota(s) encontrada(s)`,
          data: result,
        };
      } catch (error: any) {
        logger.error('Routes', 'Erro ao listar rotas', error);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar rotas',
        });
      }
    }),

  /**
   * Obter rota com entregas
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('Routes', 'Buscando rota', { id: input.id });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        const route = await db
          .select()
          .from(routes)
          .where(eq(routes.id, input.id))
          .limit(1);

        if (route.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Rota não encontrada',
          });
        }

        const deliveriesList = await db
          .select()
          .from(deliveries)
          .where(eq(deliveries.rota_id, input.id));

        return {
          success: true,
          message: 'Rota encontrada',
          data: {
            route: route[0],
            deliveries: deliveriesList,
          },
        };
      } catch (error: any) {
        logger.error('Routes', 'Erro ao buscar rota', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar rota',
        });
      }
    }),

  /**
   * Atualizar status da rota
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['planejada', 'em_rota', 'concluida', 'cancelada']),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Routes', 'Atualizando status da rota', { id: input.id, status: input.status });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        const result = await db
          .update(routes)
          .set({
            status: input.status as any,
            updatedAt: new Date(),
          })
          .where(eq(routes.id, input.id))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Rota não encontrada',
          });
        }

        logger.info('Routes', 'Status da rota atualizado', { id: input.id });

        return {
          success: true,
          message: 'Status atualizado com sucesso',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('Routes', 'Erro ao atualizar status', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar status',
        });
      }
    }),

  /**
   * Atualizar status de entrega
   */
  updateDeliveryStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['pendente', 'em_rota', 'entregue', 'nao_entregue', 'devolvido']),
        observacoes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Routes', 'Atualizando status de entrega', { id: input.id, status: input.status });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        const result = await db
          .update(deliveries)
          .set({
            status: input.status as any,
            observacoes: input.observacoes || null,
            updatedAt: new Date(),
          })
          .where(eq(deliveries.id, input.id))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Entrega não encontrada',
          });
        }

        logger.info('Routes', 'Status de entrega atualizado', { id: input.id });

        return {
          success: true,
          message: 'Entrega atualizada com sucesso',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('Routes', 'Erro ao atualizar entrega', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar entrega',
        });
      }
    }),
});
