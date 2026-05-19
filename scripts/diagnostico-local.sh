#!/bin/bash

# ============================================================================
# DIAGNÓSTICO COMPLETO DO SISTEMA DE LOGÍSTICA
# ============================================================================
# 
# Executar no servidor Debian onde o projeto está rodando:
#
# bash scripts/diagnostico-local.sh
#
# ============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para imprimir seção
print_section() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Função para verificar comando
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✅ $1 instalado${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 NÃO instalado${NC}"
        return 1
    fi
}

# Função para testar conexão PostgreSQL
test_postgres_connection() {
    local host=$1
    local port=$2
    local db=$3
    local user=$4
    local pass=$5
    
    PGPASSWORD=$pass psql -h $host -U $user -d $db -c "SELECT 1" > /dev/null 2>&1
    return $?
}

# ============================================================================
print_section "1. VERIFICANDO DEPENDÊNCIAS"
# ============================================================================

echo "Verificando Node.js:"
check_command node || echo -e "${YELLOW}⚠️  Node.js não encontrado${NC}"

echo ""
echo "Verificando pnpm:"
check_command pnpm || echo -e "${YELLOW}⚠️  pnpm não encontrado${NC}"

echo ""
echo "Verificando npm:"
check_command npm || echo -e "${YELLOW}⚠️  npm não encontrado${NC}"

echo ""
echo "Verificando git:"
check_command git || echo -e "${YELLOW}⚠️  git não encontrado${NC}"

echo ""
echo "Verificando psql (PostgreSQL client):"
check_command psql || echo -e "${YELLOW}⚠️  psql não encontrado - instale com: sudo apt-get install postgresql-client${NC}"

# ============================================================================
print_section "2. VERIFICANDO ARQUIVO .env"
# ============================================================================

if [ -f .env ]; then
    echo -e "${GREEN}✅ Arquivo .env existe${NC}"
    echo ""
    
    # Verificar DATABASE_URL_LOGISTICA
    if grep -q "DATABASE_URL_LOGISTICA" .env; then
        echo -e "${GREEN}✅ DATABASE_URL_LOGISTICA configurada${NC}"
        LOGISTICA_URL=$(grep "DATABASE_URL_LOGISTICA" .env | cut -d'=' -f2-)
        echo "   URL: $LOGISTICA_URL"
    else
        echo -e "${RED}❌ DATABASE_URL_LOGISTICA NÃO configurada${NC}"
    fi
    
    echo ""
    
    # Verificar DATABASE_URL_ERP
    if grep -q "DATABASE_URL_ERP" .env; then
        echo -e "${GREEN}✅ DATABASE_URL_ERP configurada${NC}"
        ERP_URL=$(grep "DATABASE_URL_ERP" .env | cut -d'=' -f2-)
        echo "   URL: $ERP_URL"
    else
        echo -e "${RED}❌ DATABASE_URL_ERP NÃO configurada${NC}"
    fi
    
    echo ""
    
    # Verificar se ainda existe DATABASE_URL (MySQL/TiDB antigo)
    if grep -q "^DATABASE_URL=" .env && ! grep -q "DATABASE_URL_LOGISTICA" .env; then
        echo -e "${YELLOW}⚠️  DATABASE_URL (MySQL/TiDB antigo) ainda existe${NC}"
        OLD_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2-)
        echo "   URL: $OLD_URL"
        echo -e "${YELLOW}   Remova esta linha e use DATABASE_URL_LOGISTICA${NC}"
    fi
else
    echo -e "${RED}❌ Arquivo .env NÃO encontrado${NC}"
    echo -e "${YELLOW}   Crie o arquivo .env com:${NC}"
    echo ""
    echo "DATABASE_URL_LOGISTICA=postgresql://postgres:postgres@192.168.1.171:5432/logistica"
    echo "DATABASE_URL_ERP=postgresql://postgres:postgres@192.168.1.17:5432/salutem"
fi

# ============================================================================
print_section "3. TESTANDO CONEXÃO COM BANCO LOGÍSTICA"
# ============================================================================

if test_postgres_connection "192.168.1.171" "5432" "logistica" "postgres" "postgres"; then
    echo -e "${GREEN}✅ Conexão com banco Logística OK${NC}"
    
    # Verificar se tabela drivers existe
    DRIVERS_COUNT=$(PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='drivers';" 2>/dev/null)
    
    if [ "$DRIVERS_COUNT" -gt 0 ]; then
        echo -e "${GREEN}✅ Tabela 'drivers' existe${NC}"
        
        # Contar motoristas
        DRIVER_COUNT=$(PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -t -c "SELECT COUNT(*) FROM drivers;" 2>/dev/null)
        echo "   Total de motoristas: $DRIVER_COUNT"
        
        # Mostrar estrutura
        echo ""
        echo "Estrutura da tabela drivers:"
        PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -c "\d drivers" 2>/dev/null | head -20
    else
        echo -e "${RED}❌ Tabela 'drivers' NÃO existe${NC}"
        echo -e "${YELLOW}   Execute: PGPASSWORD=postgres psql -h 192.168.1.171 -U postgres -d logistica -f scripts/setup-logistica-correct.sql${NC}"
    fi
else
    echo -e "${RED}❌ Conexão com banco Logística FALHOU${NC}"
    echo -e "${YELLOW}   Verifique:${NC}"
    echo "   - Host: 192.168.1.171"
    echo "   - Porta: 5432"
    echo "   - Database: logistica"
    echo "   - User: postgres"
    echo "   - Password: postgres"
fi

# ============================================================================
print_section "4. TESTANDO CONEXÃO COM BANCO ERP"
# ============================================================================

if test_postgres_connection "192.168.1.17" "5432" "salutem" "postgres" "postgres"; then
    echo -e "${GREEN}✅ Conexão com banco ERP OK${NC}"
else
    echo -e "${YELLOW}⚠️  Conexão com banco ERP FALHOU${NC}"
    echo "   (Isso é OK se o ERP não estiver disponível agora)"
fi

# ============================================================================
print_section "5. VERIFICANDO PROJETO"
# ============================================================================

if [ -f package.json ]; then
    echo -e "${GREEN}✅ package.json existe${NC}"
    
    # Verificar se mysql2 está instalado (não deveria estar)
    if grep -q "mysql2" package.json; then
        echo -e "${RED}❌ mysql2 ainda está em package.json${NC}"
        echo -e "${YELLOW}   Execute: npm remove mysql2${NC}"
    else
        echo -e "${GREEN}✅ mysql2 não está em package.json${NC}"
    fi
    
    # Verificar se postgres está instalado
    if grep -q "postgres" package.json; then
        echo -e "${GREEN}✅ postgres está em package.json${NC}"
    else
        echo -e "${RED}❌ postgres NÃO está em package.json${NC}"
    fi
    
    # Verificar se drizzle-orm está instalado
    if grep -q "drizzle-orm" package.json; then
        echo -e "${GREEN}✅ drizzle-orm está em package.json${NC}"
    else
        echo -e "${RED}❌ drizzle-orm NÃO está em package.json${NC}"
    fi
else
    echo -e "${RED}❌ package.json não encontrado${NC}"
fi

# ============================================================================
print_section "6. VERIFICANDO CONFIGURAÇÃO DRIZZLE"
# ============================================================================

if [ -f drizzle.config.ts ]; then
    echo -e "${GREEN}✅ drizzle.config.ts existe${NC}"
    
    if grep -q "dialect.*postgresql" drizzle.config.ts; then
        echo -e "${GREEN}✅ Configurado para PostgreSQL${NC}"
    elif grep -q "dialect.*mysql" drizzle.config.ts; then
        echo -e "${RED}❌ Ainda configurado para MySQL${NC}"
        echo -e "${YELLOW}   Corrija: altere 'dialect: \"mysql\"' para 'dialect: \"postgresql\"'${NC}"
    else
        echo -e "${YELLOW}⚠️  Dialeto não identificado${NC}"
    fi
else
    echo -e "${RED}❌ drizzle.config.ts não encontrado${NC}"
fi

# ============================================================================
print_section "7. VERIFICANDO SERVIDOR"
# ============================================================================

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor rodando em http://localhost:3000${NC}"
    
    # Testar health check
    echo ""
    echo "Testando /api/health:"
    HEALTH=$(curl -s http://localhost:3000/api/health)
    echo "$HEALTH" | jq . 2>/dev/null || echo "$HEALTH"
else
    echo -e "${YELLOW}⚠️  Servidor NÃO está respondendo em http://localhost:3000${NC}"
    echo -e "${YELLOW}   Inicie com: pnpm dev${NC}"
fi

# ============================================================================
print_section "8. VERIFICANDO LOGS"
# ============================================================================

if [ -d .manus-logs ]; then
    echo -e "${GREEN}✅ Diretório de logs existe${NC}"
    
    if [ -f .manus-logs/devserver.log ]; then
        echo ""
        echo "Últimas 20 linhas do log:"
        tail -20 .manus-logs/devserver.log
    else
        echo -e "${YELLOW}⚠️  Arquivo devserver.log não encontrado${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Diretório .manus-logs não encontrado${NC}"
fi

# ============================================================================
print_section "9. RESUMO FINAL"
# ============================================================================

echo "Checklist:"
echo ""
echo "[ ] Node.js instalado"
echo "[ ] pnpm instalado"
echo "[ ] Arquivo .env com DATABASE_URL_LOGISTICA"
echo "[ ] Arquivo .env com DATABASE_URL_ERP"
echo "[ ] Conexão com banco Logística OK"
echo "[ ] Tabela drivers existe"
echo "[ ] drizzle.config.ts configurado para PostgreSQL"
echo "[ ] Servidor rodando em http://localhost:3000"
echo "[ ] /api/health retorna status OK"
echo ""
echo -e "${CYAN}Se todos os itens acima estão OK, o sistema deve funcionar!${NC}"
echo ""
