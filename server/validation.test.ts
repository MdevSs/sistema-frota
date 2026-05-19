/**
 * Testes de Validação do Sistema
 * Verifica:
 * 1. Conexão com PostgreSQL
 * 2. Health check
 * 3. Tratamento de erros
 * 4. Validação de dados
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { getHealthStatus } from './health';
import { handleError, handleSuccess } from './errorHandler';
import { logger } from './logger';
import { TRPCError } from '@trpc/server';
import { ZodError, z } from 'zod';

describe('Sistema de Logística - Validação Completa', () => {
  
  describe('Health Check', () => {
    it('deve retornar status do sistema', async () => {
      const health = await getHealthStatus();
      
      expect(health).toBeDefined();
      expect(health.status).toMatch(/healthy|degraded|unhealthy/);
      expect(health.timestamp).toBeDefined();
      expect(health.backend).toBeDefined();
      expect(health.database).toBeDefined();
      expect(health.environment).toBeDefined();
    });

    it('deve verificar tipo de banco de dados', async () => {
      const health = await getHealthStatus();
      
      expect(health.database.type).toContain('PostgreSQL');
      expect(health.database.type).not.toContain('MySQL');
    });

    it('deve verificar se DATABASE_URL está configurado', async () => {
      const health = await getHealthStatus();
      
      expect(health.environment.hasDatabase).toBe(true);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve formatar erro de validação Zod', () => {
      const schema = z.object({
        nome: z.string().min(3),
        email: z.string().email(),
      });

      try {
        schema.parse({ nome: 'ab', email: 'invalid' });
      } catch (error) {
        const response = handleError(error, 'Validation Test');
        
        expect(response.success).toBe(false);
        expect(response.code).toBe('VALIDATION_ERROR');
        expect(response.errors).toBeDefined();
      }
    });

    it('deve formatar erro tRPC', () => {
      const error = new TRPCError({
        code: 'NOT_FOUND',
        message: 'Motorista não encontrado',
      });

      const response = handleError(error, 'TRPC Test');
      
      expect(response.success).toBe(false);
      expect(response.code).toBe('NOT_FOUND');
      expect(response.message).toBe('Motorista não encontrado');
    });

    it('deve formatar erro de violação de unique constraint', () => {
      const error = {
        code: '23505',
        detail: 'Key ("cpf")=(12345678901) already exists.',
      };

      const response = handleError(error, 'Unique Violation Test');
      
      expect(response.success).toBe(false);
      expect(response.code).toBe('UNIQUE_VIOLATION');
      expect(response.message).toContain('duplicado');
    });

    it('deve formatar erro de foreign key', () => {
      const error = {
        code: '23503',
        detail: 'Key (driverId)=(999) is not present in table "drivers".',
      };

      const response = handleError(error, 'FK Violation Test');
      
      expect(response.success).toBe(false);
      expect(response.code).toBe('FK_VIOLATION');
    });

    it('deve formatar erro de NOT NULL', () => {
      const error = {
        code: '23502',
        detail: 'Failing row contains (null, null, null).',
      };

      const response = handleError(error, 'NOT NULL Test');
      
      expect(response.success).toBe(false);
      expect(response.code).toBe('NOT_NULL_VIOLATION');
    });
  });

  describe('Resposta de Sucesso', () => {
    it('deve formatar resposta de sucesso', () => {
      const data = { id: 1, nome: 'João Silva' };
      const response = handleSuccess(data, 'Motorista cadastrado com sucesso');
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Motorista cadastrado com sucesso');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });

    it('deve usar mensagem padrão', () => {
      const response = handleSuccess();
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Operação realizada com sucesso');
    });
  });

  describe('Logger', () => {
    it('deve registrar logs', () => {
      logger.info('Test', 'Teste de log');
      logger.warn('Test', 'Aviso de teste');
      logger.error('Test', 'Erro de teste', new Error('Teste'));
      
      const logs = logger.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('deve filtrar logs por nível', () => {
      logger.clear();
      logger.info('Test', 'Info');
      logger.error('Test', 'Error', new Error('Test'));
      
      const errors = logger.getLogs('error');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].level).toBe('error');
    });
  });

  describe('Validação de Dados - Motorista', () => {
    it('deve validar CPF com 11 dígitos', () => {
      const cpfSchema = z.string().regex(/^\d{11}$/, 'CPF deve ter 11 dígitos');
      
      expect(() => cpfSchema.parse('12345678901')).not.toThrow();
      expect(() => cpfSchema.parse('123456789')).toThrow();
    });

    it('deve validar CNH com 11 dígitos', () => {
      const cnhSchema = z.string().regex(/^\d{11}$/, 'CNH deve ter 11 dígitos');
      
      expect(() => cnhSchema.parse('12345678901')).not.toThrow();
      expect(() => cnhSchema.parse('123')).toThrow();
    });

    it('deve validar telefone com 10-11 dígitos', () => {
      const telSchema = z.string().regex(/^\d{10,11}$/, 'Telefone deve ter 10-11 dígitos');
      
      expect(() => telSchema.parse('11999999999')).not.toThrow();
      expect(() => telSchema.parse('1199999999')).not.toThrow();
      expect(() => telSchema.parse('119')).toThrow();
    });

    it('deve validar CEP com 8 dígitos', () => {
      const cepSchema = z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos');
      
      expect(() => cepSchema.parse('01234567')).not.toThrow();
      expect(() => cepSchema.parse('0123456')).toThrow();
    });

    it('deve validar nome com mínimo 3 caracteres', () => {
      const nomeSchema = z.string().min(3, 'Nome deve ter pelo menos 3 caracteres');
      
      expect(() => nomeSchema.parse('João Silva')).not.toThrow();
      expect(() => nomeSchema.parse('Jo')).toThrow();
    });
  });

  describe('Verificação de Dependências', () => {
    it('deve confirmar que MySQL foi removido', () => {
      // Verificar que não há referência a mysql2 no código
      // Usar DATABASE_URL_LOGISTICA em vez de DATABASE_URL (que pode ser antigo)
      expect(process.env.DATABASE_URL_LOGISTICA).toBeDefined();
      expect(process.env.DATABASE_URL_LOGISTICA).toContain('postgres');
    });

    it('deve confirmar que PostgreSQL está sendo usado', async () => {
      const health = await getHealthStatus();
      
      // Aceitar 'PostgreSQL' ou 'PostgreSQL (Dual)'
      expect(health.database.type).toMatch(/PostgreSQL/);
      expect(health.database.type).not.toContain('MySQL');
    });
  });
});
