-- ============================================================================
-- Script de Setup do PostgreSQL para Sistema de Logística
-- ============================================================================
-- 
-- Executar este script na VM 192.168.1.171 como usuário postgres:
--
-- psql -U postgres -f scripts/setup-postgres.sql
--
-- ============================================================================

-- 1. Criar banco de dados logistica (se não existir)
CREATE DATABASE IF NOT EXISTS logistica;

-- 2. Conectar ao banco logistica
\c logistica

-- 3. Criar tabela de motoristas
CREATE TABLE IF NOT EXISTS motoristas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    cnh VARCHAR(20) UNIQUE NOT NULL,
    telefone VARCHAR(11) NOT NULL,
    email VARCHAR(100),
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    cep VARCHAR(8),
    cnh_validade TIMESTAMP,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id SERIAL PRIMARY KEY,
    placa VARCHAR(10) UNIQUE NOT NULL,
    final_placa VARCHAR(1) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    vuc BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar tabela de rotas
CREATE TABLE IF NOT EXISTS rotas (
    id SERIAL PRIMARY KEY,
    motorista_id INTEGER NOT NULL REFERENCES motoristas(id),
    veiculo_id INTEGER NOT NULL REFERENCES veiculos(id),
    data_rota DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'planejada',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Criar tabela de entregas
CREATE TABLE IF NOT EXISTS entregas (
    id SERIAL PRIMARY KEY,
    rota_id INTEGER NOT NULL REFERENCES rotas(id),
    numero_pedido VARCHAR(50) NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    endereco_entrega VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_motoristas_cpf ON motoristas(cpf);
CREATE INDEX IF NOT EXISTS idx_motoristas_cnh ON motoristas(cnh);
CREATE INDEX IF NOT EXISTS idx_motoristas_ativo ON motoristas(ativo);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_veiculos_ativo ON veiculos(ativo);
CREATE INDEX IF NOT EXISTS idx_rotas_motorista ON rotas(motorista_id);
CREATE INDEX IF NOT EXISTS idx_rotas_veiculo ON rotas(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_rotas_data ON rotas(data_rota);
CREATE INDEX IF NOT EXISTS idx_entregas_rota ON entregas(rota_id);
CREATE INDEX IF NOT EXISTS idx_entregas_pedido ON entregas(numero_pedido);

-- 8. Verificar se as tabelas foram criadas
\dt

-- 9. Mostrar estrutura de cada tabela
\d motoristas
\d veiculos
\d rotas
\d entregas

-- ============================================================================
-- Comandos úteis para teste:
-- ============================================================================
--
-- Listar todos os motoristas:
-- SELECT * FROM motoristas;
--
-- Inserir motorista de teste:
-- INSERT INTO motoristas (nome, cpf, cnh, telefone) 
-- VALUES ('João Silva', '12345678901', '12345678901234', '11999999999');
--
-- Listar motoristas ativos:
-- SELECT id, nome, cpf, telefone FROM motoristas WHERE ativo = true;
--
-- Atualizar motorista:
-- UPDATE motoristas SET telefone = '11988888888' WHERE id = 1;
--
-- Inativar motorista:
-- UPDATE motoristas SET ativo = false WHERE id = 1;
--
-- Deletar motorista (cuidado!):
-- DELETE FROM motoristas WHERE id = 1;
--
-- ============================================================================
