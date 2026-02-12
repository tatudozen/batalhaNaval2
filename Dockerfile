FROM node:24-slim

# Instalar dependências do Chrome/Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    gconf-service \
    libappindicator1 \
    libasound2 \
    libatk1.0-0 \
    libcairo2 \
    libcups2 \
    libfontconfig1 \
    libgbm-dev \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libicu-dev \
    libjpeg-dev \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpng-dev \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Definir Chromium como executável do Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY backend/package*.json ./backend/


# Instalar dependências do backend
WORKDIR /app/backend
RUN npm ci --only=production --silent

# Copiar código da aplicação
WORKDIR /app
COPY . .

# Criar diretórios necessários
RUN mkdir -p /app/backend/logs \
    && mkdir -p /app/data

# Expor porta
EXPOSE 3001

# Definir working directory
WORKDIR /app/backend

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/api/matches', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Comando para iniciar
CMD ["node", "server.js"]
