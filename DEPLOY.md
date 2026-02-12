# 🚀 Guia de Deploy - Batalha Naval VPS

## Pré-requisitos
- VPS com Ubuntu/Debian (mínimo 1GB RAM)
- Acesso SSH
- Domínio (opcional, mas recomendado)

---

## 📦 Passo 1: Preparar VPS

### 1.1 Conectar na VPS
```bash
ssh usuario@seu-ip-vps
```

### 1.2 Atualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Instalar Node.js (v24.x)
```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Verificar instalação
```

### 1.4 Instalar PM2 (gerenciador de processos)
```bash
sudo npm install -g pm2
```

### 1.5 Instalar dependências do Chrome (para WhatsApp)
```bash
sudo apt install -y \
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 \
  libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 \
  libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 \
  libxrender1 libxss1 libxtst6 ca-certificates \
  fonts-liberation libappindicator1 libnss3 lsb-release \
  xdg-utils wget libgbm-dev
```

### 1.6 Instalar Nginx (reverse proxy)
```bash
sudo apt install -y nginx
```

---

## 📂 Passo 2: Transferir arquivos

### 2.1 No seu Mac, criar arquivo .tar.gz
```bash
cd /Users/nando/Desktop/Playground
tar -czf batalhaNaval2.tar.gz \
  --exclude='node_modules' \
  --exclude='.wwebjs_auth' \
  --exclude='*.db' \
  --exclude='*.log' \
  batalhaNaval2/
```

### 2.2 Enviar para VPS
```bash
scp batalhaNaval2.tar.gz usuario@seu-ip-vps:/home/usuario/
```

### 2.3 Na VPS, extrair arquivos
```bash
cd /home/usuario
tar -xzf batalhaNaval2.tar.gz
cd batalhaNaval2/backend
```

---

## ⚙️ Passo 3: Configurar aplicação

### 3.1 Instalar dependências
```bash
cd /home/usuario/batalhaNaval2/backend
npm install --production
```

### 3.2 Criar arquivo .env
```bash
nano .env
```

Cole o conteúdo:
```env
PORT=3001
NODE_ENV=production
BASE_URL=http://seu-ip-ou-dominio
```

Salve: `Ctrl+O`, `Enter`, `Ctrl+X`

### 3.3 Criar diretório de logs
```bash
mkdir -p logs
```

### 3.4 Testar se funciona
```bash
node server.js
```

Abra no navegador: `http://seu-ip:3001`

Se funcionar, pare com `Ctrl+C`

---

## 🔄 Passo 4: Configurar PM2

### 4.1 Iniciar aplicação com PM2
```bash
cd /home/usuario/batalhaNaval2/backend
pm2 start ecosystem.config.js
```

### 4.2 Configurar PM2 para iniciar no boot
```bash
pm2 startup
# Copie e execute o comando que aparecer

pm2 save
```

### 4.3 Verificar status
```bash
pm2 status
pm2 logs batalha-naval --lines 50
```

---

## 🌐 Passo 5: Configurar Nginx (Reverse Proxy)

### 5.1 Criar configuração do Nginx
```bash
sudo nano /etc/nginx/sites-available/batalha-naval
```

Cole:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # ou substitua pelo IP

    # Aumentar limite de upload
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeout maior para WhatsApp
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
}
```

### 5.2 Ativar site
```bash
sudo ln -s /etc/nginx/sites-available/batalha-naval /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

### 5.3 Abrir firewall
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 🔒 Passo 6: Configurar SSL (HTTPS) - Opcional mas recomendado

### 6.1 Instalar Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Obter certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com
```

### 6.3 Configurar renovação automática
```bash
sudo certbot renew --dry-run
```

---

## 📱 Passo 7: Conectar WhatsApp

### 7.1 Ver logs e aguardar QR Code
```bash
pm2 logs batalha-naval
```

### 7.2 Acessar QR Code via navegador
Abra: `http://seu-dominio.com/whatsapp-qr.png`

### 7.3 Escanear com WhatsApp
- Abra WhatsApp no celular
- Aparelhos conectados → Conectar aparelho
- Escaneie o QR code

---

## 🧪 Passo 8: Testar

### 8.1 Acessar aplicação
```
http://seu-dominio.com
http://seu-dominio.com/chat.html
http://seu-dominio.com/posicionamento.html
```

### 8.2 Testar WhatsApp
Envie mensagem: `/criar`

---

## 📊 Comandos úteis PM2

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs batalha-naval

# Reiniciar
pm2 restart batalha-naval

# Parar
pm2 stop batalha-naval

# Remover
pm2 delete batalha-naval

# Monitorar recursos
pm2 monit
```

---

## 🐛 Troubleshooting

### Erro: "EADDRINUSE"
```bash
# Ver processo na porta 3001
sudo lsof -i :3001
# Matar processo
sudo kill -9 PID
```

### WhatsApp não conecta
```bash
# Limpar sessão
rm -rf /home/usuario/batalhaNaval2/backend/.wwebjs_auth
pm2 restart batalha-naval
```

### Banco de dados corrompido
```bash
# Backup e resetar
cd /home/usuario/batalhaNaval2
mv game.db game.db.bak
pm2 restart batalha-naval
```

### Nginx não funciona
```bash
# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Verificar sintaxe
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx
```

---

## 🔧 Atualizar aplicação

```bash
# No Mac, criar novo pacote
cd /Users/nando/Desktop/Playground
tar -czf batalhaNaval2-update.tar.gz \
  --exclude='node_modules' \
  --exclude='.wwebjs_auth' \
  --exclude='*.db' \
  batalhaNaval2/

# Enviar para VPS
scp batalhaNaval2-update.tar.gz usuario@seu-ip:/home/usuario/

# Na VPS
cd /home/usuario
pm2 stop batalha-naval
tar -xzf batalhaNaval2-update.tar.gz
cd batalhaNaval2/backend
npm install --production
pm2 restart batalha-naval
```

---

## 📝 Checklist final

- [ ] VPS preparada com Node.js 24.x
- [ ] Arquivos transferidos e extraídos
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` criado com BASE_URL correto
- [ ] PM2 configurado e rodando
- [ ] Nginx configurado como reverse proxy
- [ ] Firewall liberado (portas 80 e 443)
- [ ] SSL configurado (se usando domínio)
- [ ] WhatsApp conectado via QR code
- [ ] Testes realizados com sucesso

---

## 🎯 URLs importantes após deploy

- **Frontend:** http://seu-dominio.com
- **Chat simulado:** http://seu-dominio.com/chat.html
- **Posicionamento:** http://seu-dominio.com/posicionamento.html
- **QR Code WhatsApp:** http://seu-dominio.com/whatsapp-qr.png
- **API:** http://seu-dominio.com/api/

---

**Dica:** Use um domínio para facilitar! Você pode usar serviços gratuitos como:
- No-IP (DDNS gratuito)
- DuckDNS
- Ou comprar um domínio barato em Registro.br (~R$40/ano)
