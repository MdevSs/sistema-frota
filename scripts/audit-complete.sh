#!/bin/bash

# ============================================================================
# AUDITORIA COMPLETA DO SISTEMA DE LOGÍSTICA
# ============================================================================
# Este script deve ser executado no servidor Debian onde o projeto está rodando
# Ele diagnostica todos os problemas do cadastro de motorista

echo "================================"
echo "AUDITORIA COMPLETA DO SISTEMA"
echo "================================"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# 1. VERIFICAR BANCO LOGÍSTICA
# ============================================================================
echo -e "${BLUE}1. VERIFICANDO BANCO LOGÍSTICA${NC}"
echo "================================"

PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -c "\dt" > /tmp/tables_logistica.txt 2>&1

if grep -q "drivers" /tmp/tables_logistica.txt; then
    echo -e "${GREEN}✅ Banco Logística conectado${NC}"
    echo -e "${GREEN}✅ Tabela 'drivers' existe${NC}"
    
    # Verificar estrutura da tabela drivers
    echo ""
    echo "Estrutura da tabela drivers:"
    PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -c "\d drivers"
    
    # Contar motoristas
    COUNT=$(PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -t -c "SELECT COUNT(*) FROM drivers;")
    echo ""
    echo -e "Total de motoristas no banco: ${YELLOW}$COUNT${NC}"
else
    echo -e "${RED}❌ Banco Logística NÃO conectado ou tabela 'drivers' não existe${NC}"
    cat /tmp/tables_logistica.txt
fi

echo ""

# ============================================================================
# 2. VERIFICAR BANCO ERP
# ============================================================================
echo -e "${BLUE}2. VERIFICANDO BANCO ERP${NC}"
echo "================================"

PGPASSWORD=postgres psql -h 192.168.1.17 -U postgres -d salutem -c "SELECT 1" > /tmp/erp_test.txt 2>&1

if grep -q "1" /tmp/erp_test.txt; then
    echo -e "${GREEN}✅ Banco ERP conectado${NC}"
else
    echo -e "${RED}❌ Banco ERP NÃO conectado${NC}"
    cat /tmp/erp_test.txt
fi

echo ""

# ============================================================================
# 3. VERIFICAR VARIÁVEIS DE AMBIENTE
# ============================================================================
echo -e "${BLUE}3. VERIFICANDO VARIÁVEIS DE AMBIENTE${NC}"
echo "================================"

if [ -f .env ]; then
    echo -e "${GREEN}✅ Arquivo .env existe${NC}"
    echo ""
    echo "Variáveis de banco de dados:"
    grep -E "DATABASE_URL|DATABASE_URL_LOGISTICA|DATABASE_URL_ERP" .env || echo -e "${RED}❌ Nenhuma variável DATABASE_URL encontrada${NC}"
else
    echo -e "${RED}❌ Arquivo .env não encontrado${NC}"
fi

echo ""

# ============================================================================
# 4. VERIFICAR MIGRATIONS
# ============================================================================
echo -e "${BLUE}4. VERIFICANDO MIGRATIONS${NC}"
echo "================================"

if [ -d drizzle/migrations ]; then
    echo -e "${GREEN}✅ Diretório de migrations existe${NC}"
    echo ""
    echo "Migrations encontradas:"
    ls -la drizzle/migrations/
else
    echo -e "${RED}❌ Diretório de migrations não existe${NC}"
fi

echo ""

# ============================================================================
# 5. VERIFICAR SERVIDOR RODANDO
# ============================================================================
echo -e "${BLUE}5. VERIFICANDO SERVIDOR${NC}"
echo "================================"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor rodando em http://localhost:3000${NC}"
    
    # Testar health check
    echo ""
    echo "Testando /api/health:"
    curl -s http://localhost:3000/api/health | jq . || echo "Erro ao chamar /api/health"
else
    echo -e "${RED}❌ Servidor NÃO está respondendo em http://localhost:3000${NC}"
fi

echo ""

# ============================================================================
# 6. VERIFICAR LOGS DO SERVIDOR
# ============================================================================
echo -e "${BLUE}6. VERIFICANDO LOGS DO SERVIDOR${NC}"
echo "================================"

if [ -f .manus-logs/devserver.log ]; then
    echo "Últimas 20 linhas do log:"
    tail -20 .manus-logs/devserver.log
else
    echo "Arquivo de log não encontrado"
fi

echo ""

# ============================================================================
# 7. TESTAR CADASTRO DE MOTORISTA VIA API
# ============================================================================
echo -e "${BLUE}7. TESTANDO CADASTRO DE MOTORISTA VIA API${NC}"
echo "================================"

echo "Enviando requisição para criar motorista..."
echo ""

RESPONSE=$(curl -s -X POST http://localhost:3000/api/trpc/drivers.create \
  -H "Content-Type: application/json" \
  -d '{
    "json": {
      "nome": "Teste Auditoria",
      "cpf": "12345678901",
      "cnh": "12345678901234",
      "telefone": "11999999999",
      "email": "teste@example.com"
    }
  }')

echo "Resposta da API:"
echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"

echo ""

# ============================================================================
# 8. VERIFICAR DADOS NO BANCO
# ============================================================================
echo -e "${BLUE}8. VERIFICANDO DADOS NO BANCO${NC}"
echo "================================"

echo "Motoristas no banco:"
PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -c "SELECT id, nome, cpf, cnh, telefone, ativo, createdAt FROM drivers ORDER BY id DESC LIMIT 10;"

echo ""

# ============================================================================
# 9. RESUMO FINAL
# ============================================================================
echo -e "${BLUE}RESUMO FINAL${NC}"
echo "================================"
echo ""
echo "Se todos os itens acima estão com ✅, o sistema deve estar funcionando."
echo "Se houver ❌, verifique:"
echo ""
echo "1. Conexão com bancos PostgreSQL"
echo "2. Variáveis de ambiente (.env)"
echo "3. Migrations executadas"
echo "4. Servidor rodando (pnpm dev)"
echo "5. Logs de erro em .manus-logs/"
echo ""
