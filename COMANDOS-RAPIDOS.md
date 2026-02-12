# ⚡ Comandos Rápidos - Deploy

## 1️⃣ Subir para GitHub

```bash
cd /Users/nando/Desktop/Playground/batalhaNaval2

git init
git add .
git commit -m "Deploy inicial - Batalha Naval"

# Depois de criar o repo no GitHub:
git remote add origin https://github.com/SEU-USUARIO/batalha-naval.git
git branch -M main
git push -u origin main
```

---

## 2️⃣ Configurar no Portainer

**Acessar:** https://portainer.alquimiazen.com.br

**Stacks → + Add stack**

```
Name: batalha-naval
Build method: Git Repository
Repository URL: https://github.com/SEU-USUARIO/batalha-naval
Repository reference: refs/heads/main
Compose path: docker-compose.yml
```

**Deploy the stack**

---

## 3️⃣ Verificar DNS (no Mac ou VPS)

```bash
nslookup batnav.alquimiazen.com.br
```

Deve retornar o IP da VPS.

---

## 4️⃣ Ver QR Code do WhatsApp

**Opção 1: No navegador**
```
https://batnav.alquimiazen.com.br/whatsapp-qr.png
```

**Opção 2: Logs no Portainer**
```
Portainer → Containers → batalha-naval → Logs
```

---

## 5️⃣ Testar no WhatsApp

```
/criar
```

---

## 🔄 Atualizar código

```bash
cd /Users/nando/Desktop/Playground/batalhaNaval2

# Fazer alterações...

git add .
git commit -m "Descrição das mudanças"
git push

# No Portainer:
# Stacks → batalha-naval → Update the stack
```

---

## 🐛 Troubleshooting

### Ver logs
```
Portainer → Containers → batalha-naval → Logs
```

### Reiniciar
```
Portainer → Containers → batalha-naval → Restart
```

### Limpar sessão WhatsApp
```
Portainer → Volumes → batnav-whatsapp → Browse → Delete all
Portainer → Containers → batalha-naval → Restart
```

---

## ✅ URLs importantes

- Frontend: https://batnav.alquimiazen.com.br
- Chat: https://batnav.alquimiazen.com.br/chat.html
- Posicionamento: https://batnav.alquimiazen.com.br/posicionamento.html
- QR WhatsApp: https://batnav.alquimiazen.com.br/whatsapp-qr.png
