const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'game.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'positioning',
      current_turn TEXT DEFAULT 'player1',
      turn_state TEXT DEFAULT 'AWAITING_SHOT',
      salva_remaining INTEGER DEFAULT 0,
      winner TEXT,
      game_data TEXT,
      token_player1 TEXT,
      token_player2 TEXT
    );

    CREATE TABLE IF NOT EXISTS fleets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      player_id TEXT NOT NULL,
      ship_instance_id TEXT NOT NULL,
      ship_name TEXT NOT NULL,
      ship_size INTEGER NOT NULL,
      cells TEXT NOT NULL,
      health INTEGER NOT NULL,
      is_sunk INTEGER DEFAULT 0,
      FOREIGN KEY (match_id) REFERENCES matches(id),
      UNIQUE(match_id, player_id, ship_instance_id)
    );

    CREATE TABLE IF NOT EXISTS shots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      match_id TEXT NOT NULL,
      shooter_id TEXT NOT NULL,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      result TEXT NOT NULL,
      hit_ship_id TEXT,
      shot_order INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (match_id) REFERENCES matches(id)
    );

    CREATE INDEX IF NOT EXISTS idx_fleets_match ON fleets(match_id, player_id);
    CREATE INDEX IF NOT EXISTS idx_shots_match ON shots(match_id, shooter_id);
  `);
}

// Helper functions
function createMatch(matchId, token1, token2) {
  const db = getDb();
  const Engine = require('../engine/gameEngine');
  const game = new Engine.BatalhaNavalGame();
  game.id = matchId;

  db.prepare(`
    INSERT INTO matches (id, status, current_turn, turn_state, salva_remaining, game_data, token_player1, token_player2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(matchId, game.status, game.currentTurn, game.turnState, game.salvaRemaining, JSON.stringify(game.toJSON()), token1, token2);

  return { matchId, status: game.status };
}

function getMatch(matchId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!row) return null;

  return {
    ...row,
    gameData: JSON.parse(row.game_data)
  };
}

module.exports = { getDb, createMatch, getMatch };
