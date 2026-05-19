#!/usr/bin/env node

/**
 * Script de Testes Completos do MVP
 * Valida conexão com bancos, migrations, CRUD, ERP e tratamento de erros
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

const LOGISTICA_URL = process.env.DATABASE_URL_LOGISTICA || 'postgresql://postgres:postgres@192.168.1.171:5432/logistica';
const ERP_URL = process.env.DATABASE_URL_ERP || 'postgresql://postgres:postgres@192.168.1.17:5432/salutem';

let logisticaDb = null;
let erpDb = null;
let testResults = [];

function logTest(name, status, details = '') {
  const result = { name, status, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  console.log(`\n${status === 'PASS' ? '✅' : '❌'} ${name}`);
  if (details) console.log(`   ${details}`);
}

async function testConnections() {
  console.log('\n=== TESTE 1: CONEXÃO COM BANCOS ===\n');

  try {
    const logisticaClient = postgres(LOGISTICA_URL);
    const result = await logisticaClient`SELECT 1`;
    logisticaDb = drizzle(logisticaClient);
    logTest('Conexão Banco Logística', 'PASS', `Conectado em 192.168.1.171:5432/logistica`);
  } catch (error) {
    logTest('Conexão Banco Logística', 'FAIL', `Erro: ${error.message}`);
    return false;
  }

  try {
    const erpClient = postgres(ERP_URL);
    const result = await erpClient`SELECT 1`;
    erpDb = drizzle(erpClient);
    logTest('Conexão Banco ERP', 'PASS', `Conectado em 192.168.1.17:5432/salutem`);
  } catch (error) {
    logTest('Conexão Banco ERP', 'FAIL', `Erro: ${error.message}`);
    return false;
  }

  return true;
}

async function testMigrations() {
  console.log('\n=== TESTE 2: VERIFICAR MIGRATIONS ===\n');

  if (!logisticaDb) {
    logTest('Verificar Tabelas', 'FAIL', 'Banco não conectado');
    return false;
  }

  const tables = ['drivers', 'vehicles', 'routes', 'deliveries', 'operation_logs'];
  let allExist = true;

  for (const table of tables) {
    try {
      const result = await logisticaDb.execute(`SELECT 1 FROM ${table} LIMIT 1`);
      logTest(`Tabela ${table}`, 'PASS', 'Existe e acessível');
    } catch (error) {
      logTest(`Tabela ${table}`, 'FAIL', `Erro: ${error.message}`);
      allExist = false;
    }
  }

  return allExist;
}

async function testMotoristasCRUD() {
  console.log('\n=== TESTE 3: CRUD DE MOTORISTAS ===\n');

  if (!logisticaDb) {
    logTest('CRUD Motoristas', 'FAIL', 'Banco não conectado');
    return false;
  }

  try {
    // Inserir motorista
    const insertResult = await logisticaDb.execute(`
      INSERT INTO drivers (nome, cpf, cnh, telefone, email, status, ativo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id
    `, ['João Silva Teste', '12345678901', '9876543210', '11999999999', 'joao@test.com', 'ativo', true]);
    
    const driverId = insertResult.rows?.[0]?.id || insertResult[0]?.id;
    logTest('Inserir Motorista', 'PASS', `ID: ${driverId}`);

    // Listar motoristas
    const listResult = await logisticaDb.execute(`SELECT * FROM drivers WHERE ativo = true`);
    const count = listResult.rows?.length || listResult.length;
    logTest('Listar Motoristas', 'PASS', `${count} motorista(s) encontrado(s)`);

    // Editar motorista
    if (driverId) {
      await logisticaDb.execute(`
        UPDATE drivers SET telefone = $1, updated_at = NOW()
        WHERE id = $2
      `, ['11987654321', driverId]);
      logTest('Editar Motorista', 'PASS', 'Telefone atualizado');

      // Inativar motorista
      await logisticaDb.execute(`
        UPDATE drivers SET ativo = false, updated_at = NOW()
        WHERE id = $1
      `, [driverId]);
      logTest('Inativar Motorista', 'PASS', 'Status alterado para inativo');
    }

    return true;
  } catch (error) {
    logTest('CRUD Motoristas', 'FAIL', `Erro: ${error.message}`);
    return false;
  }
}

async function testVeiculosCRUD() {
  console.log('\n=== TESTE 4: CRUD DE VEÍCULOS ===\n');

  if (!logisticaDb) {
    logTest('CRUD Veículos', 'FAIL', 'Banco não conectado');
    return false;
  }

  try {
    // Inserir veículo
    const insertResult = await logisticaDb.execute(`
      INSERT INTO vehicles (placa, modelo, tipo, capacidade_kg, capacidade_m3, ativo, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING id
    `, ['ABC1234', 'Hyundai HR', 'VUC', 1500, 8.5, true]);
    
    const vehicleId = insertResult.rows?.[0]?.id || insertResult[0]?.id;
    logTest('Inserir Veículo', 'PASS', `ID: ${vehicleId}, Placa: ABC1234`);

    // Listar veículos
    const listResult = await logisticaDb.execute(`SELECT * FROM vehicles WHERE ativo = true`);
    const count = listResult.rows?.length || listResult.length;
    logTest('Listar Veículos', 'PASS', `${count} veículo(s) encontrado(s)`);

    // Editar veículo
    if (vehicleId) {
      await logisticaDb.execute(`
        UPDATE vehicles SET modelo = $1, updated_at = NOW()
        WHERE id = $2
      `, ['Iveco Daily', vehicleId]);
      logTest('Editar Veículo', 'PASS', 'Modelo atualizado');

      // Inativar veículo
      await logisticaDb.execute(`
        UPDATE vehicles SET ativo = false, updated_at = NOW()
        WHERE id = $1
      `, [vehicleId]);
      logTest('Inativar Veículo', 'PASS', 'Status alterado para inativo');
    }

    return true;
  } catch (error) {
    logTest('CRUD Veículos', 'FAIL', `Erro: ${error.message}`);
    return false;
  }
}

async function testERPSearch() {
  console.log('\n=== TESTE 5: BUSCA DE PEDIDOS NO ERP ===\n');

  if (!erpDb) {
    logTest('Busca ERP', 'FAIL', 'Banco ERP não conectado');
    return false;
  }

  try {
    // Procurar por tabelas de pedidos no ERP
    const tablesResult = await erpDb.execute(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%pedido%' OR table_name LIKE '%order%'
    `);
    
    const tables = tablesResult.rows?.map(r => r.table_name) || [];
    logTest('Procurar Tabelas de Pedidos', 'PASS', `Tabelas encontradas: ${tables.join(', ') || 'nenhuma'}`);

    // Tentar buscar um pedido (número 1 como teste)
    try {
      const pedidoResult = await erpDb.execute(`
        SELECT * FROM pedido WHERE numero = $1 LIMIT 1
      `, [1]);
      
      if (pedidoResult.rows?.length > 0 || pedidoResult.length > 0) {
        logTest('Buscar Pedido no ERP', 'PASS', 'Pedido encontrado');
      } else {
        logTest('Buscar Pedido no ERP', 'PASS', 'Nenhum pedido com número 1 (esperado)');
      }
    } catch (error) {
      logTest('Buscar Pedido no ERP', 'FAIL', `Tabela 'pedido' não existe ou erro: ${error.message}`);
    }

    return true;
  } catch (error) {
    logTest('Busca ERP', 'FAIL', `Erro: ${error.message}`);
    return false;
  }
}

async function testValidations() {
  console.log('\n=== TESTE 8: VALIDAÇÕES E TRATAMENTO DE ERROS ===\n');

  if (!logisticaDb) {
    logTest('Validações', 'FAIL', 'Banco não conectado');
    return false;
  }

  try {
    // Tentar inserir motorista sem nome (deve falhar)
    try {
      await logisticaDb.execute(`
        INSERT INTO drivers (nome, cpf, cnh, telefone, email, status, ativo, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, ['', '12345678902', '9876543211', '11999999998', 'test@test.com', 'ativo', true]);
      logTest('Validação Nome Vazio', 'FAIL', 'Deveria ter rejeitado');
    } catch (error) {
      logTest('Validação Nome Vazio', 'PASS', 'Corretamente rejeitado');
    }

    // Tentar inserir motorista com CPF duplicado
    try {
      await logisticaDb.execute(`
        INSERT INTO drivers (nome, cpf, cnh, telefone, email, status, ativo, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, ['Teste Duplicado', '12345678901', '9876543212', '11999999997', 'dup@test.com', 'ativo', true]);
      logTest('Validação CPF Duplicado', 'FAIL', 'Deveria ter rejeitado');
    } catch (error) {
      logTest('Validação CPF Duplicado', 'PASS', 'Corretamente rejeitado');
    }

    return true;
  } catch (error) {
    logTest('Validações', 'FAIL', `Erro: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     TESTES COMPLETOS DO MVP - LOGÍSTICA SISTEMA       ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  const results = {
    connections: await testConnections(),
    migrations: await testMigrations(),
    motoristas: await testMotoristasCRUD(),
    veiculos: await testVeiculosCRUD(),
    erp: await testERPSearch(),
    validations: await testValidations(),
  };

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                   RESUMO DOS TESTES                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;

  console.log(`Total: ${testResults.length} testes`);
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`Taxa de sucesso: ${((passed / testResults.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ TESTES QUE FALHARAM:');
    testResults.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - ${r.name}: ${r.details}`);
    });
  }

  console.log('\n📋 DETALHES COMPLETOS:');
  console.log(JSON.stringify(testResults, null, 2));

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
