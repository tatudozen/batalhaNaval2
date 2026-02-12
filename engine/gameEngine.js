/**
 * Batalha Naval - Game Engine
 * Lógica pura do jogo, sem dependências externas.
 * Funciona tanto no browser (via <script>) quanto no Node.js (require/import).
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BatalhaNavalEngine = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // ============================================================
  // CONSTANTS
  // ============================================================

  const GRID_SIZE = 16;
  const COLS = 'ABCDEFGHIJKLMNOP';

  const SHIP_TYPES = [
    { id: 'carrier', name: 'Porta-aviões', size: 5, count: 1, shape: 'linear' },
    { id: 'cruiser', name: 'Cruzador', size: 4, count: 2, shape: 'linear' },
    { id: 'destroyer', name: 'Destroyer', size: 2, count: 3, shape: 'linear' },
    { id: 'submarine', name: 'Submarino', size: 1, count: 4, shape: 'linear' },
    { id: 'seaplane', name: 'Hidroavião', size: 3, count: 5, shape: 'triangle' },
  ];

  const TRIANGLE_ROTATIONS = [
    [[0, 0], [1, -1], [1, 1]],
    [[0, 0], [-1, -1], [1, -1]],
    [[0, 0], [-1, -1], [-1, 1]],
    [[0, 0], [-1, 1], [1, 1]],
  ];

  const LINEAR_ORIENTATIONS = [
    (r, c, size) => Array.from({ length: size }, (_, i) => [r, c + i]),
    (r, c, size) => Array.from({ length: size }, (_, i) => [r + i, c]),
  ];

  // ============================================================
  // COORDINATE UTILS
  // ============================================================

  function toDisplay(row, col) {
    return COLS[col] + (row + 1);
  }

  function toInternal(coord) {
    if (!coord || typeof coord !== 'string') return null;
    coord = coord.trim().toUpperCase();
    const match = coord.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;

    const colLetter = match[1];
    const rowNum = match[2];

    // Validate column (must be single letter A-O)
    if (colLetter.length !== 1) return null;
    const col = COLS.indexOf(colLetter);
    if (col < 0) return null;

    // Validate row (must be 1-15)
    const row = parseInt(rowNum) - 1;
    if (isNaN(row) || row < 0 || row >= GRID_SIZE) return null;

    return { row, col };
  }

  function validateCoordinate(coord) {
    if (!coord || typeof coord !== 'string') {
      return { valid: false, error: 'Coordenada inválida: valor vazio ou não é texto.' };
    }

    coord = coord.trim().toUpperCase();

    if (coord.length < 2) {
      return { valid: false, error: 'Coordenada inválida: muito curta. Use o formato A1, B5, etc.' };
    }

    const match = coord.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      return { valid: false, error: 'Coordenada inválida: formato incorreto. Use letra + número (ex: A1, B5, O15).' };
    }

    const colLetter = match[1];
    const rowNum = match[2];

    if (colLetter.length !== 1) {
      return { valid: false, error: 'Coordenada inválida: use apenas uma letra (A-O).' };
    }

    const col = COLS.indexOf(colLetter);
    if (col < 0) {
      return { valid: false, error: 'Coordenada inválida: coluna "' + colLetter + '" não existe. Use A-O.' };
    }

    const row = parseInt(rowNum) - 1;
    if (isNaN(row)) {
      return { valid: false, error: 'Coordenada inválida: linha "' + rowNum + '" não é um número válido.' };
    }

    if (row < 0 || row >= GRID_SIZE) {
      return { valid: false, error: 'Coordenada inválida: linha "' + rowNum + '" fora dos limites. Use 1-' + GRID_SIZE + '.' };
    }

    return { valid: true, row, col };
  }

  function isInBounds(row, col) {
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
  }

  // ============================================================
  // SHIP GEOMETRY (shared with positioning frontend)
  // ============================================================

  function getCells(shipType, row, col, rotation) {
    if (shipType.shape === 'triangle') {
      const offsets = TRIANGLE_ROTATIONS[rotation % TRIANGLE_ROTATIONS.length];
      return offsets.map(([dr, dc]) => [row + dr, col + dc]);
    }
    const orient = LINEAR_ORIENTATIONS[rotation % 2];
    return orient(row, col, shipType.size);
  }

  function cellsInBounds(cells) {
    return cells.every(([r, c]) => isInBounds(r, c));
  }

  function getAdjacentCells(cells) {
    const adj = new Set();
    const cellSet = new Set(cells.map(([r, c]) => r + ',' + c));
    for (const [r, c] of cells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const key = (r + dr) + ',' + (c + dc);
          if (!cellSet.has(key)) adj.add(key);
        }
      }
    }
    return adj;
  }

  function canPlace(cells, occupiedMap, excludeShipId) {
    if (!cellsInBounds(cells)) return false;
    for (const [r, c] of cells) {
      const key = r + ',' + c;
      if (occupiedMap.has(key) && occupiedMap.get(key) !== excludeShipId) return false;
    }
    const adj = getAdjacentCells(cells);
    for (const key of adj) {
      if (occupiedMap.has(key) && occupiedMap.get(key) !== excludeShipId) return false;
    }
    return true;
  }

  function buildOccupiedMap(ships) {
    const map = new Map();
    for (const ship of ships) {
      for (const [r, c] of ship.cells) {
        map.set(r + ',' + c, ship.instanceId);
      }
    }
    return map;
  }

  // ============================================================
  // AUTO PLACEMENT
  // ============================================================

  function autoPlace() {
    const allShips = [];
    for (const type of SHIP_TYPES) {
      for (let i = 0; i < type.count; i++) {
        allShips.push({ ...type, instanceId: type.id + '-' + i });
      }
    }
    allShips.sort((a, b) => b.size - a.size);

    const placed = [];
    for (const ship of allShips) {
      const maxRot = ship.shape === 'triangle' ? 4 : 2;
      let success = false;
      for (let attempt = 0; attempt < 500 && !success; attempt++) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        const rot = Math.floor(Math.random() * maxRot);
        const cells = getCells(ship, row, col, rot);
        const occMap = buildOccupiedMap(placed);
        if (canPlace(cells, occMap, null)) {
          placed.push({ ...ship, cells, rotation: rot });
          success = true;
        }
      }
      if (!success) return null;
    }
    return placed;
  }

  function autoPlaceWithRetry(maxRetries) {
    maxRetries = maxRetries || 10;
    for (let i = 0; i < maxRetries; i++) {
      const result = autoPlace();
      if (result) return result;
    }
    return null;
  }

  // ============================================================
  // GAME CLASS
  // ============================================================

  function BatalhaNavalGame() {
    this.id = 'game-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    this.status = 'positioning'; // positioning | in_progress | finished
    this.players = {
      player1: { fleet: [], shotsReceived: {}, shipHealth: {} },
      player2: { fleet: [], shotsReceived: {}, shipHealth: {} },
    };
    this.currentTurn = 'player1';
    this.turnState = 'AWAITING_SHOT';
    this.salvaRemaining = 0;
    this.winner = null;
    this.shotLog = [];
  }

  /**
   * Registra a esquadra de um jogador.
   * ships: array de { instanceId, name, size, cells: [[r,c],...] }
   */
  BatalhaNavalGame.prototype.setFleet = function (playerId, ships) {
    if (this.status === 'finished') return { error: 'Jogo já encerrado.' };
    if (playerId !== 'player1' && playerId !== 'player2') return { error: 'Jogador inválido.' };

    const player = this.players[playerId];
    player.fleet = ships.map(function (s) {
      return {
        instanceId: s.instanceId,
        name: s.name,
        size: s.size,
        cells: s.cells.map(function (c) { return [c[0], c[1]]; }),
      };
    });

    // Init health tracking
    player.shipHealth = {};
    for (const ship of player.fleet) {
      player.shipHealth[ship.instanceId] = {
        total: ship.cells.length,
        hits: 0,
        hitCells: [],
        sunk: false,
      };
    }

    // Check if both fleets are set → start game
    if (this.players.player1.fleet.length > 0 && this.players.player2.fleet.length > 0) {
      this.status = 'in_progress';
    }

    return { success: true };
  };

  /**
   * Retorna o oponente de um jogador.
   */
  BatalhaNavalGame.prototype._opponent = function (playerId) {
    return playerId === 'player1' ? 'player2' : 'player1';
  };

  /**
   * Encontra qual navio está na célula [row, col] da frota do jogador alvo.
   */
  BatalhaNavalGame.prototype._findShipAt = function (targetPlayerId, row, col) {
    const fleet = this.players[targetPlayerId].fleet;
    for (const ship of fleet) {
      for (const [r, c] of ship.cells) {
        if (r === row && c === col) return ship;
      }
    }
    return null;
  };

  /**
   * Verifica se todos os navios do jogador alvo foram afundados.
   */
  BatalhaNavalGame.prototype._allShipsSunk = function (targetPlayerId) {
    const health = this.players[targetPlayerId].shipHealth;
    for (const key in health) {
      if (!health[key].sunk) return false;
    }
    return true;
  };

  /**
   * Processa um tiro.
   * Retorna: { result, shipName, isSunk, salvaRemaining, gameOver, winner,
   *            currentTurn, turnState, error }
   */
  BatalhaNavalGame.prototype.processShot = function (playerId, row, col) {
    // Validações
    if (this.status !== 'in_progress') {
      return { error: 'Jogo não está em andamento.' };
    }
    if (playerId !== this.currentTurn) {
      return { error: 'Não é seu turno. Turno atual: ' + this.currentTurn };
    }
    if (!isInBounds(row, col)) {
      return { error: 'Coordenada fora do tabuleiro: ' + toDisplay(row, col) };
    }

    var targetPlayerId = this._opponent(playerId);
    var key = row + ',' + col;

    if (this.players[targetPlayerId].shotsReceived[key]) {
      return { error: 'Você já atirou em ' + toDisplay(row, col) + '.' };
    }

    // Registrar tiro
    var ship = this._findShipAt(targetPlayerId, row, col);
    var result, shipName = null, isSunk = false, gameOver = false;

    if (!ship) {
      // ÁGUA
      result = 'agua';
      this.players[targetPlayerId].shotsReceived[key] = 'agua';
    } else {
      // ACERTOU
      var health = this.players[targetPlayerId].shipHealth[ship.instanceId];
      health.hits++;
      health.hitCells.push([row, col]);
      shipName = ship.name;

      if (health.hits >= health.total) {
        // AFUNDOU
        health.sunk = true;
        result = 'afundou';
        isSunk = true;
        this.players[targetPlayerId].shotsReceived[key] = 'afundou';
      } else {
        result = 'acertou';
        this.players[targetPlayerId].shotsReceived[key] = 'acertou';
      }
    }

    // Registrar no log
    this.shotLog.push({
      shooter: playerId,
      target: targetPlayerId,
      row: row,
      col: col,
      coord: toDisplay(row, col),
      result: result,
      shipName: shipName,
      isSunk: isSunk,
      turn: this.shotLog.length + 1,
    });

    // Checar vitória
    if (isSunk && this._allShipsSunk(targetPlayerId)) {
      gameOver = true;
      this.winner = playerId;
      this.status = 'finished';
      this.turnState = 'GAME_OVER';
      this.salvaRemaining = 0;
      return {
        result: result,
        shipName: shipName,
        isSunk: isSunk,
        salvaRemaining: 0,
        gameOver: true,
        winner: playerId,
        currentTurn: null,
        turnState: 'GAME_OVER',
      };
    }

    // Mecânica de salva
    if (this.turnState === 'AWAITING_SHOT' && (result === 'acertou' || result === 'afundou')) {
      // Primeiro acerto do turno → inicia salva com 3 tiros
      this.turnState = 'IN_SALVA';
      this.salvaRemaining = 3;
    } else if (this.turnState === 'IN_SALVA') {
      // Durante salva → decrementa (independente de acertar ou errar)
      this.salvaRemaining--;
      if (this.salvaRemaining <= 0) {
        // Salva esgotada → troca turno
        this.currentTurn = targetPlayerId;
        this.turnState = 'AWAITING_SHOT';
        this.salvaRemaining = 0;
      }
    } else if (this.turnState === 'AWAITING_SHOT' && result === 'agua') {
      // Miss fora de salva → troca turno
      this.currentTurn = targetPlayerId;
      this.turnState = 'AWAITING_SHOT';
      this.salvaRemaining = 0;
    }

    return {
      result: result,
      shipName: shipName,
      isSunk: isSunk,
      salvaRemaining: this.salvaRemaining,
      gameOver: false,
      winner: null,
      currentTurn: this.currentTurn,
      turnState: this.turnState,
    };
  };

  /**
   * Retorna o grid 15x15 do ponto de vista de um jogador atacando o oponente.
   * Cada célula: null (não atirou), 'agua', 'acertou', 'afundou'
   */
  BatalhaNavalGame.prototype.getAttackBoard = function (playerId) {
    var targetPlayerId = this._opponent(playerId);
    var shots = this.players[targetPlayerId].shotsReceived;
    var grid = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      var row = [];
      for (var c = 0; c < GRID_SIZE; c++) {
        row.push(shots[r + ',' + c] || null);
      }
      grid.push(row);
    }
    return grid;
  };

  /**
   * Retorna o grid 15x15 de defesa: posição dos navios + tiros recebidos.
   * Cada célula: null (vazio), 'ship' (navio intacto), 'hit' (navio atingido), 'sunk' (navio afundado), 'miss' (tiro na água)
   */
  BatalhaNavalGame.prototype.getDefenseBoard = function (playerId) {
    var player = this.players[playerId];
    var grid = [];
    for (var r = 0; r < GRID_SIZE; r++) {
      var rowArr = [];
      for (var c = 0; c < GRID_SIZE; c++) {
        rowArr.push(null);
      }
      grid.push(rowArr);
    }

    // Preencher navios
    for (var ship of player.fleet) {
      var health = player.shipHealth[ship.instanceId];
      for (var cell of ship.cells) {
        var r = cell[0], c = cell[1];
        if (health.sunk) {
          grid[r][c] = 'sunk';
        } else {
          var wasHit = health.hitCells.some(function (hc) { return hc[0] === r && hc[1] === c; });
          grid[r][c] = wasHit ? 'hit' : 'ship';
        }
      }
    }

    // Marcar tiros na água
    for (var key in player.shotsReceived) {
      if (player.shotsReceived[key] === 'agua') {
        var parts = key.split(',');
        grid[parseInt(parts[0])][parseInt(parts[1])] = 'miss';
      }
    }

    return grid;
  };

  /**
   * Retorna status resumido: navios restantes de cada jogador.
   */
  BatalhaNavalGame.prototype.getStatus = function () {
    var result = {};
    for (var pid of ['player1', 'player2']) {
      var health = this.players[pid].shipHealth;
      var ships = [];
      var totalShips = 0;
      var sunkShips = 0;
      for (var key in health) {
        totalShips++;
        var h = health[key];
        if (h.sunk) sunkShips++;
        ships.push({
          instanceId: key,
          name: this.players[pid].fleet.find(function (s) { return s.instanceId === key; }).name,
          health: h.total - h.hits,
          total: h.total,
          sunk: h.sunk,
        });
      }
      result[pid] = { ships: ships, totalShips: totalShips, sunkShips: sunkShips, remaining: totalShips - sunkShips };
    }
    return result;
  };

  /**
   * Renderiza um quadrante do tabuleiro em ASCII.
   * Quadrantes (grid 16x16):
   * Q1: A-H, 1-8 (superior esquerdo)
   * Q2: I-P, 1-8 (superior direito)
   * Q3: A-H, 9-16 (inferior esquerdo)
   * Q4: I-P, 9-16 (inferior direito)
   *
   * @param {string} playerId - ID do jogador
   * @param {number} quadrant - Número do quadrante (1-4)
   * @param {string} boardType - 'attack' ou 'defense'
   */
  BatalhaNavalGame.prototype.renderQuadrantASCII = function (playerId, quadrant, boardType) {
    var board = boardType === 'attack' ? this.getAttackBoard(playerId) : this.getDefenseBoard(playerId);

    // Define ranges based on quadrant
    var colStart, colEnd, rowStart, rowEnd;
    if (quadrant === 1) {
      colStart = 0; colEnd = 8; rowStart = 0; rowEnd = 8;
    } else if (quadrant === 2) {
      colStart = 8; colEnd = 16; rowStart = 0; rowEnd = 8;
    } else if (quadrant === 3) {
      colStart = 0; colEnd = 8; rowStart = 8; rowEnd = 16;
    } else if (quadrant === 4) {
      colStart = 8; colEnd = 16; rowStart = 8; rowEnd = 16;
    } else {
      return 'Quadrante inválido. Use 1-4.';
    }

    var lines = [];
    var title = boardType === 'attack'
      ? '🎯 Tabuleiro Inimigo (Quadrante ' + quadrant + ')'
      : '🛡️ Seu Tabuleiro (Quadrante ' + quadrant + ')';
    lines.push(title);
    lines.push('');

    // Header with column letters
    var header = '   ';
    for (var c = colStart; c < colEnd; c++) {
      header += ' ' + COLS[c];
    }
    lines.push(header);

    // Rows
    for (var r = rowStart; r < rowEnd; r++) {
      var rowNum = (r + 1).toString().padStart(2, ' ');
      var rowStr = rowNum + ' ';
      for (var c = colStart; c < colEnd; c++) {
        var cell = board[r][c];
        var char;

        if (boardType === 'attack') {
          // Attack board symbols
          if (cell === null) char = '~';  // Not explored
          else if (cell === 'agua') char = '·';  // Miss
          else if (cell === 'acertou') char = 'X';  // Hit
          else if (cell === 'afundou') char = '#';  // Sunk
          else char = '?';
        } else {
          // Defense board symbols
          if (cell === null) char = '~';  // Empty water
          else if (cell === 'ship') char = '■';  // Intact ship
          else if (cell === 'hit') char = 'X';  // Hit ship
          else if (cell === 'sunk') char = '#';  // Sunk ship
          else if (cell === 'miss') char = '·';  // Miss
          else char = '?';
        }

        rowStr += ' ' + char;
      }
      lines.push(rowStr);
    }

    // Legend
    lines.push('');
    if (boardType === 'attack') {
      lines.push('Legenda: ~ não explorado  · água  X acertou  # afundou');
    } else {
      lines.push('Legenda: ~ água  ■ navio  X atingido  # afundado  · tiro na água');
    }

    return lines.join('\n');
  };

  /**
   * Serializa o jogo para JSON (para persistência).
   */
  BatalhaNavalGame.prototype.toJSON = function () {
    return {
      id: this.id,
      status: this.status,
      players: {
        player1: {
          fleet: this.players.player1.fleet,
          shotsReceived: this.players.player1.shotsReceived,
          shipHealth: this.players.player1.shipHealth,
        },
        player2: {
          fleet: this.players.player2.fleet,
          shotsReceived: this.players.player2.shotsReceived,
          shipHealth: this.players.player2.shipHealth,
        },
      },
      currentTurn: this.currentTurn,
      turnState: this.turnState,
      salvaRemaining: this.salvaRemaining,
      winner: this.winner,
      shotLog: this.shotLog,
    };
  };

  /**
   * Restaura um jogo a partir de JSON.
   */
  BatalhaNavalGame.fromJSON = function (data) {
    var game = new BatalhaNavalGame();
    game.id = data.id;
    game.status = data.status;
    game.players = data.players;
    game.currentTurn = data.currentTurn;
    game.turnState = data.turnState;
    game.salvaRemaining = data.salvaRemaining;
    game.winner = data.winner;
    game.shotLog = data.shotLog || [];
    return game;
  };

  // ============================================================
  // EXPORTS
  // ============================================================

  return {
    BatalhaNavalGame: BatalhaNavalGame,
    autoPlace: autoPlace,
    autoPlaceWithRetry: autoPlaceWithRetry,
    toDisplay: toDisplay,
    toInternal: toInternal,
    validateCoordinate: validateCoordinate,
    GRID_SIZE: GRID_SIZE,
    COLS: COLS,
    SHIP_TYPES: SHIP_TYPES,
  };

});
