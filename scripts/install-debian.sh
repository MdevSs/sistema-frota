#!/bin/bash

# ============================================================================
# Script de Instalação Automática - Sistema de Logística
# Para Debian 11/12
# 
# Uso:
# chmod +x scripts/install-debian.sh
# ./scripts/install-debian.sh
# ============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Header
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Instalação - Sistema de Logística e Roteirização VUC     ║"
echo "║  Debian 11/12                                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Passo 1: Atualizar sistema
log_info "Passo 1: Atualizando sistema..."
sudo apt update
sudo apt upgrade -y
log_success "Sistema atualizado"

# Passo 2: Instalar Node.js
log_info "Passo 2: Instalando Node.js 20+..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    log_success "Node.js instalado: $(node --version)"
else
    log_warning "Node.js já está instalado: $(node --version)"
fi

# Passo 3: Instalar pnpm
log_info "Passo 3: Instalando pnpm..."
if ! command -v pnpm &> /dev/null; then
    sudo npm install -g pnpm
    log_success "pnpm instalado: $(pnpm --version)"
else
    log_warning "pnpm já está instalado: $(pnpm --version)"
fi

# Passo 4: Instalar Git
log_info "Passo 4: Instalando Git..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    log_success "Git instalado"
else
    log_warning "Git já está instalado"
fi

# Passo 5: Instalar cliente PostgreSQL
log_info "Passo 5: Instalando cliente PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql-client
    log_success "Cliente PostgreSQL instalado"
else
    log_warning "Cliente PostgreSQL já está instalado"
fi

# Passo 6: Instalar dependências do projeto
log_info "Passo 6: Instalando dependências do projeto..."
pnpm install
log_success "Dependências instaladas"

# Passo 7: Criar .env.local
log_info "Passo 7: Criando arquivo .env.local..."
if [ ! -f .env.local ]; then
    cat > .env.local << 'EOF'
# Banco de Dados
DATABASE_URL_LOGISTICA=postgresql://postgres:postgres@192.168.1.171:5432/logistica
DATABASE_URL_ERP=postgresql://postgres:postgres@192.168.1.17:5432/salutem

# Node
NODE_ENV=production
PORT=3000

# OAuth (deixar em branco para MVP sem autenticação)
VITE_APP_ID=
OAUTH_SERVER_URL=
VITE_OAUTH_PORTAL_URL=

# Owner
OWNER_OPEN_ID=
OWNER_NAME=

# APIs Manus (deixar em branco para MVP)
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=

# Aplicação
VITE_APP_TITLE="Sistema de Logística"
VITE_APP_ID=logistica-mvp
EOF
    log_success "Arquivo .env.local criado"
else
    log_warning "Arquivo .env.local já existe"
fi

# Passo 8: Testar conexão com PostgreSQL
log_info "Passo 8: Testando conexão com PostgreSQL..."
if psql -U postgres -d logistica -h 192.168.1.171 -p 5432 -c "SELECT 1" &> /dev/null; then
    log_success "Conexão com Banco Logística OK"
else
    log_warning "Não conseguiu conectar ao Banco Logística"
    log_info "Verifique se:"
    log_info "  - PostgreSQL está rodando em 192.168.1.171:5432"
    log_info "  - Banco 'logistica' existe"
    log_info "  - Usuário/senha estão corretos"
fi

# Passo 9: Executar migrations
log_info "Passo 9: Executando migrations..."
if psql -U postgres -d logistica -h 192.168.1.171 -f scripts/setup-postgres.sql &> /dev/null; then
    log_success "Migrations executadas"
else
    log_warning "Não conseguiu executar migrations"
    log_info "Execute manualmente:"
    log_info "  psql -U postgres -d logistica -h 192.168.1.171 -f scripts/setup-postgres.sql"
fi

# Passo 10: Build do projeto
log_info "Passo 10: Fazendo build do projeto..."
pnpm build
log_success "Build concluído"

# Resumo
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Instalação Concluída!                                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo ""
echo "1. Iniciar o servidor em desenvolvimento:"
echo "   ${BLUE}pnpm dev${NC}"
echo ""
echo "2. Ou iniciar em produção com PM2:"
echo "   ${BLUE}sudo npm install -g pm2${NC}"
echo "   ${BLUE}pm2 start \"pnpm start\" --name \"logistica\"${NC}"
echo ""
echo "3. Acessar o sistema:"
echo "   ${BLUE}http://localhost:3000${NC}"
echo ""
echo "4. Testar cadastro de motorista:"
echo "   - Clicar em 'Motoristas'"
echo "   - Clicar em 'Novo Motorista'"
echo "   - Preencher dados e cadastrar"
echo ""
echo -e "${YELLOW}Troubleshooting:${NC}"
echo ""
echo "Se tiver problemas de conexão com PostgreSQL:"
echo "   ${BLUE}node scripts/test-postgres-connection.mjs${NC}"
echo ""
echo "Para mais detalhes, consulte:"
echo "   ${BLUE}DEPLOY_DEBIAN.md${NC}"
echo ""
