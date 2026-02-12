#!/bin/bash

# Script para iniciar o servidor Batalha Naval
# Uso: ./start-server.sh

echo "🚀 Iniciando servidor Batalha Naval..."

# Usar o node do nvm se disponível, senão tentar node global
if [ -f ~/.nvm/nvm.sh ]; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

# Verificar se node está disponível
if ! command -v node &> /dev/null; then
  # Tentar caminho direto do nvm
  if [ -f ~/.nvm/versions/node/v22.17.0/bin/node ]; then
    NODE_PATH=~/.nvm/versions/node/v22.17.0/bin/node
  else
    echo "❌ Node.js não encontrado. Instale via: brew install node"
    exit 1
  fi
else
  NODE_PATH=$(which node)
fi

echo "📦 Node.js encontrado: $($NODE_PATH --version)"
echo "🌐 Servidor rodando em: http://localhost:3001"
echo ""
echo "🎮 URLs úteis:"
echo "   Chat simulado: http://localhost:3001/chat.html"
echo "   Criar partida: curl -X POST http://localhost:3001/api/matches"
echo ""
echo "⏹️  Para parar: Ctrl+C"
echo ""

cd "$(dirname "$0")/backend"
$NODE_PATH server.js
