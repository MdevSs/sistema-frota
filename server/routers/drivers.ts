/**
 * Router de Motoristas
 * CRUD completo com validação e tratamento de erro
 * MVP: Campos de endereço são opcionais
 */

import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { drivers } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '../logger';
import { handleError, handleSuccess } from '../errorHandler';
import { TRPCError } from '@trpc/server';

// Schema de validação - MVP: Campos simples obrigatórios, endereço opcional
const createDriverSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  cpf: z.string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
    .transform(val => val.replace(/\D/g, '')), // Remove caracteres não numéricos
  telefone: z.string()
    .regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
    .transform(val => val.replace(/\D/g, '')), // Remove caracteres não numéricos
  email: z.string().email('Email inválido').optional().nullable(),
  cnh: z.string()
    .regex(/^\d{11,20}$/, 'CNH deve ter entre 11 e 20 dígitos')
    .transform(val => val.replace(/\D/g, '')), // Remove caracteres não numéricos
  // MVP: Campos opcionais
  cnhValidade: z.date().optional().nullable(),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres').max(255).optional().nullable(),
  cidade: z.string().min(2, 'Cidade é obrigatória').max(100).optional().nullable(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional().nullable(),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos').optional().nullable(),
});

const updateDriverSchema = createDriverSchema.partial();

export const driversRouter = router({
  /**
   * Criar novo motorista
   */
  create: protectedProcedure
    .input(createDriverSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Drivers', 'Criando novo motorista', { nome: input.nome, cpf: input.cpf });

        const db = getDb('logistica');
        if (!db) {
          logger.error('Drivers', 'Banco Logística não disponível ao criar motorista');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível. Verifique a conexão com o servidor.',
          });
        }

        // Verificar se CPF já existe
        const existingCpf = await db
          .select()
          .from(drivers)
          .where(eq(drivers.cpf, input.cpf))
          .limit(1);

        if (existingCpf.length > 0) {
          logger.warn('Drivers', 'CPF duplicado', undefined, { cpf: input.cpf });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Já existe um motorista com este CPF',
          });
        }

        // Verificar se CNH já existe
        const existingCnh = await db
          .select()
          .from(drivers)
          .where(eq(drivers.cnh, input.cnh))
          .limit(1);

        if (existingCnh.length > 0) {
          logger.warn('Drivers', 'CNH duplicada', undefined, { cnh: input.cnh });
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Já existe um motorista com esta CNH',
          });
        }

        // Inserir motorista
        const result = await db
          .insert(drivers)
          .values({
            nome: input.nome,
            cpf: input.cpf,
            telefone: input.telefone,
            email: input.email || null,
            cnh: input.cnh,
            cnhValidade: input.cnhValidade || null,
            endereco: input.endereco || null,
            cidade: input.cidade || null,
            estado: input.estado || null,
            cep: input.cep || null,
            ativo: true,
          })
          .returning();

        logger.info('Drivers', 'Motorista criado com sucesso', { id: result[0].id, nome: result[0].nome });

        return {
          success: true,
          message: 'Motorista cadastrado com sucesso',
          data: result[0],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error('Drivers', 'Erro ao criar motorista', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao cadastrar motorista',
        });
      }
    }),

  /**
   * Listar motoristas
   */
  list: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const db = getDb('logistica');
        if (!db) {
          logger.error('Drivers', 'Banco Logística não disponível ao listar motoristas');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível. Verifique a conexão com o servidor.',
          });
        }

        const result = await db
          .select()
          .from(drivers)
          .where(eq(drivers.ativo, true));

        logger.info('Drivers', 'Listagem de motoristas', { total: result.length });

        return {
          success: true,
          message: 'Motoristas listados com sucesso',
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error('Drivers', 'Erro ao listar motoristas', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao listar motoristas',
        });
      }
    }),

  /**
   * Atualizar motorista
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      ...updateDriverSchema.shape,
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...updateData } = input;
        logger.info('Drivers', 'Atualizando motorista', { id });

        const db = getDb('logistica');
        if (!db) {
          logger.error('Drivers', 'Banco Logística não disponível ao atualizar motorista');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível. Verifique a conexão com o servidor.',
          });
        }

        // Preparar dados para atualização (remover undefined)
        const dataToUpdate: any = {};
        if (updateData.nome !== undefined) dataToUpdate.nome = updateData.nome;
        if (updateData.telefone !== undefined) dataToUpdate.telefone = updateData.telefone;
        if (updateData.email !== undefined) dataToUpdate.email = updateData.email;
        if (updateData.cnh !== undefined) dataToUpdate.cnh = updateData.cnh;
        if (updateData.cnhValidade !== undefined) dataToUpdate.cnhValidade = updateData.cnhValidade;
        if (updateData.endereco !== undefined) dataToUpdate.endereco = updateData.endereco;
        if (updateData.cidade !== undefined) dataToUpdate.cidade = updateData.cidade;
        if (updateData.estado !== undefined) dataToUpdate.estado = updateData.estado;
        if (updateData.cep !== undefined) dataToUpdate.cep = updateData.cep;

        const result = await db
          .update(drivers)
          .set(dataToUpdate)
          .where(eq(drivers.id, id))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Motorista não encontrado',
          });
        }

        logger.info('Drivers', 'Motorista atualizado com sucesso', { id });

        return {
          success: true,
          message: 'Motorista atualizado com sucesso',
          data: result[0],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error('Drivers', 'Erro ao atualizar motorista', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao atualizar motorista',
        });
      }
    }),

  /**
   * Inativar motorista
   */
  deactivate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      try {
        logger.info('Drivers', 'Inativando motorista', { id: input.id });

        const db = getDb('logistica');
        if (!db) {
          logger.error('Drivers', 'Banco Logística não disponível ao inativar motorista');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Banco de dados não disponível. Verifique a conexão com o servidor.',
          });
        }

        const result = await db
          .update(drivers)
          .set({ ativo: false })
          .where(eq(drivers.id, input.id))
          .returning();

        if (result.length === 0) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Motorista não encontrado',
          });
        }

        logger.info('Drivers', 'Motorista inativado com sucesso', { id: input.id });

        return {
          success: true,
          message: 'Motorista inativado com sucesso',
          data: result[0],
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logger.error('Drivers', 'Erro ao inativar motorista', error as Error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Erro ao inativar motorista',
        });
      }
    }),
});
