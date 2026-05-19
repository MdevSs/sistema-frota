-- ============================================================================
-- MIGRATION: Criar tabelas do sistema de logística no banco LOGÍSTICA
-- ============================================================================
-- Banco: logistica (192.168.1.171:5432/logistica)
-- Data: 2026-05-19
-- ============================================================================

-- ============================================================================
-- 1. ENUMS (Tipos de dados)
-- ============================================================================

CREATE TYPE IF NOT EXISTS role AS ENUM ('user', 'admin', 'motorista');
CREATE TYPE IF NOT EXISTS modelo AS ENUM (
  'Hyundai HR',
  'Iveco Daily',
  'Fiat Ducato',
  'Mercedes Sprinter',
  'Renault Master',
  'Kia Bongo'
);
CREATE TYPE IF NOT EXISTS tipo_veiculo AS ENUM ('VUC', 'VAN', 'CAMINHAO');
CREATE TYPE IF NOT EXISTS status_rota AS ENUM ('planejada', 'em_rota', 'concluida', 'cancelada');
CREATE TYPE IF NOT EXISTS status_entrega AS ENUM ('pendente', 'em_rota', 'entregue', 'nao_entregue', 'devolvido');
CREATE TYPE IF NOT EXISTS status_historico AS ENUM ('pendente', 'em_rota', 'entregue', 'nao_entregue', 'devolvido');
CREATE TYPE IF NOT EXISTS tipo_notificacao AS ENUM ('saida_entrega', 'chegada_local', 'entrega_realizada');
CREATE TYPE IF NOT EXISTS status_notificacao AS ENUM ('pendente', 'enviado', 'entregue', 'erro');
CREATE TYPE IF NOT EXISTS tipo_config AS ENUM ('string', 'number', 'boolean', 'json');

-- ============================================================================
-- 2. TABELA DE USUÁRIOS (Autenticação)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  "loginMethod" VARCHAR(64),
  role role NOT NULL DEFAULT 'user',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "lastSignedIn" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_openid ON users("openId");

-- ============================================================================
-- 3. TABELA DE VEÍCULOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(8) NOT NULL UNIQUE,
  modelo modelo NOT NULL,
  tipo_veiculo tipo_veiculo NOT NULL DEFAULT 'VUC',
  "capacidadeKg" NUMERIC(10, 2) NOT NULL,
  "capacidadeM3" NUMERIC(10, 2) NOT NULL,
  altura NUMERIC(5, 2),
  largura NUMERIC(5, 2),
  comprimento NUMERIC(5, 2),
  peso NUMERIC(10, 2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_vehicles_ativo ON vehicles(ativo);

-- ============================================================================
-- 4. TABELA DE MOTORISTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(320),
  cnh VARCHAR(20) NOT NULL UNIQUE,
  "cnhValidade" TIMESTAMP NOT NULL,
  endereco VARCHAR(255) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  cep VARCHAR(9) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drivers_cpf ON drivers(cpf);
CREATE INDEX IF NOT EXISTS idx_drivers_cnh ON drivers(cnh);
CREATE INDEX IF NOT EXISTS idx_drivers_ativo ON drivers(ativo);

-- ============================================================================
-- 5. TABELA DE ROTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  "driverId" INTEGER NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
  "vehicleId" INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
  "dataRota" TIMESTAMP NOT NULL,
  status_rota status_rota NOT NULL DEFAULT 'planejada',
  "distanciaKm" NUMERIC(10, 2),
  "tempoEstimadoMinutos" INTEGER,
  "tempoRealMinutos" INTEGER,
  "horaInicio" TIMESTAMP,
  "horaFim" TIMESTAMP,
  observacoes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_driver ON routes("driverId");
CREATE INDEX IF NOT EXISTS idx_routes_vehicle ON routes("vehicleId");
CREATE INDEX IF NOT EXISTS idx_routes_data ON routes("dataRota");
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status_rota);

-- ============================================================================
-- 6. TABELA DE ENTREGAS (Paradas da rota)
-- ============================================================================

CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  "routeId" INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  "numeroPedido" INTEGER NOT NULL,
  "numeroNota" VARCHAR(20),
  "serieNota" VARCHAR(5),
  "chaveAcessoNFe" VARCHAR(44),
  "nomeCliente" VARCHAR(100) NOT NULL,
  "telefonecliente" VARCHAR(20),
  rua VARCHAR(100) NOT NULL,
  numero VARCHAR(20) NOT NULL,
  complemento VARCHAR(100),
  bairro VARCHAR(50) NOT NULL,
  cidade VARCHAR(50) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  cep VARCHAR(9) NOT NULL,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  sequencia INTEGER NOT NULL,
  status_entrega status_entrega NOT NULL DEFAULT 'pendente',
  "horaChegadaEstimada" TIMESTAMP,
  "horaChegadaReal" TIMESTAMP,
  "horaEntrega" TIMESTAMP,
  "fotoCanhotos" JSON,
  assinatura TEXT,
  observacoes TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_route ON deliveries("routeId");
CREATE INDEX IF NOT EXISTS idx_deliveries_numero_pedido ON deliveries("numeroPedido");
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status_entrega);

-- ============================================================================
-- 7. TABELA DE RASTREAMENTO GPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "gpsTracking" (
  id BIGSERIAL PRIMARY KEY,
  "routeId" INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  "driverId" INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  velocidade NUMERIC(5, 2),
  precisao NUMERIC(5, 2),
  "timestamp" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gpstracking_route ON "gpsTracking"("routeId");
CREATE INDEX IF NOT EXISTS idx_gpstracking_driver ON "gpsTracking"("driverId");
CREATE INDEX IF NOT EXISTS idx_gpstracking_timestamp ON "gpsTracking"("timestamp");

-- ============================================================================
-- 8. TABELA DE HISTÓRICO DE STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS "deliveryStatusHistory" (
  id SERIAL PRIMARY KEY,
  "deliveryId" INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  "statusAnterior" status_historico,
  "statusNovo" status_historico NOT NULL,
  motivo TEXT,
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_status_history_delivery ON "deliveryStatusHistory"("deliveryId");

-- ============================================================================
-- 9. TABELA DE ALERTAS DE DESVIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "routeDeviationAlerts" (
  id SERIAL PRIMARY KEY,
  "routeId" INTEGER NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  "deliveryId" INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
  "distanciaDesvioMetros" NUMERIC(10, 2) NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  "dataResolucao" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_deviation_alerts_route ON "routeDeviationAlerts"("routeId");

-- ============================================================================
-- 10. TABELA DE CONFIGURAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "systemConfig" (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo tipo_config NOT NULL DEFAULT 'string',
  descricao TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. TABELA DE MAPEAMENTO ERP
-- ============================================================================

CREATE TABLE IF NOT EXISTS "erpFieldMapping" (
  id SERIAL PRIMARY KEY,
  tabela VARCHAR(50) NOT NULL,
  "campoErp" VARCHAR(100) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 12. TABELA DE NOTIFICAÇÕES WHATSAPP
-- ============================================================================

CREATE TABLE IF NOT EXISTS "whatsappNotifications" (
  id SERIAL PRIMARY KEY,
  "deliveryId" INTEGER NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  telefone VARCHAR(20) NOT NULL,
  tipo tipo_notificacao NOT NULL,
  mensagem TEXT NOT NULL,
  status status_notificacao NOT NULL DEFAULT 'pendente',
  tentativas INTEGER NOT NULL DEFAULT 0,
  "erroMensagem" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_delivery ON "whatsappNotifications"("deliveryId");

-- ============================================================================
-- 13. TABELA DE RELATÓRIOS DE DESEMPENHO
-- ============================================================================

CREATE TABLE IF NOT EXISTS "performanceReports" (
  id SERIAL PRIMARY KEY,
  "dataRelatorio" TIMESTAMP NOT NULL,
  "driverId" INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  "vehicleId" INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
  "totalEntregas" INTEGER NOT NULL DEFAULT 0,
  "entregasRealizadas" INTEGER NOT NULL DEFAULT 0,
  "entregasNaoRealizadas" INTEGER NOT NULL DEFAULT 0,
  "taxaSucesso" NUMERIC(5, 2) DEFAULT 0,
  "distanciaPercorridaKm" NUMERIC(10, 2) DEFAULT 0,
  "tempoTotalMinutos" INTEGER DEFAULT 0,
  "tempoMedioEntregaMinutos" NUMERIC(10, 2) DEFAULT 0,
  pontualidade NUMERIC(5, 2) DEFAULT 0,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_reports_driver ON "performanceReports"("driverId");
CREATE INDEX IF NOT EXISTS idx_performance_reports_vehicle ON "performanceReports"("vehicleId");

-- ============================================================================
-- 14. TABELA DE LOGS DE OPERAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS "operationLogs" (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  descricao TEXT,
  "usuarioId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "entidadeId" INTEGER,
  "entidadeTipo" VARCHAR(50),
  "dadosAntes" JSON,
  "dadosDepois" JSON,
  erro TEXT,
  "stackTrace" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_operation_logs_tipo ON "operationLogs"(tipo);
CREATE INDEX IF NOT EXISTS idx_operation_logs_usuario ON "operationLogs"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_operation_logs_entidade ON "operationLogs"("entidadeId", "entidadeTipo");

-- ============================================================================
-- FINAL: Verificação
-- ============================================================================

-- Contar tabelas criadas
SELECT COUNT(*) as total_tables FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Listar todas as tabelas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
