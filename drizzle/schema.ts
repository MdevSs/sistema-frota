import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  numeric,
  boolean,
  json,
  bigint,
} from "drizzle-orm/pg-core";

// Enums
export const roleEnum = pgEnum("role", ["user", "admin", "motorista"]);
export const modeloEnum = pgEnum("modelo", [
  "Hyundai HR",
  "Iveco Daily",
  "Fiat Ducato",
  "Mercedes Sprinter",
  "Renault Master",
  "Kia Bongo",
]);
export const tipoVeiculoEnum = pgEnum("tipo_veiculo", ["VUC", "VAN", "CAMINHAO"]);
export const statusRotaEnum = pgEnum("status_rota", ["planejada", "em_rota", "concluida", "cancelada"]);
export const statusEntregaEnum = pgEnum("status_entrega", ["pendente", "em_rota", "entregue", "nao_entregue", "devolvido"]);
export const statusHistoricoEnum = pgEnum("status_historico", ["pendente", "em_rota", "entregue", "nao_entregue", "devolvido"]);
export const tipoNotificacaoEnum = pgEnum("tipo_notificacao", ["saida_entrega", "chegada_local", "entrega_realizada"]);
export const statusNotificacaoEnum = pgEnum("status_notificacao", ["pendente", "enviado", "entregue", "erro"]);
export const tipoConfigEnum = pgEnum("tipo_config", ["string", "number", "boolean", "json"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de veículos VUC
 */
export const vehicles = pgTable("vehicles", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  placa: varchar("placa", { length: 8 }).notNull().unique(),
  modelo: modeloEnum("modelo").notNull(),
  tipo: tipoVeiculoEnum("tipo_veiculo").default("VUC").notNull(),
  capacidadeKg: numeric("capacidadeKg", { precision: 10, scale: 2 }).notNull(),
  capacidadeM3: numeric("capacidadeM3", { precision: 10, scale: 2 }).notNull(),
  altura: numeric("altura", { precision: 5, scale: 2 }), // em metros
  largura: numeric("largura", { precision: 5, scale: 2 }), // em metros
  comprimento: numeric("comprimento", { precision: 5, scale: 2 }), // em metros
  peso: numeric("peso", { precision: 10, scale: 2 }), // peso do veículo vazio
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = typeof vehicles.$inferInsert;

/**
 * Tabela de motoristas
 * MVP: Campos de endereço são opcionais
 */
export const drivers = pgTable("drivers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").references(() => users.id),
  nome: varchar("nome", { length: 100 }).notNull(),
  cpf: varchar("cpf", { length: 11 }).notNull().unique(),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  email: varchar("email", { length: 320 }),
  cnh: varchar("cnh", { length: 20 }).notNull().unique(),
  cnhValidade: timestamp("cnhValidade"), // MVP: Opcional
  endereco: varchar("endereco", { length: 255 }), // MVP: Opcional
  cidade: varchar("cidade", { length: 100 }), // MVP: Opcional
  estado: varchar("estado", { length: 2 }), // MVP: Opcional
  cep: varchar("cep", { length: 9 }), // MVP: Opcional
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = typeof drivers.$inferInsert;

/**
 * Tabela de rotas de entrega
 */
export const routes = pgTable("routes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  dataRota: timestamp("dataRota").notNull(),
  motorista_id: integer("motorista_id").references(() => drivers.id),
  veiculo_id: integer("veiculo_id").references(() => vehicles.id),
  status: statusRotaEnum("status").default("planejada").notNull(),
  kmInicial: numeric("kmInicial", { precision: 10, scale: 2 }),
  kmFinal: numeric("kmFinal", { precision: 10, scale: 2 }),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Route = typeof routes.$inferSelect;
export type InsertRoute = typeof routes.$inferInsert;

/**
 * Tabela de pedidos de entrega (vinculados a rotas)
 */
export const deliveries = pgTable("deliveries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  rota_id: integer("rota_id").references(() => routes.id),
  numero_pedido: varchar("numero_pedido", { length: 50 }).notNull(),
  cliente: varchar("cliente", { length: 255 }),
  telefone: varchar("telefone", { length: 20 }),
  endereco: varchar("endereco", { length: 255 }),
  numero: varchar("numero", { length: 10 }),
  complemento: varchar("complemento", { length: 255 }),
  bairro: varchar("bairro", { length: 100 }),
  cidade: varchar("cidade", { length: 100 }),
  estado: varchar("estado", { length: 2 }),
  cep: varchar("cep", { length: 9 }),
  status: statusEntregaEnum("status").default("pendente").notNull(),
  chaveAcesso: varchar("chaveAcesso", { length: 50 }),
  tentativas: integer("tentativas").default(0).notNull(),
  observacoes: text("observacoes"),
  dataEntrega: timestamp("dataEntrega"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = typeof deliveries.$inferInsert;

/**
 * Tabela de fotos de canhoto
 */
export const proofPhotos = pgTable("proof_photos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entrega_id: integer("entrega_id").references(() => deliveries.id),
  url: varchar("url", { length: 500 }).notNull(),
  assinatura: text("assinatura"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProofPhoto = typeof proofPhotos.$inferSelect;
export type InsertProofPhoto = typeof proofPhotos.$inferInsert;

/**
 * Tabela de rastreamento GPS
 */
export const gpsTracking = pgTable("gps_tracking", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  rota_id: integer("rota_id").references(() => routes.id),
  motorista_id: integer("motorista_id").references(() => drivers.id),
  latitude: numeric("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: numeric("longitude", { precision: 11, scale: 8 }).notNull(),
  velocidade: numeric("velocidade", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ativo: boolean("ativo").default(true).notNull(),
});

export type GpsTracking = typeof gpsTracking.$inferSelect;
export type InsertGpsTracking = typeof gpsTracking.$inferInsert;

/**
 * Tabela de histórico de status de entregas
 */
export const deliveryStatusHistory = pgTable("delivery_status_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entrega_id: integer("entrega_id").references(() => deliveries.id),
  statusAnterior: statusHistoricoEnum("status_anterior"),
  statusNovo: statusHistoricoEnum("status_novo").notNull(),
  motivo: text("motivo"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ativo: boolean("ativo").default(true).notNull(),
});

export type DeliveryStatusHistory = typeof deliveryStatusHistory.$inferSelect;
export type InsertDeliveryStatusHistory = typeof deliveryStatusHistory.$inferInsert;

/**
 * Tabela de notificações WhatsApp
 */
export const whatsappNotifications = pgTable("whatsapp_notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  entrega_id: integer("entrega_id").references(() => deliveries.id),
  telefone: varchar("telefone", { length: 20 }).notNull(),
  tipo: tipoNotificacaoEnum("tipo").notNull(),
  mensagem: text("mensagem").notNull(),
  status: statusNotificacaoEnum("status").default("pendente").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ativo: boolean("ativo").default(true).notNull(),
});

export type WhatsappNotification = typeof whatsappNotifications.$inferSelect;
export type InsertWhatsappNotification = typeof whatsappNotifications.$inferInsert;

/**
 * Tabela de logs de operações
 */
export const operationLogs = pgTable("operation_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  metodo: varchar("metodo", { length: 10 }).notNull(),
  usuarioId: integer("usuarioId"),
  status: integer("status").notNull(),
  mensagem: text("mensagem"),
  erro: text("erro"),
  stackTrace: text("stackTrace"),
  parametros: json("parametros"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ativo: boolean("ativo").default(true).notNull(),
});

export type OperationLog = typeof operationLogs.$inferSelect;
export type InsertOperationLog = typeof operationLogs.$inferInsert;

/**
 * Tabela de configurações do sistema
 */
export const systemConfig = pgTable("system_config", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  chave: varchar("chave", { length: 100 }).notNull().unique(),
  valor: text("valor").notNull(),
  tipo: tipoConfigEnum("tipo").notNull(),
  descricao: text("descricao"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

/**
 * Tabela de relatórios de desempenho
 */
export const performanceReports = pgTable("performance_reports", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  motorista_id: integer("motorista_id").references(() => drivers.id),
  mes: varchar("mes", { length: 7 }).notNull(), // YYYY-MM
  totalRotas: integer("totalRotas").default(0).notNull(),
  totalEntregas: integer("totalEntregas").default(0).notNull(),
  entregasRealizadas: integer("entregasRealizadas").default(0).notNull(),
  entregasNaoRealizadas: integer("entregasNaoRealizadas").default(0).notNull(),
  kmTotal: numeric("kmTotal", { precision: 10, scale: 2 }).default('0').notNull(),
  tempoTotal: integer("tempoTotal").default(0).notNull(), // em minutos
  velocidadeMedia: numeric("velocidadeMedia", { precision: 5, scale: 2 }).default('0').notNull(),
  avaliacao: numeric("avaliacao", { precision: 3, scale: 1 }).default('0').notNull(), // 0 a 5
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceReport = typeof performanceReports.$inferSelect;
export type InsertPerformanceReport = typeof performanceReports.$inferInsert;
