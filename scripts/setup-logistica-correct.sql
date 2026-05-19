-- ============================================================================
-- SETUP CORRETO DO BANCO LOGÍSTICA
-- ============================================================================
-- 
-- Executar este script no servidor Debian:
--
-- PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -f scripts/setup-logistica-correct.sql
--
-- ============================================================================

-- ============================================================================
-- 1. CRIAR ENUMS
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
-- 2. TABELA DE USUÁRIOS
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
-- 4. TABELA DE MOTORISTAS (MVP: Campos opcionais)
-- ============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(320),
  cnh VARCHAR(20) NOT NULL UNIQUE,
  "cnhValidade" TIMESTAMP,
  endereco VARCHAR(255),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(9),
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
  "dataRota" TIMESTAMP NOT NULL,
  motorista_id INTEGER REFERENCES drivers(id),
  veiculo_id INTEGER REFERENCES vehicles(id),
  status status_rota NOT NULL DEFAULT 'planejada',
  "kmInicial" NUMERIC(10, 2),
  "kmFinal" NUMERIC(10, 2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routes_motorista ON routes(motorista_id);
CREATE INDEX IF NOT EXISTS idx_routes_veiculo ON routes(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_routes_data ON routes("dataRota");
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);

-- ============================================================================
-- 6. TABELA DE ENTREGAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  rota_id INTEGER REFERENCES routes(id),
  numero_pedido VARCHAR(50) NOT NULL,
  cliente VARCHAR(255),
  telefone VARCHAR(20),
  endereco VARCHAR(255),
  numero VARCHAR(10),
  complemento VARCHAR(255),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(9),
  status status_entrega NOT NULL DEFAULT 'pendente',
  "chaveAcesso" VARCHAR(50),
  tentativas INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  "dataEntrega" TIMESTAMP,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_rota ON deliveries(rota_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_pedido ON deliveries(numero_pedido);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- ============================================================================
-- 7. TABELA DE FOTOS DE CANHOTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS proof_photos (
  id SERIAL PRIMARY KEY,
  entrega_id INTEGER REFERENCES deliveries(id),
  url VARCHAR(500) NOT NULL,
  assinatura TEXT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_photos_entrega ON proof_photos(entrega_id);

-- ============================================================================
-- 8. TABELA DE RASTREAMENTO GPS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gps_tracking (
  id SERIAL PRIMARY KEY,
  rota_id INTEGER REFERENCES routes(id),
  motorista_id INTEGER REFERENCES drivers(id),
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  velocidade NUMERIC(5, 2),
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_gps_tracking_rota ON gps_tracking(rota_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_motorista ON gps_tracking(motorista_id);
CREATE INDEX IF NOT EXISTS idx_gps_tracking_timestamp ON gps_tracking("timestamp");

-- ============================================================================
-- 9. TABELA DE HISTÓRICO DE STATUS DE ENTREGAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_status_history (
  id SERIAL PRIMARY KEY,
  entrega_id INTEGER REFERENCES deliveries(id),
  "statusAnterior" status_historico,
  "statusNovo" status_historico NOT NULL,
  motivo TEXT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_delivery_status_history_entrega ON delivery_status_history(entrega_id);

-- ============================================================================
-- 10. TABELA DE NOTIFICAÇÕES WHATSAPP
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id SERIAL PRIMARY KEY,
  entrega_id INTEGER REFERENCES deliveries(id),
  telefone VARCHAR(20) NOT NULL,
  tipo tipo_notificacao NOT NULL,
  mensagem TEXT NOT NULL,
  status status_notificacao NOT NULL DEFAULT 'pendente',
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_entrega ON whatsapp_notifications(entrega_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_notifications_status ON whatsapp_notifications(status);

-- ============================================================================
-- 11. TABELA DE LOGS DE OPERAÇÕES
-- ============================================================================

CREATE TABLE IF NOT EXISTS operation_logs (
  id SERIAL PRIMARY KEY,
  endpoint VARCHAR(255) NOT NULL,
  metodo VARCHAR(10) NOT NULL,
  "usuarioId" INTEGER,
  status INTEGER NOT NULL,
  mensagem TEXT,
  erro TEXT,
  "stackTrace" TEXT,
  parametros JSON,
  "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_operation_logs_endpoint ON operation_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_operation_logs_timestamp ON operation_logs("timestamp");

-- ============================================================================
-- 12. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
  id SERIAL PRIMARY KEY,
  chave VARCHAR(100) NOT NULL UNIQUE,
  valor TEXT NOT NULL,
  tipo tipo_config NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_config_chave ON system_config(chave);

-- ============================================================================
-- 13. TABELA DE RELATÓRIOS DE DESEMPENHO
-- ============================================================================

CREATE TABLE IF NOT EXISTS performance_reports (
  id SERIAL PRIMARY KEY,
  motorista_id INTEGER REFERENCES drivers(id),
  mes VARCHAR(7) NOT NULL,
  "totalRotas" INTEGER NOT NULL DEFAULT 0,
  "totalEntregas" INTEGER NOT NULL DEFAULT 0,
  "entregasRealizadas" INTEGER NOT NULL DEFAULT 0,
  "entregasNaoRealizadas" INTEGER NOT NULL DEFAULT 0,
  "kmTotal" NUMERIC(10, 2) NOT NULL DEFAULT 0,
  "tempoTotal" INTEGER NOT NULL DEFAULT 0,
  "velocidadeMedia" NUMERIC(5, 2) NOT NULL DEFAULT 0,
  avaliacao NUMERIC(3, 1) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_reports_motorista ON performance_reports(motorista_id);
CREATE INDEX IF NOT EXISTS idx_performance_reports_mes ON performance_reports(mes);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

\dt

-- ============================================================================
-- TESTES
-- ============================================================================

-- Listar motoristas
-- SELECT * FROM drivers;

-- Listar veículos
-- SELECT * FROM vehicles;

-- Listar rotas
-- SELECT * FROM routes;

-- Listar entregas
-- SELECT * FROM deliveries;

-- ============================================================================
-- FIM DO SETUP
-- ============================================================================
