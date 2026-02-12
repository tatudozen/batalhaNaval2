/**
 * Renderiza tabuleiros em formato ASCII para WhatsApp
 */

class BoardRenderer {
  constructor() {
    this.cols = 'ABCDEFGHIJKLMNOP'.split('');
    this.rows = 16;
  }

  /**
   * Renderiza tabuleiro de ataque (onde você atira)
   */
  renderAttackBoard(board) {
    let output = '🎯 *TABULEIRO DE ATAQUE*\n';
    output += '_(Seus tiros no inimigo)_\n\n';
    output += this.renderBoard(board, 'attack');
    return output;
  }

  /**
   * Renderiza tabuleiro de defesa (sua esquadra)
   */
  renderDefenseBoard(board) {
    let output = '🛡️ *TABULEIRO DE DEFESA*\n';
    output += '_(Sua esquadra)_\n\n';
    output += this.renderBoard(board, 'defense');
    return output;
  }

  /**
   * Renderiza ambos os tabuleiros
   */
  renderBothBoards(attackBoard, defenseBoard) {
    let output = '🚢 *SEUS TABULEIROS*\n\n';
    output += this.renderAttackBoard(attackBoard);
    output += '\n\n';
    output += this.renderDefenseBoard(defenseBoard);
    return output;
  }

  /**
   * Renderiza um tabuleiro genérico
   */
  renderBoard(board, type = 'attack') {
    let output = '```\n';

    // Cabeçalho com letras
    output += '   ';
    for (let i = 0; i < this.cols.length; i++) {
      output += ` ${this.cols[i]}`;
    }
    output += '\n';

    // Linhas do tabuleiro
    for (let row = 1; row <= this.rows; row++) {
      // Número da linha
      output += row.toString().padStart(2, ' ') + ' ';

      // Células
      for (let colIdx = 0; colIdx < this.cols.length; colIdx++) {
        const col = this.cols[colIdx];
        const cell = this.getCell(board, col, row);
        const symbol = this.getCellSymbol(cell, type);
        output += ` ${symbol}`;
      }

      output += '\n';
    }

    output += '```';
    return output;
  }

  /**
   * Obtém célula do tabuleiro
   */
  getCell(board, col, row) {
    if (!board || !board[row] || !board[row][col]) {
      return null;
    }
    return board[row][col];
  }

  /**
   * Retorna símbolo para célula
   */
  getCellSymbol(cell, type) {
    if (!cell) {
      return '·'; // Água não atirada
    }

    if (type === 'attack') {
      // Tabuleiro de ataque (onde você atira)
      if (cell.hit && cell.ship) {
        return '🔥'; // Acertou navio
      } else if (cell.hit) {
        return '💦'; // Água (errou)
      } else {
        return '·'; // Não atirado ainda
      }
    } else {
      // Tabuleiro de defesa (sua esquadra)
      if (cell.hit && cell.ship) {
        return '💥'; // Seu navio foi atingido
      } else if (cell.hit) {
        return '💦'; // Água (inimigo errou)
      } else if (cell.ship) {
        return '⬛'; // Seu navio intacto
      } else {
        return '·'; // Água não atirada
      }
    }
  }

  /**
   * Renderiza legenda
   */
  renderLegend() {
    return `
📖 *LEGENDA*

*Tabuleiro de Ataque:*
· = Não atirado
💦 = Água (errou)
🔥 = Acertou navio!

*Tabuleiro de Defesa:*
· = Água
⬛ = Seu navio
💥 = Atingido
💦 = Inimigo errou
`;
  }

  /**
   * Renderiza mensagem de resultado de tiro
   */
  renderShotResult(result) {
    let output = '';

    if (result.hit) {
      output += '🎯 *ACERTOU!* 🔥\n\n';

      if (result.sunk) {
        output += `💀 *AFUNDOU ${result.shipName}!*\n`;
      } else {
        output += `Atingiu: ${result.shipName}\n`;
      }

      if (result.salvaRemaining > 0) {
        output += `\n⚡ *SALVA ATIVA!*\n`;
        output += `Você tem ${result.salvaRemaining} tiros extras!\n`;
      }

      if (result.gameOver) {
        output += '\n🏆 *VITÓRIA!* 🏆\n';
        output += 'Você afundou toda a esquadra inimiga!\n';
      }
    } else {
      output += '💦 *ÁGUA!*\n\n';
      output += 'Você errou. Turno do oponente.\n';
    }

    return output;
  }

  /**
   * Renderiza status da partida
   */
  renderMatchStatus(match, playerId) {
    const gameData = match.gameData || match;
    const players = gameData.players || {};

    const you = players[playerId] || {};
    const opponentId = playerId === 'player1' ? 'player2' : 'player1';
    const opponent = players[opponentId] || {};

    let output = '📊 *STATUS DA PARTIDA*\n\n';

    // Status do jogo
    output += `🎮 *Status:* ${match.status || 'Desconhecido'}\n\n`;

    // Turno
    if (match.current_turn === playerId || match.currentTurn === playerId) {
      output += '🟢 *É SEU TURNO!*\n\n';
    } else {
      output += '🔴 Turno do oponente\n\n';
    }

    // Seus navios
    const yourShips = you.shipsRemaining ?? 15;
    const enemyShips = opponent.shipsRemaining ?? 15;
    output += `⚓ *Seus navios:* ${yourShips}/15\n`;
    output += `💥 *Navios inimigos:* ${enemyShips}/15\n\n`;

    // Salva
    const salvaRemaining = match.salva_remaining || match.salvaRemaining || 0;
    if (salvaRemaining > 0 && (match.current_turn === playerId || match.currentTurn === playerId)) {
      output += `⚡ *Salva ativa:* ${salvaRemaining} tiros\n\n`;
    }

    // Tiros dados
    output += `🎯 Seus tiros: ${you.shotsFired || 0}\n`;
    output += `🎯 Acertos: ${you.hits || 0}\n`;
    output += `📈 Precisão: ${this.calculateAccuracy(you.hits || 0, you.shotsFired || 0)}%\n`;

    return output;
  }

  /**
   * Calcula precisão
   */
  calculateAccuracy(hits, shots) {
    if (!shots || shots === 0) return 0;
    return Math.round((hits / shots) * 100);
  }


  /**
   * Renderiza mensagem de partida iniciada
   */
  renderGameStarted(isYourTurn) {
    let output = '⚓ *BATALHA INICIADA!* ⚓\n\n';

    if (isYourTurn) {
      output += '🟢 *Você começa!*\n\n';
      output += 'Digite: `Atirar A5`\n';
      output += 'ou: `Mapa` para ver tabuleiros';
    } else {
      output += '🔴 Aguarde o turno do oponente\n';
    }

    return output;
  }
}

module.exports = BoardRenderer;
