# ⚡ Deploy Rápido - Batalha Naval

## Opção 1: Script Automático (Recomendado)

### 1. Preparar VPS (apenas primeira vez)
```bash
ssh usuario@seu-ip

# Instalar Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Dependências do Chrome (para WhatsApp)
sudo apt install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 \
  libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 \
  libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 \
  libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
  libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
  fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget libgbm-dev

# Liberar porta
sudo ufw allow 3001
sudo ufw enable
```

### 2. Fazer deploy (do seu Mac)
```bash
cd /Users/nando/Desktop/Playground/batalhaNaval2
./deploy.sh usuario@ip-da-vps
```

**Pronto!** 🎉

---

## Opção 2: Manual

### 1. Empacotar
```bash
cd /Users/nando/Desktop/Playground
tar -czf batalha.tar.gz \
  --exclude='node_modules' \
  --exclude='.wwebjs_auth' \
  --exclude='*.db' \
  batalhaNaval2/
```

### 2. Enviar
```bash
scp batalha.tar.gz usuario@ip-vps:/home/usuario/
```

### 3. Na VPS
```bash
tar -xzf batalha.tar.gz
cd batalhaNaval2/backend
npm install --production

# Criar .env
echo "PORT=3001" > .env
echo "NODE_ENV=production" >> .env
echo "BASE_URL=http://$(hostname -I | awk '{print $1}')" >> .env

# Iniciar
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
```

---

## Acessar aplicação

```
http://seu-ip:3001
http://seu-ip:3001/chat.html
http://seu-ip:3001/posicionamento.html
```

## Ver QR Code do WhatsApp

```bash
ssh usuario@ip-vps
pm2 logs batalha-naval
```

Ou acesse: `http://seu-ip:3001/whatsapp-qr.png`

---

## Comandos úteis

```bash
# Ver logs
ssh usuario@ip-vps 'pm2 logs batalha-naval'

# Reiniciar
ssh usuario@ip-vps 'pm2 restart batalha-naval'

# Atualizar (rodar deploy.sh novamente)
./deploy.sh usuario@ip-vps
```

---

## Com Nginx (opcional)

Para usar porta 80 (sem :3001 na URL):

```bash
# Na VPS
sudo apt install -y nginx

# Criar config
sudo nano /etc/nginx/sites-available/batalha

# Cole:
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar
sudo ln -s /etc/nginx/sites-available/batalha /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo ufw allow 80
```

Agora acesse: `http://seu-ip` (sem porta!)
