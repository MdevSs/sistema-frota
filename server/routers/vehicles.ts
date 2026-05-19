/**
 * Router de Veículos
 * CRUD completo com validação
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { vehicles } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../logger';
import { TRPCError } from '@trpc/server';

// Schema de validação
const createVehicleSchema = z.object({
  placa: z.string().regex(/^[A-Z]{3}-?\d{4}$/, 'Placa inválida (formato: ABC-1234)').transform(p => p.replace('-', '')),
  modelo: z.enum(['Hyundai HR', 'Iveco Daily', 'Fiat Ducato', 'Mercedes Sprinter', 'Renault Master', 'Kia Bongo']),
  tipo: z.enum(['VUC', 'VAN', 'CAMINHAO']).default('VUC'),
  capacidadeKg: z.number().positive('Capacidade em kg deve ser positiva'),
  capacidadeM3: z.number().positive('Capacidade em m³ deve ser positiva'),
  altura: z.number().positive().optional(),
  largura: z.number().positive().optional(),
  comprimento: z.number().positive().optional(),
  peso: z.number().positive().optional(),
});

const updateVehicleSchema = createVehicleSchema.partial();

export const vehiclesRouter = router({
  /**
   * Criar novo veículo
   */
  create: protectedProcedure
    .input(createVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Vehicles', 'Criando novo veículo', { placa: input.placa });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        // Verificar se placa já existe
        const existing = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.placa, input.placa))
          .limit(1);

        if (existing.length > 0) {
          logger.warn('Vehicles', 'Placa duplicada', undefined, { plate: input.placa });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Já existe um veículo com esta placa',
          });
        }

        // Inserir veículo
        const result = await db
          .insert(vehicles)
          .values({
            placa: input.placa,
            modelo: input.modelo,
            tipo: input.tipo,
            capacidadeKg: input.capacidadeKg.toString(),
            capacidadeM3: input.capacidadeM3.toString(),
            altura: input.altura ? input.altura.toString() : null,
            largura: input.largura ? input.largura.toString() : null,
            comprimento: input.comprimento ? input.comprimento.toString() : null,
            peso: input.peso ? input.peso.toString() : null,
            ativo: true,
          })
          .returning();

        logger.info('Vehicles', 'Veículo criado', { id: result[0].id, placa: result[0].placa });

        return {
          success: true,
          message: 'Veículo cadastrado com sucesso',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('Vehicles', 'Erro ao criar veículo', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao cadastrar veículo',
        });
      }
    }),

  /**
   * Listar veículos ativos
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    try {
      logger.info('Vehicles', 'Listando veículos');

      const db = getDb('logistica');
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Banco de dados não disponível',
        });
      }

      const result = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.ativo, true))
        .orderBy(vehicles.placa);

      logger.info('Vehicles', 'Veículos listados', { total: result.length });

      return {
        success: true,
        message: `${result.length} veículo(s) encontrado(s)`,
        data: result,
      };
    } catch (error: any) {
      logger.error('Vehicles', 'Erro ao listar veículos', error);

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro ao listar veículos',
      });
    }
  }),

  /**
   * Obter veículo por ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        const result = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, input.id))
          .limit(1);

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veículo não encontrado',
          });
        }

        return {
          success: true,
          message: 'Veículo encontrado',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('Vehicles', 'Erro ao buscar veículo', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao buscar veículo',
        });
      }
    }),

  /**
   * Atualizar veículo
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: updateVehicleSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Vehicles', 'Atualizando veículo', { id: input.id });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        const existing = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, input.id))
          .limit(1);

        if (existing.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veículo não encontrado',
          });
        }

        // Converter números para strings (Drizzle ORM com NUMERIC)
        const updateData: any = { ...input.data };
        if (updateData.capacidadeKg) updateData.capacidadeKg = updateData.capacidadeKg.toString();
        if (updateData.capacidadeM3) updateData.capacidadeM3 = updateData.capacidadeM3.toString();
        if (updateData.altura) updateData.altura = updateData.altura.toString();
        if (updateData.largura) updateData.largura = updateData.largura.toString();
        if (updateData.comprimento) updateData.comprimento = updateData.comprimento.toString();
        if (updateData.peso) updateData.peso = updateData.peso.toString();

        const result = await db
          .update(vehicles)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(vehicles.id, input.id))
          .returning();

        logger.info('Vehicles', 'Veículo atualizado', { id: input.id });

        return {
          success: true,
          message: 'Veículo atualizado com sucesso',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('Vehicles', 'Erro ao atualizar veículo', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar veículo',
        });
      }
    }),

  /**
   * Inativar veículo
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Vehicles', 'Inativando veículo', { id: input.id });

        const db = getDb('logistica');
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível',
          });
        }

        const result = await db
          .update(vehicles)
          .set({
            ativo: false,
            updatedAt: new Date(),
          })
          .where(eq(vehicles.id, input.id))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Veículo não encontrado',
          });
        }

        logger.info('Vehicles', 'Veículo inativado', { id: input.id });

        return {
          success: true,
          message: 'Veículo inativado com sucesso',
          data: result[0],
        };
      } catch (error: any) {
        logger.error('Vehicles', 'Erro ao inativar veículo', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao inativar veículo',
        });
      }
    }),
});
