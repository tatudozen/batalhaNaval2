#!/bin/bash
set -e

# Script de build e push para GitHub Container Registry
# Uso: ./build-and-push.sh

echo "🚀 Iniciando build e push da imagem Docker..."

# Configurações
GITHUB_USER="tatudozen"
IMAGE_NAME="ghcr.io/${GITHUB_USER}/batalha-naval:latest"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando!"
    echo "Abra o Docker Desktop e tente novamente."
    exit 1
fi

# Verificar se existe token no arquivo .github-token
if [ ! -f ".github-token" ]; then
    echo "⚠️  Arquivo .github-token não encontrado!"
    echo ""
    echo "Crie o arquivo com seu token:"
    echo "  echo 'seu_token_aqui' > .github-token"
    echo ""
    exit 1
fi

# Ler token do arquivo
GITHUB_TOKEN=$(cat .github-token)

echo "📦 Building imagem: ${IMAGE_NAME}"
docker build --no-cache -t ${IMAGE_NAME} .

echo "🔐 Fazendo login no GitHub Container Registry..."
echo "${GITHUB_TOKEN}" | docker login ghcr.io -u ${GITHUB_USER} --password-stdin

echo "⬆️  Fazendo push da imagem..."
docker push ${IMAGE_NAME}

echo ""
echo "✅ Build e push concluídos com sucesso!"
echo ""
echo "📋 Próximos passos no Portainer:"
echo "  1. Services → batalha-naval → Update service"
echo "  2. Marcar: ☑ Re-pull image"
echo "  3. Marcar: ☑ Force update"
echo "  4. Clicar: Update"
echo ""
