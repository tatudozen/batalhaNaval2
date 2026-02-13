#!/bin/sh
set -e

# Limpar locks do Chrome/WhatsApp antes de iniciar
WHATSAPP_DIR="/app/backend/.wwebjs_auth/session-batalha-naval-bot"

if [ -d "$WHATSAPP_DIR" ]; then
  echo "🧹 Limpando locks do Chrome..."

  # Remover arquivos de lock
  find "$WHATSAPP_DIR" -name "SingletonLock" -type f -delete 2>/dev/null || true
  find "$WHATSAPP_DIR" -name "SingletonSocket" -type s -delete 2>/dev/null || true
  find "$WHATSAPP_DIR" -name "SingletonCookie" -type f -delete 2>/dev/null || true

  echo "✅ Locks removidos!"
fi

# Iniciar servidor
echo "🚀 Iniciando servidor..."
exec node server.js
