-- ============================================================================
-- MIGRATION: Corrigir schema da tabela drivers para MVP
-- ============================================================================
-- Problema: Campos opcionais estavam marcados como NOT NULL
-- Solução: Alterar campos para permitir NULL conforme schema MVP
-- ============================================================================

-- 1. Remover constraint NOT NULL de cnhValidade
ALTER TABLE drivers 
ALTER COLUMN "cnhValidade" DROP NOT NULL;

-- 2. Remover constraint NOT NULL de endereco
ALTER TABLE drivers 
ALTER COLUMN endereco DROP NOT NULL;

-- 3. Remover constraint NOT NULL de cidade
ALTER TABLE drivers 
ALTER COLUMN cidade DROP NOT NULL;

-- 4. Remover constraint NOT NULL de estado
ALTER TABLE drivers 
ALTER COLUMN estado DROP NOT NULL;

-- 5. Remover constraint NOT NULL de cep
ALTER TABLE drivers 
ALTER COLUMN cep DROP NOT NULL;

-- ============================================================================
-- Verificação
-- ============================================================================
-- \d drivers

-- Esperado: cnhValidade, endereco, cidade, estado, cep devem ser nullable
