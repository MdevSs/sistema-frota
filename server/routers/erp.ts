/**
 * Router de Integração com ERP
 * Busca dados do banco ERP (somente leitura)
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { logger } from '../logger';
import { TRPCError } from '@trpc/server';
import { sql } from 'drizzle-orm';

export const erpRouter = router({
  /**
   * Buscar pedido no ERP por número
   * Retorna dados do pedido, cliente, nota e endereço
   */
  getPedido: protectedProcedure
    .input(z.object({ numeroPedido: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('ERP', 'Buscando pedido', { numeroPedido: input.numeroPedido });

        const db = getDb('erp');
        if (!db) {
          logger.warn('ERP', 'Banco ERP não disponível');
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Banco ERP não disponível no momento',
          });
        }

        // Buscar pedido na tabela pedido
        // NOTA: Ajuste os nomes das tabelas e campos conforme o schema real do ERP
        const pedidoResult = await db.execute(
          sql`SELECT * FROM pedido WHERE numero = ${input.numeroPedido} LIMIT 1`
        );

        if (!pedidoResult || pedidoResult.length === 0) {
          logger.warn('ERP', 'Pedido não encontrado', undefined, { numeroPedido: input.numeroPedido });
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Pedido ${input.numeroPedido} não encontrado no ERP`,
          });
        }

        const pedido = pedidoResult[0];

        // Buscar notas fiscais relacionadas
        let notas: any[] = [];
        try {
          const notasResult = await db.execute(
            sql`SELECT * FROM nfenotas WHERE numero_pedido = ${input.numeroPedido}`
          );
          notas = notasResult || [];
        } catch (error) {
          logger.warn('ERP', 'Erro ao buscar notas', undefined, { numeroPedido: input.numeroPedido });
        }

        // Buscar dados do cliente
        let cliente: any = null;
        try {
          if (pedido.cliente_id) {
            const clienteResult = await db.execute(
              sql`SELECT * FROM clientes WHERE id = ${pedido.cliente_id} LIMIT 1`
            );
            cliente = clienteResult?.[0] || null;
          }
        } catch (error) {
          logger.warn('ERP', 'Erro ao buscar cliente', undefined, { id: pedido.cliente_id });
        }

        // Buscar endereço de entrega
        let endereco: any = null;
        try {
          if (pedido.endereco_entrega_id) {
            const enderecoResult = await db.execute(
              sql`SELECT * FROM enderecos WHERE id = ${pedido.endereco_entrega_id} LIMIT 1`
            );
            endereco = enderecoResult?.[0] || null;
          }
        } catch (error) {
          logger.warn('ERP', 'Erro ao buscar endereço', undefined, { id: pedido.endereco_entrega_id });
        }

        logger.info('ERP', 'Pedido encontrado', { numeroPedido: input.numeroPedido });

        return {
          success: true,
          message: 'Pedido encontrado',
          data: {
            pedido,
            notas,
            cliente,
            endereco,
          },
        };
      } catch (error: any) {
        logger.error('ERP', 'Erro ao buscar pedido', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar pedido no ERP: ' + error.message,
        });
      }
    }),

  /**
   * Buscar múltiplos pedidos
   */
  getPedidos: protectedProcedure
    .input(
      z.object({
        numeros: z.array(z.number()),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        logger.info('ERP', 'Buscando múltiplos pedidos', { total: input.numeros.length });

        const db = getDb('erp');
        if (!db) {
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Banco ERP não disponível',
          });
        }

        const pedidos = [];

        for (const numero of input.numeros) {
          try {
            const result = await db.execute(
              sql`SELECT * FROM pedido WHERE numero = ${numero} LIMIT 1`
            );

            if (result && result.length > 0) {
              pedidos.push(result[0]);
            }
          } catch (error) {
            logger.warn('ERP', 'Erro ao buscar pedido individual', undefined, { num: numero });
          }
        }

        logger.info('ERP', 'Pedidos encontrados', { total: pedidos.length });

        return {
          success: true,
          message: `${pedidos.length} pedido(s) encontrado(s)`,
          data: pedidos,
        };
      } catch (error: any) {
        logger.error('ERP', 'Erro ao buscar pedidos', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar pedidos',
        });
      }
    }),

  /**
   * Buscar cliente no ERP
   */
  getCliente: protectedProcedure
    .input(z.object({ clienteId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('ERP', 'Buscando cliente', { clienteId: input.clienteId });

        const db = getDb('erp');
        if (!db) {
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Banco ERP não disponível',
          });
        }

        const result = await db.execute(
          sql`SELECT * FROM clientes WHERE id = ${input.clienteId} LIMIT 1`
        );

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Cliente não encontrado',
          });
        }

        return {
          success: true,
          message: 'Cliente encontrado',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('ERP', 'Erro ao buscar cliente', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar cliente',
        });
      }
    }),

  /**
   * Buscar nota fiscal
   */
  getNota: protectedProcedure
    .input(z.object({ numeroNota: z.string() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('ERP', 'Buscando nota fiscal', { numeroNota: input.numeroNota });

        const db = getDb('erp');
        if (!db) {
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Banco ERP não disponível',
          });
        }

        const result = await db.execute(
          sql`SELECT * FROM nfenotas WHERE numero = ${input.numeroNota} LIMIT 1`
        );

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Nota fiscal não encontrada',
          });
        }

        return {
          success: true,
          message: 'Nota fiscal encontrada',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('ERP', 'Erro ao buscar nota', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar nota fiscal',
        });
      }
    }),

  /**
   * Buscar endereço de entrega
   */
  getEndereco: protectedProcedure
    .input(z.object({ enderecoId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        logger.info('ERP', 'Buscando endereço', { enderecoId: input.enderecoId });

        const db = getDb('erp');
        if (!db) {
          throw new TRPCError({
            code: 'SERVICE_UNAVAILABLE',
            message: 'Banco ERP não disponível',
          });
        }

        const result = await db.execute(
          sql`SELECT * FROM enderecos WHERE id = ${input.enderecoId} LIMIT 1`
        );

        if (!result || result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Endereço não encontrado',
          });
        }

        return {
          success: true,
          message: 'Endereço encontrado',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('ERP', 'Erro ao buscar endereço', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar endereço',
        });
      }
    }),
});
