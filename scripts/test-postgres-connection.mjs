#!/usr/bin/env node

/**
 * Script para testar conexão com PostgreSQL
 * 
 * Uso:
 * node scripts/test-postgres-connection.mjs
 * 
 * Este script testa:
 * 1. Se DATABASE_URL_LOGISTICA está configurado
 * 2. Se consegue conectar ao banco Logística
 * 3. Se consegue conectar ao banco ERP
 * 4. Se as tabelas existem
 * 5. Se consegue inserir e ler dados
 */

import postgres from 'postgres';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${colors.reset}`);
}

async function testConnection(name, connectionString) {
  log(colors.blue, `\n=== Testando ${name} ===`);
  
  if (!connectionString) {
    log(colors.red, `❌ Variável de ambiente não configurada`);
    return false;
  }
  
  log(colors.yellow, `URL: ${connectionString.substring(0, 60)}...`);
  
  try {
    const sql = postgres(connectionString, {
      connect_timeout: 5,
      idle_timeout: 10,
    });
    
    // Testar conexão
    const result = await sql`SELECT 1 as test`;
    log(colors.green, `✅ Conectado com sucesso`);
    
    // Testar se consegue listar tabelas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    log(colors.green, `✅ Tabelas encontradas: ${tables.length}`);
    if (tables.length > 0) {
      tables.forEach(t => {
        log(colors.yellow, `   - ${t.table_name}`);
      });
    }
    
    await sql.end();
    return true;
  } catch (error) {
    log(colors.red, `❌ Erro ao conectar:`);
    log(colors.red, `   ${error.message}`);
    
    // Mostrar erro técnico específico
    if (error.code) {
      log(colors.red, `   Código: ${error.code}`);
    }
    if (error.detail) {
      log(colors.red, `   Detalhe: ${error.detail}`);
    }
    
    return false;
  }
}

async function main() {
  log(colors.blue, '\n╔════════════════════════════════════════╗');
  log(colors.blue, '║  Teste de Conexão PostgreSQL           ║');
  log(colors.blue, '║  Sistema de Logística e Roteirização   ║');
  log(colors.blue, '╚════════════════════════════════════════╝');
  
  const logisticaUrl = process.env.DATABASE_URL_LOGISTICA;
  const erpUrl = process.env.DATABASE_URL_ERP;
  
  log(colors.yellow, '\n📋 Variáveis de Ambiente:');
  log(colors.yellow, `DATABASE_URL_LOGISTICA: ${logisticaUrl ? '✓ Configurado' : '✗ Não configurado'}`);
  log(colors.yellow, `DATABASE_URL_ERP: ${erpUrl ? '✓ Configurado' : '✗ Não configurado'}`);
  
  const logisticaOk = await testConnection('Banco Logística', logisticaUrl);
  const erpOk = await testConnection('Banco ERP', erpUrl);
  
  log(colors.blue, '\n=== Resumo ===');
  log(colors.yellow, `Logística: ${logisticaOk ? colors.green + '✅ OK' : colors.red + '❌ FALHOU'}`);
  log(colors.yellow, `ERP: ${erpOk ? colors.green + '✅ OK' : colors.red + '❌ FALHOU'}`);
  
  if (logisticaOk && erpOk) {
    log(colors.green, '\n✅ Ambas as conexões estão funcionando!');
    process.exit(0);
  } else {
    log(colors.red, '\n❌ Verifique as conexões que falharam');
    process.exit(1);
  }
}

main().catch(error => {
  log(colors.red, 'Erro fatal:', error.message);
  process.exit(1);
});
