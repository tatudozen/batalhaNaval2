const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');
const Engine = require('../engine/gameEngine');

const router = express.Router();

// ============================================================
// MIDDLEWARE - Validar Token
// ============================================================
function validateToken(req, res, next) {
  const db = getDb();
  const { id } = req.params;
  const playerId = req.body.playerId || req.query.playerId;
  const token = req.body.token || req.query.token;

  // Skip validation if no token provided (backward compatibility for local testing)
  if (!token) {
    console.warn(`[WARNING] No token provided for match ${id}, playerId ${playerId}`);
    return next();
  }

  const matchRow = db.prepare('SELECT token_player1, token_player2 FROM matches WHERE id = ?').get(id);
  if (!matchRow) {
    return res.status(404).json({ error: 'Partida não encontrada.' });
  }

  const expectedToken = playerId === 'player1' ? matchRow.token_player1 : matchRow.token_player2;

  if (token !== expectedToken) {
    return res.status(403).json({ error: 'Token inválido. Acesso negado.' });
  }

  next();
}

// ============================================================
// POST /api/matches — Criar partida
// ============================================================
router.post('/matches', (req, res) => {
  const db = getDb();
  const id = 'match-' + uuidv4().slice(0, 8);
  const tokenPlayer1 = uuidv4();
  const tokenPlayer2 = uuidv4();
  const game = new Engine.BatalhaNavalGame();
  game.id = id;

  db.prepare(`
    INSERT INTO matches (id, status, current_turn, turn_state, salva_remaining, game_data, token_player1, token_player2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, game.status, game.currentTurn, game.turnState, game.salvaRemaining, JSON.stringify(game.toJSON()), tokenPlayer1, tokenPlayer2);

  const baseUrl = req.protocol + '://' + req.get('host');

  res.json({
    matchId: id,
    status: game.status,
    tokens: {
      player1: tokenPlayer1,
      player2: tokenPlayer2,
    },
    links: {
      player1: `${baseUrl}/posicionamento.html?match=${id}&player=player1&token=${tokenPlayer1}`,
      player2: `${baseUrl}/posicionamento.html?match=${id}&player=player2&token=${tokenPlayer2}`,
    },
  });
});

// ============================================================
// POST /api/matches/:id/fleets — Registrar esquadra
// ============================================================
router.post('/matches/:id/fleets', validateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { playerId, ships } = req.body;

  if (!playerId || !ships || !Array.isArray(ships)) {
    return res.status(400).json({ error: 'playerId e ships são obrigatórios.' });
  }

  // Load game state
  const row = db.prepare('SELECT game_data FROM matches WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Partida não encontrada.' });

  const game = Engine.BatalhaNavalGame.fromJSON(JSON.parse(row.game_data));
  const result = game.setFleet(playerId, ships);
  if (result.error) return res.status(400).json(result);

  // Store fleet in fleets table
  const insert = db.prepare(`
    INSERT OR REPLACE INTO fleets (match_id, player_id, ship_instance_id, ship_name, ship_size, cells, health, is_sunk)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0)
  `);

  const tx = db.transaction(() => {
    for (const ship of ships) {
      insert.run(id, playerId, ship.instanceId, ship.name, ship.size || ship.cells.length, JSON.stringify(ship.cells), ship.cells.length);
    }
    // Update game state
    db.prepare(`
      UPDATE matches SET status = ?, game_data = ? WHERE id = ?
    `).run(game.status, JSON.stringify(game.toJSON()), id);
  });
  tx();

  // Notify WhatsApp if game is starting
  if (game.status === 'in_progress') {
    const { getWhatsAppController } = require('./server');
    const controller = getWhatsAppController();
    if (controller) {
      setTimeout(() => {
        controller.notifyGameStart(id).catch(err => console.error('Erro ao notificar WhatsApp:', err));
      }, 100);
    }
  }

  res.json({ success: true, gameStatus: game.status });
});

// ============================================================
// POST /api/matches/:id/shot — Disparar tiro
// ============================================================
router.post('/matches/:id/shot', validateToken, (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const { playerId, row, col, coord } = req.body;

  if (!playerId) {
    return res.status(400).json({ error: 'playerId é obrigatório.' });
  }

  let finalRow, finalCol;

  // Support both formats: {row, col} or {coord: "A5"}
  if (coord !== undefined) {
    const validation = Engine.validateCoordinate(coord);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    finalRow = validation.row;
    finalCol = validation.col;
  } else if (row !== undefined && col !== undefined) {
    // Validate numeric coordinates
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      return res.status(400).json({ error: 'row e col devem ser números inteiros.' });
    }
    if (row < 0 || row >= Engine.GRID_SIZE || col < 0 || col >= Engine.GRID_SIZE) {
      return res.status(400).json({ error: 'Coordenadas fora dos limites do tabuleiro.' });
    }
    finalRow = row;
    finalCol = col;
  } else {
    return res.status(400).json({ error: 'É necessário informar "coord" (ex: "A5") ou "row" e "col".' });
  }

  // Load game
  const matchRow = db.prepare('SELECT game_data FROM matches WHERE id = ?').get(id);
  if (!matchRow) return res.status(404).json({ error: 'Partida não encontrada.' });

  const game = Engine.BatalhaNavalGame.fromJSON(JSON.parse(matchRow.game_data));
  const result = game.processShot(playerId, finalRow, finalCol);

  if (result.error) return res.status(400).json(result);

  // Persist
  const shotOrder = game.shotLog.length;
  db.prepare(`
    INSERT INTO shots (match_id, shooter_id, row, col, result, hit_ship_id, shot_order)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, playerId, row, col, result.result, result.shipName || null, shotOrder);

  // Update fleet health if hit
  if (result.result === 'acertou' || result.result === 'afundou') {
    const targetPlayer = playerId === 'player1' ? 'player2' : 'player1';
    const targetHealth = game.players[targetPlayer].shipHealth;
    for (const shipId in targetHealth) {
      const h = targetHealth[shipId];
      db.prepare(`
        UPDATE fleets SET health = ?, is_sunk = ? WHERE match_id = ? AND player_id = ? AND ship_instance_id = ?
      `).run(h.total - h.hits, h.sunk ? 1 : 0, id, targetPlayer, shipId);
    }
  }

  // Update match state
  db.prepare(`
    UPDATE matches SET status = ?, current_turn = ?, turn_state = ?, salva_remaining = ?, winner = ?, game_data = ?
    WHERE id = ?
  `).run(game.status, game.currentTurn, game.turnState, game.salvaRemaining, game.winner, JSON.stringify(game.toJSON()), id);

  res.json(result);
});

// ============================================================
// GET /api/matches/:id/players — Status dos jogadores
// ============================================================
router.get('/matches/:id/players', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const matchRow = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
  if (!matchRow) return res.status(404).json({ error: 'Partida não encontrada.' });

  // Check if players have fleets
  const player1Fleet = db.prepare('SELECT COUNT(*) as count FROM fleets WHERE match_id = ? AND player_id = ?').get(id, 'player1');
  const player2Fleet = db.prepare('SELECT COUNT(*) as count FROM fleets WHERE match_id = ? AND player_id = ?').get(id, 'player2');

  res.json({
    matchId: id,
    status: matchRow.status,
    players: {
      player1: {
        ready: player1Fleet.count > 0,
        shipCount: player1Fleet.count,
      },
      player2: {
        ready: player2Fleet.count > 0,
        shipCount: player2Fleet.count,
      },
    },
  });
});

// ============================================================
// GET /api/matches/:id/state — Estado completo
// ============================================================
router.get('/matches/:id/state', (req, res) => {
  const db = getDb();
  const { id } = req.params;

  const matchRow = db.prepare('SELECT * FROM matches WHERE id = ?').get(id);
  if (!matchRow) return res.status(404).json({ error: 'Partida não encontrada.' });

  const game = Engine.BatalhaNavalGame.fromJSON(JSON.parse(matchRow.game_data));

  res.json({
    matchId: id,
    status: game.status,
    currentTurn: game.currentTurn,
    turnState: game.turnState,
    salvaRemaining: game.salvaRemaining,
    winner: game.winner,
    shotLog: game.shotLog,
    gameStatus: game.getStatus(),
  });
});

// ============================================================
// GET /api/matches/:id/board/:playerId — Tabuleiros do jogador
// ============================================================
router.get('/matches/:id/board/:playerId', (req, res) => {
  const db = getDb();
  const { id, playerId } = req.params;
  const token = req.query.token;

  const matchRow = db.prepare('SELECT game_data, token_player1, token_player2 FROM matches WHERE id = ?').get(id);
  if (!matchRow) return res.status(404).json({ error: 'Partida não encontrada.' });

  // Validate token if provided
  if (token) {
    const expectedToken = playerId === 'player1' ? matchRow.token_player1 : matchRow.token_player2;
    if (token !== expectedToken) {
      return res.status(403).json({ error: 'Token inválido. Acesso negado.' });
    }
  }

  const game = Engine.BatalhaNavalGame.fromJSON(JSON.parse(matchRow.game_data));

  res.json({
    attackBoard: game.getAttackBoard(playerId),
    defenseBoard: game.getDefenseBoard(playerId),
  });
});

module.exports = router;
