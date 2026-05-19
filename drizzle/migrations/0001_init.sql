-- Create enums
CREATE TYPE "role" AS ENUM ('user', 'admin', 'motorista');
CREATE TYPE "modelo" AS ENUM ('Hyundai HR', 'Iveco Daily', 'Fiat Ducato', 'Mercedes Sprinter', 'Renault Master', 'Kia Bongo');
CREATE TYPE "tipo_veiculo" AS ENUM ('VUC', 'VAN', 'CAMINHAO');
CREATE TYPE "status_rota" AS ENUM ('planejada', 'em_rota', 'concluida', 'cancelada');
CREATE TYPE "status_entrega" AS ENUM ('pendente', 'em_rota', 'entregue', 'nao_entregue', 'devolvido');
CREATE TYPE "status_historico" AS ENUM ('pendente', 'em_rota', 'entregue', 'nao_entregue', 'devolvido');
CREATE TYPE "tipo_notificacao" AS ENUM ('saida_entrega', 'chegada_local', 'entrega_realizada');
CREATE TYPE "status_notificacao" AS ENUM ('pendente', 'enviado', 'entregue', 'erro');
CREATE TYPE "tipo_config" AS ENUM ('string', 'number', 'boolean', 'json');

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "openId" varchar(64) NOT NULL UNIQUE,
  "name" text,
  "email" varchar(320),
  "loginMethod" varchar(64),
  "role" "role" NOT NULL DEFAULT 'user',
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS "vehicles" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "placa" varchar(8) NOT NULL UNIQUE,
  "modelo" "modelo" NOT NULL,
  "tipo" "tipo_veiculo" NOT NULL DEFAULT 'VUC',
  "capacidadeKg" numeric(10, 2) NOT NULL,
  "capacidadeM3" numeric(10, 2) NOT NULL,
  "altura" numeric(5, 2),
  "largura" numeric(5, 2),
  "comprimento" numeric(5, 2),
  "peso" numeric(10, 2),
  "ativo" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS "drivers" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "userId" integer REFERENCES "users"("id"),
  "nome" varchar(100) NOT NULL,
  "cpf" varchar(11) NOT NULL UNIQUE,
  "telefone" varchar(20) NOT NULL,
  "email" varchar(320),
  "cnh" varchar(20) NOT NULL UNIQUE,
  "cnhValidade" timestamp NOT NULL,
  "endereco" varchar(255) NOT NULL,
  "cidade" varchar(100) NOT NULL,
  "estado" varchar(2) NOT NULL,
  "cep" varchar(9) NOT NULL,
  "ativo" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create routes table
CREATE TABLE IF NOT EXISTS "routes" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "driverId" integer NOT NULL REFERENCES "drivers"("id"),
  "vehicleId" integer NOT NULL REFERENCES "vehicles"("id"),
  "dataRota" timestamp NOT NULL,
  "status" "status_rota" NOT NULL DEFAULT 'planejada',
  "distanciaKm" numeric(10, 2),
  "tempoEstimadoMinutos" integer,
  "tempoRealMinutos" integer,
  "horaInicio" timestamp,
  "horaFim" timestamp,
  "observacoes" text,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS "deliveries" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "routeId" integer NOT NULL REFERENCES "routes"("id"),
  "numeroPedido" integer NOT NULL,
  "numeroNota" varchar(20),
  "serieNota" varchar(5),
  "chaveAcessoNFe" varchar(44),
  "nomeCliente" varchar(100) NOT NULL,
  "telefonecliente" varchar(20),
  "rua" varchar(100) NOT NULL,
  "numero" varchar(20) NOT NULL,
  "complemento" varchar(100),
  "bairro" varchar(50) NOT NULL,
  "cidade" varchar(50) NOT NULL,
  "estado" varchar(2) NOT NULL,
  "cep" varchar(9) NOT NULL,
  "latitude" numeric(10, 6),
  "longitude" numeric(10, 6),
  "sequencia" integer NOT NULL,
  "status" "status_entrega" NOT NULL DEFAULT 'pendente',
  "horaChegadaEstimada" timestamp,
  "horaChegadaReal" timestamp,
  "horaEntrega" timestamp,
  "fotoCanhotos" json,
  "assinatura" text,
  "observacoes" text,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create gpsTracking table
CREATE TABLE IF NOT EXISTS "gpsTracking" (
  "id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "routeId" integer NOT NULL REFERENCES "routes"("id"),
  "driverId" integer NOT NULL REFERENCES "drivers"("id"),
  "latitude" numeric(10, 6) NOT NULL,
  "longitude" numeric(10, 6) NOT NULL,
  "velocidade" numeric(5, 2),
  "precisao" numeric(5, 2),
  "timestamp" timestamp NOT NULL,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create deliveryStatusHistory table
CREATE TABLE IF NOT EXISTS "deliveryStatusHistory" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "deliveryId" integer NOT NULL REFERENCES "deliveries"("id"),
  "statusAnterior" "status_historico",
  "statusNovo" "status_historico" NOT NULL,
  "motivo" text,
  "latitude" numeric(10, 6),
  "longitude" numeric(10, 6),
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create routeDeviationAlerts table
CREATE TABLE IF NOT EXISTS "routeDeviationAlerts" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "routeId" integer NOT NULL REFERENCES "routes"("id"),
  "deliveryId" integer REFERENCES "deliveries"("id"),
  "distanciaDesvioMetros" numeric(10, 2) NOT NULL,
  "latitude" numeric(10, 6) NOT NULL,
  "longitude" numeric(10, 6) NOT NULL,
  "resolvido" boolean NOT NULL DEFAULT false,
  "dataResolucao" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create systemConfig table
CREATE TABLE IF NOT EXISTS "systemConfig" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "chave" varchar(100) NOT NULL UNIQUE,
  "valor" text NOT NULL,
  "tipo" "tipo_config" NOT NULL DEFAULT 'string',
  "descricao" text,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create erpFieldMapping table
CREATE TABLE IF NOT EXISTS "erpFieldMapping" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "tabela" varchar(50) NOT NULL,
  "campoErp" varchar(100) NOT NULL,
  "descricao" text,
  "tipo" varchar(50) NOT NULL,
  "ativo" boolean NOT NULL DEFAULT true,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create whatsappNotifications table
CREATE TABLE IF NOT EXISTS "whatsappNotifications" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "deliveryId" integer NOT NULL REFERENCES "deliveries"("id"),
  "telefone" varchar(20) NOT NULL,
  "tipo" "tipo_notificacao" NOT NULL,
  "mensagem" text NOT NULL,
  "status" "status_notificacao" NOT NULL DEFAULT 'pendente',
  "tentativas" integer NOT NULL DEFAULT 0,
  "erroMensagem" text,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create performanceReports table
CREATE TABLE IF NOT EXISTS "performanceReports" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "dataRelatorio" timestamp NOT NULL,
  "driverId" integer REFERENCES "drivers"("id"),
  "vehicleId" integer REFERENCES "vehicles"("id"),
  "totalEntregas" integer NOT NULL DEFAULT 0,
  "entregasRealizadas" integer NOT NULL DEFAULT 0,
  "entregasNaoRealizadas" integer NOT NULL DEFAULT 0,
  "taxaSucesso" numeric(5, 2) DEFAULT 0,
  "distanciaPercorridaKm" numeric(10, 2) DEFAULT 0,
  "tempoTotalMinutos" integer NOT NULL DEFAULT 0,
  "tempoMedioEntregaMinutos" numeric(10, 2) DEFAULT 0,
  "pontualidade" numeric(5, 2) DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create operationLogs table
CREATE TABLE IF NOT EXISTS "operationLogs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "tipo" varchar(50) NOT NULL,
  "descricao" text,
  "usuarioId" integer REFERENCES "users"("id"),
  "entidadeId" integer,
  "entidadeTipo" varchar(50),
  "dadosAntes" json,
  "dadosDepois" json,
  "erro" text,
  "stackTrace" text,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX "idx_drivers_ativo" ON "drivers"("ativo");
CREATE INDEX "idx_vehicles_ativo" ON "vehicles"("ativo");
CREATE INDEX "idx_routes_driverId" ON "routes"("driverId");
CREATE INDEX "idx_routes_vehicleId" ON "routes"("vehicleId");
CREATE INDEX "idx_routes_status" ON "routes"("status");
CREATE INDEX "idx_deliveries_routeId" ON "deliveries"("routeId");
CREATE INDEX "idx_deliveries_status" ON "deliveries"("status");
CREATE INDEX "idx_gpsTracking_routeId" ON "gpsTracking"("routeId");
CREATE INDEX "idx_gpsTracking_timestamp" ON "gpsTracking"("timestamp");
CREATE INDEX "idx_operationLogs_tipo" ON "operationLogs"("tipo");
CREATE INDEX "idx_operationLogs_createdAt" ON "operationLogs"("createdAt");
