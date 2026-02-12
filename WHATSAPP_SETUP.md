# 📱 Configuração do WhatsApp

## 🚀 Como Configurar

### 1. Iniciar o Servidor

```bash
cd backend
node server.js
```

### 2. Escanear QR Code

Quando o servidor iniciar, um **QR Code** será exibido no terminal:

```
📱 Escaneie o QR Code abaixo com o WhatsApp:

[QR CODE AQUI]
```

### 3. Autenticar

1. Abra o WhatsApp no celular do número **5521971236887**
2. Vá em **Configurações > Aparelhos Conectados**
3. Clique em **Conectar um aparelho**
4. Escaneie o QR Code exibido no terminal

### 4. Confirmação

Quando conectado, você verá:

```
✅ WhatsApp autenticado com sucesso!
✅ WhatsApp Bot está pronto!
📞 Conectado como: Batalha Naval (5521971236887)
```

---

## 🎮 Como Jogar via WhatsApp

### Criar Partida

Envie no WhatsApp:
```
Criar jogo
```

Você receberá:
```
🎮 PARTIDA CRIADA!

🆔 ID: match-abc123

📍 Próximo passo:
Posicione sua esquadra acessando:

http://localhost:3001/posicionamento.html?match=...

Após posicionar, envie:
Confirmar

Aguardando posicionamento...
```

### Posicionar Esquadra

1. Clique no link enviado
2. Posicione seus 15 navios
3. Clique em "Confirmar Esquadra"

### Convidar Oponente

Copie o link do **Player 2** e envie para seu oponente via WhatsApp ou outro meio.

Quando ambos posicionarem, você receberá:

```
⚓ BATALHA INICIADA! ⚓

🟢 Você começa!

Digite: Atirar A5
ou: Mapa para ver tabuleiros
```

### Comandos Durante o Jogo

#### Atirar
```
Atirar A5
Atirar B12
Atirar O15
```

**Respostas:**
- ✅ Acertou: `🎯 ACERTOU! 🔥`
- ❌ Errou: `💦 ÁGUA!`
- 💀 Afundou: `💀 AFUNDOU Porta-aviões!`

#### Ver Status
```
Status
```

Mostra:
- Turno atual
- Navios restantes (seus e do inimigo)
- Tiros dados e precisão

#### Ver Mapa
```
Mapa
```

Exibe seus dois tabuleiros:
- 🎯 **Tabuleiro de Ataque** (seus tiros)
- 🛡️ **Tabuleiro de Defesa** (sua esquadra)

#### Ajuda
```
Ajuda
```

Lista todos os comandos disponíveis.

#### Sair
```
Sair
```

Encerra a partida atual.

---

## 📊 Legendas dos Tabuleiros

### Tabuleiro de Ataque
- `·` = Não atirado
- `💦` = Água (errou)
- `🔥` = Acertou navio!

### Tabuleiro de Defesa
- `·` = Água
- `⬛` = Seu navio
- `💥` = Atingido
- `💦` = Inimigo errou

---

## 🔧 Troubleshooting

### QR Code não aparece
- Verifique se o `whatsapp-web.js` foi instalado: `npm install`
- Tente limpar o cache: `rm -rf .wwebjs_auth`

### "WhatsApp Bot não está pronto"
- Aguarde alguns segundos após escanear o QR Code
- Verifique se o WhatsApp está ativo no celular

### Mensagens não chegam
- Verifique se o número está correto (com DDI + DDD)
- O número deve estar salvo ou ter iniciado conversa com o bot

### Desconectou
- Basta reiniciar o servidor e escanear novamente
- A sessão fica salva em `.wwebjs_auth/`

---

## 🎯 Fluxo Completo

```
1. Jogador 1: "Criar jogo"
   ↓
2. Bot: Envia link de posicionamento
   ↓
3. Jogador 1: Acessa link, posiciona esquadra
   ↓
4. Jogador 1: Compartilha link Player 2 com oponente
   ↓
5. Jogador 2: Acessa link, posiciona esquadra
   ↓
6. Bot: Notifica ambos "BATALHA INICIADA!"
   ↓
7. Jogo via WhatsApp:
   - "Atirar A5"
   - "Status"
   - "Mapa"
   ↓
8. Fim: Bot anuncia vencedor!
```

---

## 📝 Notas

- **Número do Bot:** 5521971236887
- **API:** whatsapp-web.js (não oficial)
- **Autenticação:** QR Code (sessão salva localmente)
- **Persistência:** Banco SQLite (game.db)

---

## 🆘 Suporte

Se precisar de ajuda:
1. Verifique os logs do servidor
2. Digite "Ajuda" no WhatsApp
3. Consulte o README.md principal
