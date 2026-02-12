# 🚀 Deploy - Batalha Naval
## Portainer + Traefik (AlquimiaZen)

Guia específico para deploy em **batnav.alquimiazen.com.br**

---

## ✅ Checklist Pré-Deploy

- [x] Domínio: `batnav.alquimiazen.com.br`
- [x] Traefik configurado com `AZ_Net`
- [x] Cert resolver: `letsencryptresolver`
- [x] Portainer instalado e rodando

---

## 📋 Passo a Passo

### **1. Configurar DNS**

No painel DNS da AlquimiaZen (ou GoDaddy/Registro.br):

```
Tipo: A
Host: batnav
Domínio: alquimiazen.com.br
Valor: [IP da VPS]
TTL: 3600
```

**Verificar propagação:**
```bash
nslookup batnav.alquimiazen.com.br
# ou
dig batnav.alquimiazen.com.br
```

---

### **2. Subir código para GitHub**

```bash
cd /Users/nando/Desktop/Playground/batalhaNaval2

# Inicializar Git (se ainda não for um repo)
git init

# Adicionar arquivos
git add .

# Commit
git commit -m "Deploy inicial - Batalha Naval"

# Criar repositório no GitHub
# https://github.com/new
# Nome: batalha-naval
# Visibilidade: Private (recomendado)

# Conectar e enviar
git remote add origin https://github.com/SEU-USUARIO/batalha-naval.git
git branch -M main
git push -u origin main
```

---

### **3. Deploy no Portainer**

#### 3.1 Acessar Portainer
- URL: `https://portainer.alquimiazen.com.br` (ou onde estiver)
- Fazer login

#### 3.2 Criar Stack
1. **Menu lateral:** `Stacks`
2. **Clicar em:** `+ Add stack`

#### 3.3 Configurar Stack

**Name:**
```
batalha-naval
```

**Build method:**
- Selecione: `Git Repository`

**Repository URL:**
```
https://github.com/SEU-USUARIO/batalha-naval
```

**Repository reference:**
```
refs/heads/main
```

**Compose path:**
```
docker-compose.yml
```

**Authentication:**
- Se repositório for **Private**, adicione:
  - Username: seu-usuario-github
  - Personal Access Token: [seu token do GitHub]

**Environment variables:** (deixe vazio, já está tudo no compose)

#### 3.4 Deploy
- Clique em: `Deploy the stack`
- Aguarde o build (pode demorar 2-3 minutos na primeira vez)

---

### **4. Verificar Deploy**

#### 4.1 Ver logs
1. **Portainer** → **Containers** → `batalha-naval`
2. Clicar em **Logs**
3. Verificar se apareceu:
   ```
   🚢 Batalha Naval backend rodando em http://localhost:3001
   ✅ WhatsApp Bot está pronto!
   ```

#### 4.2 Ver status do container
```
Status: running ✅
```

#### 4.3 Verificar Traefik
1. **Portainer** → **Containers** → `batalha-naval`
2. Ir em **Inspect**
3. Verificar **Labels** → deve ter:
   ```
   traefik.enable=true
   traefik.http.routers.batalha-naval.rule=Host(`batnav.alquimiazen.com.br`)
   ```

---

### **5. Conectar WhatsApp**

#### 5.1 Ver QR Code nos logs
**Portainer** → **Containers** → `batalha-naval` → **Logs**

Procure por uma mensagem tipo:
```
🚀 Inicializando WhatsApp Bot...
[QR Code aparecerá aqui]
```

#### 5.2 Ou acessar via navegador
```
https://batnav.alquimiazen.com.br/whatsapp-qr.png
```

#### 5.3 Escanear com WhatsApp
1. Abrir WhatsApp no celular
2. **Configurações** → **Aparelhos conectados**
3. **Conectar aparelho**
4. Escanear o QR code

Após conectar, verá nos logs:
```
✅ WhatsApp autenticado com sucesso!
📞 Conectado como: Seu Nome (5521...)
```

---

### **6. Testar Aplicação**

#### 6.1 Acessar frontend
```
https://batnav.alquimiazen.com.br
```

#### 6.2 Testar chat simulado
```
https://batnav.alquimiazen.com.br/chat.html
```

#### 6.3 Testar posicionamento
```
https://batnav.alquimiazen.com.br/posicionamento.html
```

#### 6.4 Testar WhatsApp
Enviar mensagem para o número conectado:
```
/criar
```

Deve receber:
1. Mensagem com seu link de posicionamento
2. Mensagem com link do oponente (para compartilhar)

---

## 🔄 Atualizar Aplicação

### Método 1: Via Git (automático)

```bash
# No Mac, fazer alterações
cd /Users/nando/Desktop/Playground/batalhaNaval2

# Editar arquivos...

# Commit e push
git add .
git commit -m "Descrição das mudanças"
git push

# No Portainer:
# Stacks → batalha-naval → ⟳ Update the stack
# Marcar: "Pull latest image"
# Clicar: "Update"
```

### Método 2: Via Portainer Web Editor

```bash
# Stacks → batalha-naval → Editor
# Editar docker-compose.yml se necessário
# Clicar: "Update the stack"
```

---

## 🐛 Troubleshooting

### Container não inicia

**Ver logs:**
```
Portainer → Containers → batalha-naval → Logs
```

**Verificar saúde:**
```
Portainer → Containers → batalha-naval
# Status deve ser: "healthy"
```

### Traefik não roteia

**Verificar se DNS está propagado:**
```bash
# SSH na VPS
nslookup batnav.alquimiazen.com.br
```

**Verificar labels do Traefik:**
```bash
# SSH na VPS
docker inspect batalha-naval | grep -A 20 Labels
```

**Ver logs do Traefik:**
```bash
docker logs traefik | grep batalha
```

### SSL não funciona

**Verificar certificado:**
```bash
# SSH na VPS
docker exec traefik cat /etc/traefik/letsencrypt/acme.json | grep batnav
```

**Se não gerou, verificar:**
- ✅ DNS propagado (pode demorar até 1h)
- ✅ Portas 80 e 443 abertas
- ✅ Domínio correto no docker-compose.yml

### WhatsApp não conecta

**Limpar sessão:**
```
Portainer → Volumes → batnav-whatsapp → Browse
# Deletar todos os arquivos
```

**Reiniciar container:**
```
Portainer → Containers → batalha-naval → Restart
```

**Ver novo QR Code:**
```
Portainer → Containers → batalha-naval → Logs
```

### Build falha

**Ver logs de build:**
```
Portainer → Stacks → batalha-naval → Logs
```

**Erro comum: falta memória**
```bash
# SSH na VPS
# Adicionar swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## 📊 Monitoramento

### Ver estatísticas
```
Portainer → Containers → batalha-naval → Stats
```

### Ver logs em tempo real
```
Portainer → Containers → batalha-naval → Logs
# Ativar: "Auto-refresh logs"
```

### Ver mensagens do WhatsApp
Nos logs, aparecerá:
```
📨 Mensagem de 5521XXXXXXXXX@c.us: /criar
🎮 Comando: CRIAR_JOGO de 5521XXXXXXXXX@c.us
✅ Partida match-abc123 criada
```

---

## 💾 Backup

### Backup dos volumes

```bash
# SSH na VPS
cd /var/lib/docker/volumes

# Backup banco de dados
sudo tar -czf ~/batnav-backup-$(date +%Y%m%d).tar.gz \
  batnav-data \
  batnav-whatsapp \
  batnav-logs
```

### Restaurar backup

```bash
# SSH na VPS
cd /var/lib/docker/volumes

# Parar container
docker stop batalha-naval

# Restaurar
sudo tar -xzf ~/batnav-backup-YYYYMMDD.tar.gz

# Iniciar container
docker start batalha-naval
```

---

## 🔧 Comandos Úteis

### Ver logs
```bash
# SSH na VPS
docker logs -f batalha-naval
# ou
docker logs --tail 100 batalha-naval
```

### Reiniciar
```bash
docker restart batalha-naval
```

### Shell dentro do container
```bash
docker exec -it batalha-naval sh
```

### Ver processos
```bash
docker top batalha-naval
```

### Ver consumo de recursos
```bash
docker stats batalha-naval
```

---

## ✅ Checklist Pós-Deploy

- [ ] DNS configurado e propagado
- [ ] Código no GitHub
- [ ] Stack criada no Portainer
- [ ] Container em status "running"
- [ ] HTTPS funcionando (cadeado verde)
- [ ] Frontend acessível
- [ ] WhatsApp conectado
- [ ] Teste de criar jogo via WhatsApp ✅
- [ ] Teste de posicionamento via web ✅
- [ ] Teste de gameplay completo ✅

---

## 🎯 URLs Finais

- **Frontend:** https://batnav.alquimiazen.com.br
- **Chat:** https://batnav.alquimiazen.com.br/chat.html
- **Posicionamento:** https://batnav.alquimiazen.com.br/posicionamento.html
- **QR WhatsApp:** https://batnav.alquimiazen.com.br/whatsapp-qr.png
- **API:** https://batnav.alquimiazen.com.br/api/matches

---

## 🎮 Como Jogar (Teste Final)

### Teste 1: Criar partida
```
Envie no WhatsApp: /criar
```

Deve receber:
1. Link do jogador 1
2. Link do jogador 2 (para compartilhar)

### Teste 2: Posicionar esquadra
1. Abrir ambos os links em abas diferentes
2. Posicionar navios em cada tabuleiro
3. Clicar em "Confirmar Esquadra" em ambos

### Teste 3: Jogar
Após ambos posicionarem:
```
Envie no WhatsApp: A5
```

Deve receber resultado do tiro!

---

## 📞 Suporte

Se algo der errado:

1. Verificar logs no Portainer
2. Verificar logs do Traefik
3. Testar DNS com `nslookup`
4. Verificar firewall (portas 80/443)

**Em caso de dúvidas, compartilhe:**
- Screenshot dos logs
- Mensagem de erro completa
- URL que está tentando acessar

---

**🚀 Bom deploy!**
