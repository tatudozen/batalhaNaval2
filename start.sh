#!/bin/bash

# Script simplificado para iniciar o servidor
# Uso: ./start.sh

echo "🚀 Iniciando Batalha Naval..."
echo ""

cd "$(dirname "$0")/backend"

# Usar Node.js v24 diretamente
/Users/nando/.nvm/versions/node/v24.13.1/bin/node server.js
