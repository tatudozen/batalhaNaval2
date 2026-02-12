const CommandParser = require('./commandParser');
const BoardRenderer = require('./boardRenderer');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const gameEngine = require('../engine/gameEngine');

/**
 * Controller para gerenciar lógica do WhatsApp + Batalha Naval
 */
class WhatsAppController {
  constructor(whatsappBot) {
    this.bot = whatsappBot;
    this.parser = new CommandParser();
    this.renderer = new BoardRenderer();

    // Mapeia telefone -> dados da sessão do jogador
    this.playerSessions = new Map();

    // Registrar handler de mensagens
    this.bot.onMessage(this.handleMessage.bind(this));
  }

  /**
   * Handler principal de mensagens
   */
  async handleMessage(message) {
    const phone = message.from;
    const text = message.body;

    // Ignorar apenas mensagens de grupos (não LID, que são contatos individuais)
    if (phone.includes('@g.us')) {
      await message.reply('⚠️ Por favor, envie comandos em um chat individual, não em grupos!');
      return;
    }

    // Parsear comando
    const command = this.parser.parse(text);

    console.log(`🎮 Comando: ${command.type} de ${phone}`);

    try {
      switch (command.type) {
        case 'CRIAR_JOGO':
          await this.handleCreateGame(message);
          break;

        case 'ATIRAR':
          await this.handleShot(message, command);
          break;

        case 'STATUS':
          await this.handleStatus(message);
          break;

        case 'MAPA':
          await this.handleMap(message);
          break;

        case 'AJUDA':
          await this.handleHelp(message);
          break;

        case 'CONFIRMAR':
          await this.handleConfirm(message);
          break;

        case 'SAIR':
          await this.handleQuit(message);
          break;

        case 'DESCONHECIDO':
          await this.handleUnknown(message, text);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar comando:', error);
      try {
        await message.reply(`❌ Erro: ${error.message}`);
      } catch (replyError) {
        console.error('Erro ao enviar resposta:', replyError);
      }
    }
  }

  /**
   * Criar novo jogo
   */
  async handleCreateGame(message) {
    const phone = message.from;

    // Verificar se já tem jogo ativo
    const session = this.playerSessions.get(phone);
    if (session && session.matchId) {
      await message.reply('⚠️ Você já tem uma partida ativa!\n\nDigite `Status` para ver a situação ou `Sair` para encerrar.');
      return;
    }

    // Criar match no banco
    const matchId = `match-${uuidv4().split('-')[0]}`;
    const player1Token = uuidv4();
    const player2Token = uuidv4();

    // Inserir no banco
    db.createMatch(matchId, player1Token, player2Token);

    // Salvar sessão
    this.playerSessions.set(phone, {
      matchId,
      playerId: 'player1',
      token: player1Token,
      phone,
      waitingForOpponent: true
    });

    // Links de posicionamento
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const player1Link = `${baseUrl}/posicionamento.html?match=${matchId}&player=player1&token=${player1Token}`;
    const player2Link = `${baseUrl}/posicionamento.html?match=${matchId}&player=player2&token=${player2Token}`;

    // Enviar primeira mensagem (seu link)
    const response1 = `🎮 *PARTIDA CRIADA!*

🆔 *ID:* ${matchId}

📍 *SEU LINK (Jogador 1):*
${player1Link}

Acesse para posicionar sua esquadra!`;

    await message.reply(response1);

    // Enviar segunda mensagem (link do oponente) - mensagem separada para forward
    const response2 = `👥 *LINK PARA O OPONENTE*

Encaminhe esta mensagem para quem vai jogar com você:

${player2Link}

⚓ Ambos devem posicionar a esquadra. A partida iniciará automaticamente!`;

    await message.reply(response2);

    console.log(`✅ Partida ${matchId} criada para ${phone}`);
  }

  /**
   * Disparar tiro
   */
  async handleShot(message, command) {
    const phone = message.from;
    const session = this.getSession(phone);
    if (!session) {
      await message.reply(
        '⚠️ Você não tem uma partida ativa.\n\nDigite `Criar jogo` para começar!'
      );
      return;
    }

    // Buscar match do banco
    const match = db.getMatch(session.matchId);
    if (!match) {
      await message.reply('❌ Partida não encontrada.');
      return;
    }

    // Verificar se jogo já começou
    if (match.status !== 'in_progress') {
      await message.reply(
        '⚠️ A partida ainda não começou.\n\nAguarde o oponente posicionar a esquadra.'
      );
      return;
    }

    // Verificar turno
    if (match.currentTurn !== session.playerId) {
      await message.reply('⏸️ Não é seu turno! Aguarde o oponente jogar.');
      return;
    }

    // Processar tiro
    const result = await this.processShot(
      session.matchId,
      session.playerId,
      session.token,
      command.coord
    );

    // Renderizar resultado
    const response = this.renderer.renderShotResult(result);
    await message.reply(response);

    // Notificar oponente
    await this.notifyOpponent(session, result);
  }

  /**
   * Processar tiro via API
   */
  async processShot(matchId, playerId, token, coord) {
    // Chamar API de tiro
    const response = await fetch(`http://localhost:3001/api/matches/${matchId}/shot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, token, coord })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao processar tiro');
    }

    return await response.json();
  }

  /**
   * Mostrar status
   */
  async handleStatus(message) {
    const phone = message.from;
    const session = this.getSession(phone);
    if (!session) {
      await message.reply(
        '⚠️ Você não tem uma partida ativa.\n\nDigite `Criar jogo` para começar!'
      );
      return;
    }

    const match = db.getMatch(session.matchId);
    if (!match) {
      await message.reply('❌ Partida não encontrada.');
      return;
    }

    const response = this.renderer.renderMatchStatus(match, session.playerId);
    await message.reply(response);
  }

  /**
   * Mostrar mapa
   */
  async handleMap(message) {
    const phone = message.from;
    const session = this.getSession(phone);
    if (!session) {
      await message.reply(
        '⚠️ Você não tem uma partida ativa.\n\nDigite `Criar jogo` para começar!'
      );
      return;
    }

    // Buscar tabuleiros
    const response = await fetch(
      `http://localhost:3001/api/matches/${session.matchId}/board/${session.playerId}?token=${session.token}`
    );

    if (!response.ok) {
      await message.reply('❌ Erro ao buscar tabuleiros.');
      return;
    }

    const { attackBoard, defenseBoard } = await response.json();

    // Renderizar
    const mapMessage = this.renderer.renderBothBoards(attackBoard, defenseBoard);
    await message.reply(mapMessage);
  }

  /**
   * Ajuda
   */
  async handleHelp(message) {
    const helpMessage = this.parser.getHelpMessage();
    await message.reply(helpMessage);
  }

  /**
   * Confirmar posicionamento (caso jogador queira confirmar via WhatsApp)
   */
  async handleConfirm(message) {
    const phone = message.from;
    const session = this.getSession(phone);
    if (!session) {
      await message.reply('⚠️ Você não tem uma partida ativa.');
      return;
    }

    await message.reply(
      '✅ Use o link enviado anteriormente para posicionar sua esquadra!\n\nApós posicionar no site, a partida iniciará automaticamente.'
    );
  }

  /**
   * Sair do jogo
   */
  async handleQuit(message) {
    const phone = message.from;
    const session = this.playerSessions.get(phone);
    if (session) {
      this.playerSessions.delete(phone);
      await message.reply('👋 Você saiu da partida.\n\nDigite `Criar jogo` quando quiser jogar novamente!');
    } else {
      await message.reply('⚠️ Você não está em nenhuma partida.');
    }
  }

  /**
   * Comando desconhecido
   */
  async handleUnknown(message, text) {
    await message.reply(`❓ Comando não reconhecido: "${text}"\n\nDigite \`Ajuda\` para ver os comandos disponíveis.`);
  }

  /**
   * Obter sessão do jogador
   */
  getSession(phone) {
    return this.playerSessions.get(phone);
  }

  /**
   * Notificar oponente sobre o tiro
   */
  async notifyOpponent(session, result) {
    // Encontrar oponente
    const opponentId = session.playerId === 'player1' ? 'player2' : 'player1';

    // Buscar telefone do oponente
    let opponentPhone = null;
    for (const [phone, sess] of this.playerSessions.entries()) {
      if (sess.matchId === session.matchId && sess.playerId === opponentId) {
        opponentPhone = phone;
        break;
      }
    }

    if (!opponentPhone) {
      console.log('⚠️ Oponente não encontrado para notificação');
      return;
    }

    // Enviar notificação
    let message = '';

    if (result.hit) {
      if (result.sunk) {
        message = `💥 *Seu ${result.shipName} foi afundado!*\n\n`;
      } else {
        message = `💥 *Você foi atingido!*\n\n`;
      }
    } else {
      message = `💦 Oponente errou!\n\n`;
    }

    if (result.gameOver) {
      message += '☠️ *DERROTA*\n\nToda sua esquadra foi destruída!';
    } else if (!result.salvaActive) {
      message += '🟢 *É SEU TURNO!*\n\nDigite: `Atirar A5`';
    } else {
      message += '⏸️ Oponente ainda tem tiros na salva...';
    }

    await this.bot.sendMessage(opponentPhone, message);
  }

  /**
   * Registrar telefone do player2 (quando entrar via link)
   */
  registerPlayer2(matchId, phone, token) {
    this.playerSessions.set(phone, {
      matchId,
      playerId: 'player2',
      token,
      phone
    });
    console.log(`✅ Player 2 registrado: ${phone} na partida ${matchId}`);
  }

  /**
   * Notificar início de jogo
   */
  async notifyGameStart(matchId) {
    console.log(`🎮 Tentando notificar início do jogo ${matchId}...`);

    // Encontrar jogadores registrados
    const players = [];
    for (const [phone, session] of this.playerSessions.entries()) {
      if (session.matchId === matchId) {
        players.push({ phone, session });
        console.log(`  ✓ ${session.playerId} registrado: ${phone}`);
      }
    }

    if (players.length === 0) {
      console.log('⚠️ Nenhum jogador registrado no WhatsApp para esta partida');
      return;
    }

    // Buscar match para saber quem começa
    const match = db.getMatch(matchId);

    // Notificar cada jogador registrado
    for (const { phone, session } of players) {
      const isYourTurn = session.playerId === match.currentTurn;
      const message = this.renderer.renderGameStarted(isYourTurn);
      await this.bot.sendMessage(phone, message);
      console.log(`  📤 Notificação enviada para ${session.playerId}`);
    }

    if (players.length < 2) {
      console.log('  ⚠️ Apenas 1 jogador notificado. O outro pode não estar usando WhatsApp.');
    }
  }
}

module.exports = WhatsAppController;
