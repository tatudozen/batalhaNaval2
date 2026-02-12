# 🚢 Batalha Naval - WhatsApp Edition

Jogo de Batalha Naval multiplayer jogável via WhatsApp, com interface web para posicionamento de esquadra.

## 🎮 Features

- ✅ Jogo completo via WhatsApp com comandos simples
- ✅ Interface web para posicionamento de navios
- ✅ Sistema de salva (3 tiros extras ao acertar)
- ✅ 15 navios por jogador em tabuleiro 16x16
- ✅ Notificações em tempo real
- ✅ Suporte para múltiplas partidas simultâneas
- ✅ Deploy com Docker + Traefik + SSL automático

## 📋 Comandos do WhatsApp

| Comando | Descrição |
|---------|-----------|
| `/criar` | Cria nova partida |
| `A5` | Atira na coordenada A5 |
| `/status` | Mostra situação da partida |
| `/mapa` | Exibe tabuleiros |
| `/ajuda` | Lista de comandos |
| `/sair` | Sai da partida |

## 🏗️ Tecnologias

- **Backend:** Node.js (Express)
- **WhatsApp:** whatsapp-web.js (API não oficial)
- **Database:** SQLite (better-sqlite3)
- **Frontend:** HTML/CSS/JavaScript vanilla
- **Deploy:** Docker + Portainer + Traefik

## 🚀 Deploy

### Via Portainer (Recomendado)

Veja o guia completo: [DEPLOY-PORTAINER.md](./DEPLOY-PORTAINER.md)

### Via VPS tradicional

Veja o guia completo: [DEPLOY.md](./DEPLOY.md)

### Deploy Rápido

Veja: [QUICK-DEPLOY.md](./QUICK-DEPLOY.md)

## 🎯 Como jogar

1. **Criar partida:** Envie `/criar` no WhatsApp
2. **Receber links:** Você receberá 2 mensagens:
   - Seu link (para posicionar sua esquadra)
   - Link do oponente (para compartilhar)
3. **Posicionar navios:** Acesse os links e posicione no navegador
4. **Jogar:** Quando ambos posicionarem, o jogo inicia automaticamente
5. **Atirar:** Envie coordenadas (ex: `A5`, `B10`, `P16`)

## 🎲 Regras

- **Tabuleiro:** 16x16 (colunas A-P, linhas 1-16)
- **Esquadra:** 15 navios
  - 1 Porta-aviões (5 células)
  - 2 Cruzadores (4 células cada)
  - 3 Destroyers (2 células cada)
  - 4 Submarinos (1 célula cada)
  - 5 Hidroaviões (3 células cada)
- **Turnos:** Alterna entre jogadores
- **Salva:** Acertou? Ganha 3 tiros extras!
- **Vitória:** Afundar todos os navios do oponente

## 🛠️ Desenvolvimento Local

### Pré-requisitos
- Node.js 24.x
- npm

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/batalha-naval.git
cd batalha-naval

# Instalar dependências
cd backend
npm install

# Iniciar servidor
node server.js
```

Acesse: `http://localhost:3001`

## 📁 Estrutura do Projeto

```
batalhaNaval2/
├── backend/
│   ├── server.js           # Servidor Express
│   ├── routes.js           # API routes
│   ├── db.js              # Database
│   ├── whatsapp.js        # WhatsApp client
│   ├── whatsappController.js  # Controlador WhatsApp
│   ├── commandParser.js   # Parser de comandos
│   └── boardRenderer.js   # Renderização ASCII
├── engine/
│   └── gameEngine.js      # Lógica do jogo
├── frontend/
│   ├── chat.html          # Chat simulador
│   └── posicionamento.html  # Interface de posicionamento
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🐳 Docker

### Build local

```bash
docker build -t batalha-naval .
docker run -p 3001:3001 batalha-naval
```

### Com docker-compose

```bash
docker-compose up -d
```

## 📊 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/matches` | Criar partida |
| POST | `/api/matches/:id/fleets` | Registrar esquadra |
| POST | `/api/matches/:id/shot` | Disparar tiro |
| GET | `/api/matches/:id/state` | Estado da partida |
| GET | `/api/matches/:id/board/:playerId` | Tabuleiros do jogador |

## 🔒 Segurança

- Tokens de autenticação por partida
- Validação de jogador em cada ação
- HTTPS via Traefik + Let's Encrypt
- Isolamento de sessões WhatsApp

## 📝 Licença

MIT

## 👨‍💻 Autor

Desenvolvido com ☕ e ❤️

---

**⭐ Se gostou, deixe uma estrela!**
