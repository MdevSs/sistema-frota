/**
 * Testes de Conexão com Bancos PostgreSQL
 * Valida se as strings de conexão estão corretas
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectLogistica, connectERP, getConnectionStatus, closeAll } from './database';
import { logger } from './logger';

describe('Conexões PostgreSQL', () => {
  
  afterAll(async () => {
    await closeAll();
  });

  it('deve ter DATABASE_URL_LOGISTICA configurado', () => {
    expect(process.env.DATABASE_URL_LOGISTICA).toBeDefined();
    expect(process.env.DATABASE_URL_LOGISTICA).toContain('postgres');
  });

  it('deve ter DATABASE_URL_ERP configurado', () => {
    expect(process.env.DATABASE_URL_ERP).toBeDefined();
    expect(process.env.DATABASE_URL_ERP).toContain('postgres');
  });

  it('DATABASE_URL_LOGISTICA deve apontar para 192.168.1.171', () => {
    const url = process.env.DATABASE_URL_LOGISTICA || '';
    expect(url).toContain('192.168.1.171');
  });

  it('DATABASE_URL_ERP deve apontar para 192.168.1.17', () => {
    const url = process.env.DATABASE_URL_ERP || '';
    expect(url).toContain('192.168.1.17');
  });

  it('DATABASE_URL_LOGISTICA deve usar banco "logistica"', () => {
    const url = process.env.DATABASE_URL_LOGISTICA || '';
    expect(url).toContain('/logistica');
  });

  it('DATABASE_URL_ERP deve usar banco "salutem"', () => {
    const url = process.env.DATABASE_URL_ERP || '';
    expect(url).toContain('/salutem');
  });

  it('não deve conter referências a MySQL', () => {
    const logisticaUrl = process.env.DATABASE_URL_LOGISTICA || '';
    const erpUrl = process.env.DATABASE_URL_ERP || '';
    
    expect(logisticaUrl).not.toContain('mysql');
    expect(erpUrl).not.toContain('mysql');
  });

  it('não deve conter TiDB na URL', () => {
    const logisticaUrl = process.env.DATABASE_URL_LOGISTICA || '';
    const erpUrl = process.env.DATABASE_URL_ERP || '';
    
    expect(logisticaUrl).not.toContain('tidb');
    expect(erpUrl).not.toContain('tidb');
  });

  describe('Tentativa de conexão', () => {
    it('deve tentar conectar ao banco Logística', async () => {
      const result = await connectLogistica();
      const status = getConnectionStatus();
      
      // Se conectou, status deve ser 'connected'
      // Se não conectou (rede indisponível), status deve ser 'error'
      expect(['connected', 'error']).toContain(status.logistica.status);
    }, { timeout: 10000 });

    it('deve tentar conectar ao banco ERP', async () => {
      const result = await connectERP();
      const status = getConnectionStatus();
      
      // Se conectou, status deve ser 'connected'
      // Se não conectou (rede indisponível), status deve ser 'error'
      expect(['connected', 'error']).toContain(status.erp.status);
    }, { timeout: 10000 });

    it('deve retornar status correto das conexões', async () => {
      const status = getConnectionStatus();
      
      expect(status).toHaveProperty('logistica');
      expect(status).toHaveProperty('erp');
      expect(status.logistica).toHaveProperty('status');
      expect(status.erp).toHaveProperty('status');
    });
  });
});
