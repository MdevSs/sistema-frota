#!/usr/bin/env node

/**
 * Script para testar conexões com os dois bancos PostgreSQL
 * 
 * Uso: node scripts/test-connections.mjs
 */

import postgres from 'postgres';

const logisticaUrl = process.env.DATABASE_URL_LOGISTICA || 'postgresql://postgres:postgres@192.168.1.171:5432/logistica';
const erpUrl = process.env.DATABASE_URL_ERP || 'postgresql://postgres:postgres@192.168.1.17:5432/salutem';

async function testConnection(name, url) {
  console.log(`\n🔍 Testando ${name}...`);
  console.log(`   URL: ${url.substring(0, 50)}...`);
  
  try {
    const sql = postgres(url);
    const result = await sql`SELECT NOW() as current_time, version() as db_version`;
    
    console.log(`✅ ${name} conectado com sucesso!`);
    console.log(`   Hora do banco: ${result[0].current_time}`);
    console.log(`   Versão: ${result[0].db_version.substring(0, 50)}...`);
    
    await sql.end();
    return true;
  } catch (error) {
    console.error(`❌ Erro ao conectar ${name}:`);
    console.error(`   ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Teste de Conexões - Dois Bancos PostgreSQL');
  console.log('═══════════════════════════════════════════════════════');

  const logisticaOk = await testConnection('Banco Logística', logisticaUrl);
  const erpOk = await testConnection('Banco ERP', erpUrl);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Resultado Final');
  console.log('═══════════════════════════════════════════════════════');
  
  if (logisticaOk && erpOk) {
    console.log('✅ Ambos os bancos estão conectados e funcionando!');
    process.exit(0);
  } else if (logisticaOk) {
    console.log('⚠️  Banco Logística OK, mas ERP indisponível');
    process.exit(1);
  } else {
    console.log('❌ Nenhum banco disponível');
    process.exit(1);
  }
}

main().catch(console.error);
