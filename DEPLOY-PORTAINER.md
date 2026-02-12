# 🐳 Deploy com Portainer + Traefik

Guia completo para deploy usando Docker, Portainer e Traefik com SSL automático.

---

## 📋 Pré-requisitos

- ✅ VPS com Docker instalado
- ✅ Portainer instalado e rodando
- ✅ Traefik configurado com Let's Encrypt
- ✅ Domínio apontando para o IP da VPS
- ✅ Conta no GitHub

---

## 🚀 Passo a Passo

### **Passo 1: Criar repositório no GitHub**

#### 1.1 No seu Mac
```bash
cd /Users/nando/Desktop/Playground/batalhaNaval2

# Inicializar Git (se ainda não for um repo)
git init

# Adicionar arquivos
git add .

# Commit inicial
git commit -m "Initial commit - Batalha Naval"
```

#### 1.2 Criar repositório no GitHub
1. Acesse: https://github.com/new
2. Nome: `batalha-naval` (ou o nome que preferir)
3. Visibilidade: **Private** ou **Public**
4. **NÃO** marque "Add README" (já temos arquivos)
5. Clique em **Create repository**

#### 1.3 Enviar código
```bash
# Adicionar remote (substitua SEU-USUARIO)
git remote add origin https://github.com/SEU-USUARIO/batalha-naval.git

# Enviar para GitHub
git branch -M main
git push -u origin main
```

✅ **Código agora está no GitHub!**

---

### **Passo 2: Configurar GitHub Container Registry (opcional)**

Se quiser usar GitHub para hospedar a imagem Docker:

#### 2.1 Criar Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Marcar permissões:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`
4. Copiar token (guarde em local seguro!)

#### 2.2 Build e Push da imagem
```bash
cd /Users/nando/Desktop/Playground/batalhaNaval2

# Login no GitHub Container Registry
echo "SEU_TOKEN" | docker login ghcr.io -u SEU-USUARIO --password-stdin

# Build da imagem
docker build -t ghcr.io/SEU-USUARIO/batalha-naval:latest .

# Push para registry
docker push ghcr.io/SEU-USUARIO/batalha-naval:latest
```

---

### **Passo 3: Deploy via Portainer**

#### Opção A: Deploy via Git Repository (Recomendado)

1. **Acesse Portainer:** `https://portainer.seu-dominio.com`

2. **Vá em:** `Stacks` → `+ Add stack`

3. **Preencha:**
   - **Name:** `batalha-naval`
   - **Build method:** Git Repository
   - **Repository URL:** `https://github.com/SEU-USUARIO/batalha-naval`
   - **Repository reference:** `refs/heads/main`
   - **Compose path:** `docker-compose.yml`

4. **Environment variables:**
   ```
   GITHUB_USERNAME=SEU-USUARIO
   DOMAIN=batalha.seu-dominio.com
   ```

5. **Clique em:** `Deploy the stack`

#### Opção B: Deploy via Web editor

1. **Acesse Portainer:** `https://portainer.seu-dominio.com`

2. **Vá em:** `Stacks` → `+ Add stack`

3. **Preencha:**
   - **Name:** `batalha-naval`
   - **Build method:** Web editor

4. **Cole o docker-compose.yml** (copie o conteúdo do arquivo)

5. **Environment variables:**
   ```
   GITHUB_USERNAME=SEU-USUARIO
   DOMAIN=batalha.seu-dominio.com
   ```

6. **Clique em:** `Deploy the stack`

---

### **Passo 4: Configurar DNS**

Adicione um registro A no seu provedor de DNS:

```
Tipo: A
Host: batalha (ou @ para root domain)
Value: IP-DA-SUA-VPS
TTL: 3600
```

Aguarde propagação (pode levar alguns minutos).

---

### **Passo 5: Conectar WhatsApp**

#### 5.1 Ver logs no Portainer
1. **Portainer** → **Stacks** → `batalha-naval`
2. Clique no container `batalha-naval`
3. Vá em **Logs**
4. Aguarde aparecer o QR Code no log

#### 5.2 Ou acesse via navegador
```
https://batalha.seu-dominio.com/whatsapp-qr.png
```

#### 5.3 Escanear QR Code
1. Abra WhatsApp no celular
2. Configurações → Aparelhos conectados
3. Conectar aparelho
4. Escaneie o QR code

✅ **WhatsApp conectado!**

---

## 🎮 Acessar aplicação

Após deploy bem-sucedido:

- **Frontend:** `https://batalha.seu-dominio.com`
- **Chat simulado:** `https://batalha.seu-dominio.com/chat.html`
- **Posicionamento:** `https://batalha.seu-dominio.com/posicionamento.html`
- **QR WhatsApp:** `https://batalha.seu-dominio.com/whatsapp-qr.png`

---

## 🔄 Atualizar aplicação

### Método 1: Via Git (automático)

```bash
# No seu Mac, faça alterações e commit
git add .
git commit -m "Descrição das alterações"
git push

# No Portainer:
# Stacks → batalha-naval → ⟳ Update the stack → Pull latest image
```

### Método 2: Rebuild manual

```bash
# No seu Mac
docker build -t ghcr.io/SEU-USUARIO/batalha-naval:latest .
docker push ghcr.io/SEU-USUARIO/batalha-naval:latest

# No Portainer:
# Stacks → batalha-naval → ⟳ Update the stack → Re-pull and redeploy
```

---

## 📊 Monitoramento no Portainer

### Ver logs em tempo real
1. **Portainer** → **Containers** → `batalha-naval`
2. **Logs** → ative "Auto-refresh"

### Ver estatísticas
1. **Portainer** → **Containers** → `batalha-naval`
2. **Stats** (CPU, memória, rede)

### Reiniciar container
1. **Portainer** → **Containers** → `batalha-naval`
2. **⟳ Restart**

---

## 🐛 Troubleshooting

### Container não inicia
```bash
# Ver logs
Portainer → Containers → batalha-naval → Logs

# Verificar se a rede traefik-public existe
docker network ls | grep traefik
```

### Traefik não roteia
Verifique se as labels estão corretas:
```bash
# Via terminal SSH
docker inspect batalha-naval | grep traefik
```

### WhatsApp não conecta
```bash
# Limpar sessão
Portainer → Volumes → batalha-naval_whatsapp-session → Browse → Delete all

# Reiniciar container
Portainer → Containers → batalha-naval → Restart
```

### SSL não funciona
Verifique:
- ✅ DNS apontando corretamente para o IP
- ✅ Portas 80 e 443 abertas no firewall
- ✅ Traefik configurado com Let's Encrypt

```bash
# Ver logs do Traefik
docker logs traefik
```

---

## 📝 Estrutura de volumes

O Portainer criará automaticamente estes volumes:

```
/var/lib/docker/volumes/batalha-naval_data/        # Banco de dados
/var/lib/docker/volumes/batalha-naval_whatsapp-session/  # Sessão WhatsApp
/var/lib/docker/volumes/batalha-naval_logs/        # Logs da aplicação
```

### Backup dos volumes
```bash
# SSH na VPS
docker run --rm -v batalha-naval_data:/data -v $(pwd):/backup alpine \
  tar czf /backup/batalha-naval-backup-$(date +%Y%m%d).tar.gz /data
```

---

## 🔒 Segurança

### Tornar repositório privado
Se ainda não for:
1. GitHub → Seu Repo → Settings
2. Danger Zone → Change visibility → Make private

### Variáveis sensíveis
Use **Portainer secrets** para dados sensíveis:
1. Portainer → Secrets → + Add secret
2. Use nos stacks com: `external: true`

---

## ✅ Checklist de Deploy

- [ ] Código commitado no GitHub
- [ ] Imagem Docker buildada (se usar registry)
- [ ] DNS configurado e propagado
- [ ] Stack criada no Portainer
- [ ] Container rodando (status: running)
- [ ] Traefik roteando corretamente
- [ ] SSL funcionando (https://)
- [ ] WhatsApp conectado via QR code
- [ ] Teste de criar jogo via WhatsApp
- [ ] Teste de posicionamento via web
- [ ] Teste de gameplay completo

---

## 🎯 Exemplo de configuração completa

### docker-compose.yml no Portainer
```yaml
version: '3.8'

services:
  batalha-naval:
    image: ghcr.io/seu-usuario/batalha-naval:latest
    container_name: batalha-naval
    restart: unless-stopped

    environment:
      - NODE_ENV=production
      - PORT=3001
      - BASE_URL=https://batalha.seu-dominio.com

    volumes:
      - data:/app/data
      - whatsapp:/app/backend/.wwebjs_auth
      - logs:/app/backend/logs

    networks:
      - traefik-public

    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik-public"
      - "traefik.http.routers.batalha.rule=Host(`batalha.seu-dominio.com`)"
      - "traefik.http.routers.batalha.entrypoints=websecure"
      - "traefik.http.routers.batalha.tls.certresolver=letsencrypt"
      - "traefik.http.services.batalha.loadbalancer.server.port=3001"

volumes:
  data:
  whatsapp:
  logs:

networks:
  traefik-public:
    external: true
```

---

## 🚀 Pronto!

Sua aplicação está no ar com:
- ✅ HTTPS automático (Let's Encrypt)
- ✅ Deploy automatizado via Git
- ✅ Gerenciamento visual no Portainer
- ✅ Logs centralizados
- ✅ Restart automático
- ✅ Backup fácil de volumes

**Dúvidas?** Verifique os logs no Portainer! 📊
