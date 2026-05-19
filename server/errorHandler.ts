/**
 * Tratamento Global de Erros
 * Padroniza respostas de erro em toda a aplicação
 */

import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { logger } from './logger';

export interface ErrorResponse {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * Converter erro para resposta padronizada
 */
export function handleError(error: any, context: string = 'Operation'): ErrorResponse {
  const timestamp = new Date().toISOString();
  
  logger.error('ErrorHandler', `${context}: ${error?.message || 'Unknown error'}`, error);

  // Erro de validação Zod
  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    (error as any).errors?.forEach((err: any) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(err.message);
    });

    return {
      success: false,
      message: 'Erro de validação nos dados enviados',
      code: 'VALIDATION_ERROR',
      errors,
      timestamp,
    };
  }

  // Erro tRPC
  if (error instanceof TRPCError) {
    return {
      success: false,
      message: error.message || 'Erro ao processar requisição',
      code: error.code,
      timestamp,
    };
  }

  // Erro de banco de dados PostgreSQL
  if (error.code) {
    switch (error.code) {
      case '23505': // Violação de unique constraint
        return {
          success: false,
          message: 'Registro duplicado: este valor já existe no banco de dados',
          code: 'UNIQUE_VIOLATION',
          timestamp,
        };

      case '23503': // Violação de foreign key
        return {
          success: false,
          message: 'Referência inválida: o registro relacionado não existe',
          code: 'FK_VIOLATION',
          timestamp,
        };

      case '23502': // NOT NULL violation
        return {
          success: false,
          message: 'Campo obrigatório não foi preenchido',
          code: 'NOT_NULL_VIOLATION',
          timestamp,
        };

      case '42P01': // Table does not exist
        return {
          success: false,
          message: 'Tabela não encontrada no banco de dados',
          code: 'TABLE_NOT_FOUND',
          timestamp,
        };

      case 'ECONNREFUSED':
        return {
          success: false,
          message: 'Erro ao conectar com o banco de dados',
          code: 'DB_CONNECTION_ERROR',
          timestamp,
        };
    }
  }

  // Erro genérico
  return {
    success: false,
    message: error?.message || 'Erro ao processar requisição',
    code: 'INTERNAL_ERROR',
    timestamp,
  };
}

/**
 * Formatar resposta de sucesso
 */
export function handleSuccess<T = any>(
  data?: T,
  message: string = 'Operação realizada com sucesso'
): SuccessResponse<T> {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Wrapper para procedures que garante tratamento de erro padronizado
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  operationName: string = 'Operation'
): Promise<T> {
  try {
    logger.debug('ErrorHandler', `Starting: ${operationName}`);
    const result = await fn();
    logger.debug('ErrorHandler', `Completed: ${operationName}`);
    return result;
  } catch (error: any) {
    logger.error('ErrorHandler', `Failed: ${operationName}`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
