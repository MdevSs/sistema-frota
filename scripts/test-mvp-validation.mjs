#!/usr/bin/env node

/**
 * Script de Validação Completa do MVP
 * Testa todos os endpoints com dados reais
 * 
 * Uso: node scripts/test-mvp-validation.mjs
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/trpc';
const HEADERS = {
  'Content-Type': 'application/json',
};

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n📝 ${name}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function callApi(endpoint, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: HEADERS,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}/${endpoint}`, options);
    const result = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data: result,
    };
  } catch (error) {
    logError(`Erro ao chamar ${endpoint}: ${error.message}`);
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testDrivers() {
  logTest('TESTE 1: CRUD de Motoristas');

  // 1.1 Cadastrar motorista
  logTest('1.1 Cadastrar motorista');
  const createDriverData = {
    nome: 'João Silva',
    cpf: '12345678901',
    cnh: '9876543210',
    cnhValidade: '2026-12-31',
    telefone: '11999999999',
    email: 'joao@example.com',
    endereco: 'Rua A, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01310100',
  };

  const createResult = await callApi('drivers.create', 'POST', createDriverData);
  if (createResult.ok) {
    logSuccess('Motorista cadastrado com sucesso');
  } else {
    logError(`Erro ao cadastrar: ${JSON.stringify(createResult.data)}`);
  }

  // 1.2 Listar motoristas
  logTest('1.2 Listar motoristas');
  const listResult = await callApi('drivers.list', 'GET');
  if (listResult.ok) {
    const drivers = listResult.data?.result?.data || [];
    logSuccess(`${drivers.length} motorista(s) encontrado(s)`);
  } else {
    logError(`Erro ao listar: ${JSON.stringify(listResult.data)}`);
  }

  // 1.3 Editar motorista
  if (listResult.ok && listResult.data?.result?.data?.length > 0) {
    const driverId = listResult.data.result.data[0].id;
    logTest('1.3 Editar motorista');
    const updateData = {
      id: driverId,
      nome: 'João Silva Atualizado',
      telefone: '11988888888',
    };
    const updateResult = await callApi('drivers.update', 'POST', updateData);
    if (updateResult.ok) {
      logSuccess('Motorista atualizado com sucesso');
    } else {
      logError(`Erro ao atualizar: ${JSON.stringify(updateResult.data)}`);
    }

    // 1.4 Inativar motorista
    logTest('1.4 Inativar motorista');
    const deactivateData = { id: driverId };
    const deactivateResult = await callApi('drivers.deactivate', 'POST', deactivateData);
    if (deactivateResult.ok) {
      logSuccess('Motorista inativado com sucesso');
    } else {
      logError(`Erro ao inativar: ${JSON.stringify(deactivateResult.data)}`);
    }
  }
}

async function testVehicles() {
  logTest('TESTE 2: CRUD de Veículos');

  // 2.1 Cadastrar veículo
  logTest('2.1 Cadastrar veículo');
  const createVehicleData = {
    placa: 'ABC1234',
    modelo: 'Hyundai HR',
    tipo: 'VUC',
    capacidadeKg: 1500,
    capacidadeM3: 8.5,
    anoFabricacao: 2024,
    finalPlaca: 4,
  };

  const createResult = await callApi('vehicles.create', 'POST', createVehicleData);
  if (createResult.ok) {
    logSuccess('Veículo cadastrado com sucesso');
  } else {
    logError(`Erro ao cadastrar: ${JSON.stringify(createResult.data)}`);
  }

  // 2.2 Listar veículos
  logTest('2.2 Listar veículos');
  const listResult = await callApi('vehicles.list', 'GET');
  if (listResult.ok) {
    const vehicles = listResult.data?.result?.data || [];
    logSuccess(`${vehicles.length} veículo(s) encontrado(s)`);
  } else {
    logError(`Erro ao listar: ${JSON.stringify(listResult.data)}`);
  }

  // 2.3 Editar veículo
  if (listResult.ok && listResult.data?.result?.data?.length > 0) {
    const vehicleId = listResult.data.result.data[0].id;
    logTest('2.3 Editar veículo');
    const updateData = {
      id: vehicleId,
      modelo: 'Hyundai HR Atualizado',
    };
    const updateResult = await callApi('vehicles.update', 'POST', updateData);
    if (updateResult.ok) {
      logSuccess('Veículo atualizado com sucesso');
    } else {
      logError(`Erro ao atualizar: ${JSON.stringify(updateResult.data)}`);
    }

    // 2.4 Inativar veículo
    logTest('2.4 Inativar veículo');
    const deactivateData = { id: vehicleId };
    const deactivateResult = await callApi('vehicles.deactivate', 'POST', deactivateData);
    if (deactivateResult.ok) {
      logSuccess('Veículo inativado com sucesso');
    } else {
      logError(`Erro ao inativar: ${JSON.stringify(deactivateResult.data)}`);
    }
  }
}

async function testERP() {
  logTest('TESTE 3: Busca de Pedidos no ERP');

  // 3.1 Buscar pedido por número
  logTest('3.1 Buscar pedido no ERP');
  const searchData = { numeroPedido: '1' };
  const searchResult = await callApi('erp.searchOrder', 'POST', searchData);
  if (searchResult.ok) {
    const order = searchResult.data?.result?.data;
    if (order) {
      logSuccess(`Pedido encontrado: ${order.numero || 'N/A'}`);
    } else {
      logWarning('Nenhum pedido encontrado');
    }
  } else {
    logError(`Erro ao buscar: ${JSON.stringify(searchResult.data)}`);
  }
}

async function testRoutes() {
  logTest('TESTE 4: Criação de Rotas');

  // 4.1 Criar rota
  logTest('4.1 Criar rota');
  const createRouteData = {
    dataRota: new Date().toISOString().split('T')[0],
    motorista_id: 'mvp-user',
    veiculo_id: 'mvp-vehicle',
    status: 'planejada',
    pedidos: ['1', '2', '3'],
  };

  const createResult = await callApi('routes.create', 'POST', createRouteData);
  if (createResult.ok) {
    logSuccess('Rota criada com sucesso');
  } else {
    logError(`Erro ao criar: ${JSON.stringify(createResult.data)}`);
  }

  // 4.2 Listar rotas
  logTest('4.2 Listar rotas');
  const listResult = await callApi('routes.list', 'GET');
  if (listResult.ok) {
    const routes = listResult.data?.result?.data || [];
    logSuccess(`${routes.length} rota(s) encontrada(s)`);
  } else {
    logError(`Erro ao listar: ${JSON.stringify(listResult.data)}`);
  }
}

async function testDashboard() {
  logTest('TESTE 5: Dashboard');

  logTest('5.1 Obter estatísticas');
  const statsResult = await callApi('dashboard.stats', 'GET');
  if (statsResult.ok) {
    const stats = statsResult.data?.result?.data;
    if (stats) {
      logSuccess(`Dashboard carregado:`);
      console.log(`  - Motoristas: ${stats.totalMotoristas || 0}`);
      console.log(`  - Veículos: ${stats.totalVeiculos || 0}`);
      console.log(`  - Rotas: ${stats.totalRotas || 0}`);
      console.log(`  - Entregas: ${stats.totalEntregas || 0}`);
      console.log(`  - Pendentes: ${stats.entregasPendentes || 0}`);
      console.log(`  - Concluídas: ${stats.entregasConcluidas || 0}`);
    } else {
      logWarning('Sem dados no dashboard');
    }
  } else {
    logError(`Erro ao carregar: ${JSON.stringify(statsResult.data)}`);
  }
}

async function testHealth() {
  logTest('TESTE 6: Health Check');

  logTest('6.1 Verificar status do sistema');
  const healthResult = await callApi('system.health', 'GET');
  if (healthResult.ok) {
    const health = healthResult.data?.result?.data;
    if (health) {
      logSuccess(`Sistema:`);
      console.log(`  - Backend: ${health.backend ? '✅ Online' : '❌ Offline'}`);
      console.log(`  - Banco Logística: ${health.logisticaDb ? '✅ Conectado' : '❌ Desconectado'}`);
      console.log(`  - Banco ERP: ${health.erpDb ? '✅ Conectado' : '❌ Desconectado'}`);
    }
  } else {
    logError(`Erro ao verificar: ${JSON.stringify(healthResult.data)}`);
  }
}

async function runAllTests() {
  log('\n🚀 INICIANDO TESTES DO MVP\n', 'blue');
  log('='.repeat(50), 'blue');

  try {
    await testHealth();
    await testDrivers();
    await testVehicles();
    await testERP();
    await testRoutes();
    await testDashboard();
  } catch (error) {
    logError(`Erro geral: ${error.message}`);
  }

  log('\n' + '='.repeat(50), 'blue');
  log('\n✅ TESTES CONCLUÍDOS\n', 'green');
}

runAllTests();
