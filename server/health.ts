/**
 * Health Check Route
 * Verifica status do backend, banco de dados e dependências
 */

import { getDb, getConnectionStatus } from './database';
import { users } from '../drizzle/schema';

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  backend: {
    status: 'ok' | 'error';
    message: string;
  };
  database: {
    status: 'ok' | 'error';
    message: string;
    type: string;
  };
  environment: {
    nodeEnv: string;
    hasDatabase: boolean;
    hasOAuthConfig: boolean;
  };
  errors: string[];
  connections?: {
    logistica: { 
      status: string; 
      error?: string;
      attempts?: number;
      lastAttempt?: Date;
    };
    erp: { 
      status: string; 
      error?: string;
      attempts?: number;
      lastAttempt?: Date;
    };
  };
}

const startTime = Date.now();

export async function getHealthStatus(): Promise<HealthCheckResponse> {
  const errors: string[] = [];
  let backendStatus: 'ok' | 'error' = 'ok';
  let databaseStatus: 'ok' | 'error' = 'error';
  let backendMessage = 'Backend rodando';
  let databaseMessage = 'Banco de dados não disponível';

  // Verificar backend
  try {
    if (!process.env.NODE_ENV) {
      errors.push('NODE_ENV não configurado');
      backendStatus = 'error';
      backendMessage = 'NODE_ENV não configurado';
    }
  } catch (error) {
    errors.push(`Erro ao verificar backend: ${error}`);
    backendStatus = 'error';
    backendMessage = 'Erro ao verificar backend';
  }

  // Verificar status das duas conexões
  const connectionStatus = getConnectionStatus();
  const logisticaOk = connectionStatus.logistica.status === 'connected';
  const erpOk = connectionStatus.erp.status === 'connected';

  if (logisticaOk && erpOk) {
    databaseStatus = 'ok';
    databaseMessage = 'Conectado a ambos os bancos (Logística + ERP)';
  } else if (logisticaOk) {
    databaseStatus = 'ok';
    databaseMessage = 'Conectado ao banco Logística (ERP indisponível)';
  } else {
    databaseStatus = 'error';
    if (connectionStatus.logistica.error) {
      errors.push(`Logística: ${connectionStatus.logistica.error}`);
    }
    if (connectionStatus.erp.error) {
      errors.push(`ERP: ${connectionStatus.erp.error}`);
    }
    databaseMessage = 'Nenhum banco disponível';
  }

  // Determinar status geral
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (databaseStatus === 'error') {
    overallStatus = 'unhealthy';
  } else if (!erpOk) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Date.now() - startTime,
    backend: {
      status: backendStatus,
      message: backendMessage,
    },
    database: {
      status: databaseStatus,
      message: databaseMessage,
      type: 'PostgreSQL (Dual)',
    },
    environment: {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      hasDatabase: !!process.env.DATABASE_URL_LOGISTICA,
      hasOAuthConfig: !!process.env.VITE_APP_ID,
    },
    errors,
    connections: {
      logistica: {
        status: connectionStatus.logistica.status,
        error: connectionStatus.logistica.error,
        attempts: connectionStatus.logistica.attemptCount,
        lastAttempt: connectionStatus.logistica.lastAttempt,
      },
      erp: {
        status: connectionStatus.erp.status,
        error: connectionStatus.erp.error,
        attempts: connectionStatus.erp.attemptCount,
        lastAttempt: connectionStatus.erp.lastAttempt,
      },
    },
  };
}
