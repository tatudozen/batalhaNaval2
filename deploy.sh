#!/bin/bash

# Script de deploy para VPS
# Uso: ./deploy.sh usuario@ip-vps

set -e  # Para em caso de erro

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$1" ]; then
    echo -e "${RED}Erro: Informe o destino SSH${NC}"
    echo "Uso: ./deploy.sh usuario@ip-vps"
    exit 1
fi

VPS_TARGET=$1
PROJECT_NAME="batalhaNaval2"

echo -e "${GREEN}🚀 Iniciando deploy para ${VPS_TARGET}${NC}\n"

# Passo 1: Criar pacote
echo -e "${YELLOW}📦 Criando pacote...${NC}"
cd "$(dirname "$0")"
tar -czf ${PROJECT_NAME}.tar.gz \
    --exclude='node_modules' \
    --exclude='.wwebjs_auth' \
    --exclude='*.db' \
    --exclude='*.log' \
    --exclude='.git' \
    --exclude='deploy.sh' \
    .

echo -e "${GREEN}✓ Pacote criado: ${PROJECT_NAME}.tar.gz${NC}\n"

# Passo 2: Enviar para VPS
echo -e "${YELLOW}📤 Enviando arquivos para VPS...${NC}"
scp ${PROJECT_NAME}.tar.gz ${VPS_TARGET}:/home/$(echo ${VPS_TARGET} | cut -d'@' -f1)/

echo -e "${GREEN}✓ Arquivos enviados${NC}\n"

# Passo 3: Extrair e configurar na VPS
echo -e "${YELLOW}⚙️  Configurando na VPS...${NC}"
ssh ${VPS_TARGET} << 'ENDSSH'
    set -e
    cd ~

    # Backup se já existir
    if [ -d "batalhaNaval2" ]; then
        echo "📋 Fazendo backup..."
        timestamp=$(date +%Y%m%d_%H%M%S)
        cp -r batalhaNaval2 batalhaNaval2_backup_${timestamp}

        # Parar PM2 se estiver rodando
        pm2 stop batalha-naval 2>/dev/null || true
    fi

    # Extrair
    echo "📂 Extraindo arquivos..."
    tar -xzf batalhaNaval2.tar.gz -C ~/

    # Instalar dependências
    echo "📚 Instalando dependências..."
    cd ~/batalhaNaval2/backend
    npm install --production --silent

    # Criar diretório de logs
    mkdir -p logs

    # Criar .env se não existir
    if [ ! -f .env ]; then
        echo "📝 Criando arquivo .env..."
        cat > .env << 'EOF'
PORT=3001
NODE_ENV=production
BASE_URL=http://$(hostname -I | awk '{print $1}')
EOF
    fi

    # Iniciar/reiniciar com PM2
    echo "🔄 Iniciando aplicação..."
    pm2 delete batalha-naval 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save

    echo ""
    echo "✅ Deploy concluído!"
    echo ""
    pm2 status
ENDSSH

echo -e "\n${GREEN}✅ Deploy finalizado com sucesso!${NC}\n"

# Limpar arquivo temporário
rm ${PROJECT_NAME}.tar.gz

echo -e "${GREEN}🎮 Aplicação disponível em:${NC}"
VPS_IP=$(echo ${VPS_TARGET} | cut -d'@' -f2)
echo -e "   http://${VPS_IP}:3001"
echo -e "   http://${VPS_IP}:3001/chat.html"
echo -e "   http://${VPS_IP}:3001/posicionamento.html"
echo ""
echo -e "${YELLOW}📱 Para ver o QR Code do WhatsApp:${NC}"
echo -e "   ssh ${VPS_TARGET} 'pm2 logs batalha-naval'"
echo -e "   ou acesse: http://${VPS_IP}:3001/whatsapp-qr.png"
echo ""
