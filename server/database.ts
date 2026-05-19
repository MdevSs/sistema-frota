/**
 * Gerenciador de Conexões com Dois Bancos PostgreSQL
 * 
 * 1. Banco Logística (192.168.1.171:5432/logistica)
 *    - Tabelas próprias do sistema
 *    - Motoristas, veículos, rotas, entregas, logs
 * 
 * 2. Banco ERP (192.168.1.17:5432/salutem)
 *    - Somente leitura
 *    - Dados de pedidos, notas fiscais, clientes
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { logger } from './logger';

// Tipos de conexão
export type DatabaseType = 'logistica' | 'erp';

interface DatabaseConnection {
  client: postgres.Sql | null;
  drizzle: ReturnType<typeof drizzle> | null;
  status: 'connected' | 'disconnected' | 'error';
  error?: string;
  lastAttempt?: Date;
  attemptCount?: number;
}

// Armazenar conexões
const connections: Record<DatabaseType, DatabaseConnection> = {
  logistica: {
    client: null,
    drizzle: null,
    status: 'disconnected',
    attemptCount: 0,
  },
  erp: {
    client: null,
    drizzle: null,
    status: 'disconnected',
    attemptCount: 0,
  },
};

/**
 * Conectar ao banco Logística
 */
export async function connectLogistica(): Promise<boolean> {
  try {
    const connectionString = process.env.DATABASE_URL_LOGISTICA;
    
    if (!connectionString) {
      const error = 'DATABASE_URL_LOGISTICA não configurado';
      logger.error('Database', error);
      connections.logistica.status = 'error';
      connections.logistica.error = error;
      return false;
    }

    logger.info('Database', 'Conectando ao banco Logística...', { 
      url: connectionString.substring(0, 50) + '...' 
    });
    
    const client = postgres(connectionString, {
      connect_timeout: 10,
      idle_timeout: 30,
    });
    
    const db = drizzle(client);

    // Testar conexão
    await client`SELECT 1`;
    
    connections.logistica.client = client;
    connections.logistica.drizzle = db;
    connections.logistica.status = 'connected';
    connections.logistica.error = undefined;
    connections.logistica.attemptCount = 0;
    
    logger.info('Database', '✅ Conectado ao banco Logística com sucesso');
    return true;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || 'UNKNOWN';
    const errorDetail = error?.detail || '';
    logger.error('Database', 'Erro ao conectar ao banco Logística', errorMsg, {
      code: errorCode,
      detail: errorDetail,
    });
    
    connections.logistica.status = 'error';
    connections.logistica.error = errorMsg;
    connections.logistica.lastAttempt = new Date();
    connections.logistica.attemptCount = (connections.logistica.attemptCount || 0) + 1;
    
    return false;
  }
}

/**
 * Conectar ao banco ERP
 */
export async function connectERP(): Promise<boolean> {
  try {
    const connectionString = process.env.DATABASE_URL_ERP;
    
    if (!connectionString) {
      const error = 'DATABASE_URL_ERP não configurado';
      logger.error('Database', error);
      connections.erp.status = 'error';
      connections.erp.error = error;
      return false;
    }

    logger.info('Database', 'Conectando ao banco ERP...', { 
      url: connectionString.substring(0, 50) + '...' 
    });
    
    const client = postgres(connectionString, {
      connect_timeout: 10,
      idle_timeout: 30,
    });
    
    const db = drizzle(client);

    // Testar conexão
    await client`SELECT 1`;
    
    connections.erp.client = client;
    connections.erp.drizzle = db;
    connections.erp.status = 'connected';
    connections.erp.error = undefined;
    connections.erp.attemptCount = 0;
    
    logger.info('Database', '✅ Conectado ao banco ERP com sucesso');
    return true;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    const errorCode = error?.code || 'UNKNOWN';
    const errorDetail = error?.detail || '';
    logger.error('Database', 'Erro ao conectar ao banco ERP', errorMsg, {
      code: errorCode,
      detail: errorDetail,
    });
    
    connections.erp.status = 'error';
    connections.erp.error = errorMsg;
    connections.erp.lastAttempt = new Date();
    connections.erp.attemptCount = (connections.erp.attemptCount || 0) + 1;
    
    return false;
  }
}

/**
 * Conectar a ambos os bancos
 */
export async function connectAll(): Promise<boolean> {
  const logisticaOk = await connectLogistica();
  const erpOk = await connectERP();
  return logisticaOk && erpOk;
}

/**
 * Obter conexão Drizzle ORM (síncrono - retorna null se não conectado)
 */
export function getDb(type: DatabaseType = 'logistica') {
  const connection = connections[type];
  
  if (!connection.drizzle || connection.status !== 'connected') {
    logger.warn('Database', `Banco ${type} não está conectado`);
    return null;
  }
  
  return connection.drizzle;
}

/**
 * Obter cliente PostgreSQL
 */
export function getClient(type: DatabaseType = 'logistica') {
  const connection = connections[type];
  
  if (!connection.client) {
    logger.warn('Database', `Cliente ${type} não está conectado`);
    return null;
  }
  
  return connection.client;
}

/**
 * Obter status de ambas as conexões (para health check)
 */
export function getConnectionStatus() {
  return {
    logistica: {
      status: connections.logistica.status,
      error: connections.logistica.error,
      lastAttempt: connections.logistica.lastAttempt,
      attemptCount: connections.logistica.attemptCount,
    },
    erp: {
      status: connections.erp.status,
      error: connections.erp.error,
      lastAttempt: connections.erp.lastAttempt,
      attemptCount: connections.erp.attemptCount,
    },
  };
}

/**
 * Fechar todas as conexões
 */
export async function closeAll(): Promise<void> {
  try {
    if (connections.logistica.client) {
      await connections.logistica.client.end();
      connections.logistica.client = null;
      connections.logistica.drizzle = null;
      connections.logistica.status = 'disconnected';
      logger.info('Database', 'Conexão Logística fechada');
    }

    if (connections.erp.client) {
      await connections.erp.client.end();
      connections.erp.client = null;
      connections.erp.drizzle = null;
      connections.erp.status = 'disconnected';
      logger.info('Database', 'Conexão ERP fechada');
    }
  } catch (error: any) {
    logger.error('Database', 'Erro ao fechar conexões', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Reconectar a ambos os bancos
 */
export async function reconnectAll(): Promise<boolean> {
  logger.info('Database', 'Reconectando a ambos os bancos...');
  await closeAll();
  return await connectAll();
}
