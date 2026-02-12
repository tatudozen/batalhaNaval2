import { useState, useCallback, useMemo } from "react";

const GRID_SIZE = 15;
const COLS = "ABCDEFGHIJKLMNO".split("");
const ROWS = Array.from({ length: GRID_SIZE }, (_, i) => i + 1);

const SHIP_TYPES = [
  { id: "carrier", name: "Porta-aviões", size: 5, count: 1, color: "#6366f1", shape: "linear" },
  { id: "cruiser", name: "Cruzador", size: 4, count: 2, color: "#3b82f6", shape: "linear" },
  { id: "destroyer", name: "Destroyer", size: 2, count: 3, color: "#22c55e", shape: "linear" },
  { id: "submarine", name: "Submarino", size: 1, count: 4, color: "#eab308", shape: "linear" },
  { id: "seaplane", name: "Hidroavião", size: 3, count: 5, color: "#f97316", shape: "triangle" },
];

// Hidroavião: forma de V (ápice + 2 asas diagonais)
// Ex: B1(ápice), A2, C2 → (0,0), (1,-1), (1,1)
const TRIANGLE_ROTATIONS = [
  [[0, 0], [1, -1], [1, 1]],   // ápice em cima, asas embaixo
  [[0, 0], [-1, -1], [1, -1]], // ápice à direita, asas à esquerda
  [[0, 0], [-1, -1], [-1, 1]], // ápice embaixo, asas em cima
  [[0, 0], [-1, 1], [1, 1]],   // ápice à esquerda, asas à direita
];

const LINEAR_ORIENTATIONS = [
  (r, c, size) => Array.from({ length: size }, (_, i) => [r, c + i]), // horizontal
  (r, c, size) => Array.from({ length: size }, (_, i) => [r + i, c]), // vertical
];

function getCells(shipType, row, col, rotation) {
  if (shipType.shape === "triangle") {
    const offsets = TRIANGLE_ROTATIONS[rotation % TRIANGLE_ROTATIONS.length];
    return offsets.map(([dr, dc]) => [row + dr, col + dc]);
  }
  const orient = LINEAR_ORIENTATIONS[rotation % 2];
  return orient(row, col, shipType.size);
}

function isInBounds(cells) {
  return cells.every(([r, c]) => r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE);
}

function getAdjacentCells(cells) {
  const adj = new Set();
  const cellSet = new Set(cells.map(([r, c]) => `${r},${c}`));
  for (const [r, c] of cells) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const key = `${r + dr},${c + dc}`;
        if (!cellSet.has(key)) adj.add(key);
      }
    }
  }
  return adj;
}

function canPlace(cells, occupiedMap, placedShips, excludeShipId = null) {
  if (!isInBounds(cells)) return false;
  const cellKeys = cells.map(([r, c]) => `${r},${c}`);

  // Check overlap
  for (const key of cellKeys) {
    if (occupiedMap.has(key) && occupiedMap.get(key) !== excludeShipId) return false;
  }

  // Check adjacency to other ships
  const adj = getAdjacentCells(cells);
  for (const key of adj) {
    if (occupiedMap.has(key) && occupiedMap.get(key) !== excludeShipId) return false;
  }

  return true;
}

function buildOccupiedMap(placedShips) {
  const map = new Map();
  for (const ship of placedShips) {
    for (const [r, c] of ship.cells) {
      map.set(`${r},${c}`, ship.instanceId);
    }
  }
  return map;
}

function autoPlace(shipTypes) {
  const placed = [];
  const allShips = [];
  for (const type of shipTypes) {
    for (let i = 0; i < type.count; i++) {
      allShips.push({ ...type, instanceId: `${type.id}-${i}` });
    }
  }

  // Sort by size descending for better placement
  allShips.sort((a, b) => b.size - a.size);

  for (const ship of allShips) {
    const maxRot = ship.shape === "triangle" ? 4 : 2;
    let success = false;
    let attempts = 0;

    while (!success && attempts < 500) {
      attempts++;
      const row = Math.floor(Math.random() * GRID_SIZE);
      const col = Math.floor(Math.random() * GRID_SIZE);
      const rot = Math.floor(Math.random() * maxRot);
      const cells = getCells(ship, row, col, rot);
      const occMap = buildOccupiedMap(placed);

      if (canPlace(cells, occMap, placed)) {
        placed.push({ ...ship, cells, rotation: rot, row, col });
        success = true;
      }
    }

    if (!success) return null; // failed
  }

  return placed;
}

export default function BatalhaNavalPositioning() {
  const [placedShips, setPlacedShips] = useState([]);
  const [selectedShipType, setSelectedShipType] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [hoveredCells, setHoveredCells] = useState([]);
  const [hoverValid, setHoverValid] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [movingShipId, setMovingShipId] = useState(null);

  const occupiedMap = useMemo(() => buildOccupiedMap(placedShips), [placedShips]);

  const placedCounts = useMemo(() => {
    const counts = {};
    for (const ship of placedShips) {
      counts[ship.id] = (counts[ship.id] || 0) + 1;
    }
    return counts;
  }, [placedShips]);

  const allPlaced = useMemo(() => {
    return SHIP_TYPES.every((t) => (placedCounts[t.id] || 0) >= t.count);
  }, [placedCounts]);

  const getNextInstanceId = useCallback(
    (typeId) => {
      const existing = placedShips.filter((s) => s.id === typeId);
      const usedIndices = existing.map((s) => parseInt(s.instanceId.split("-")[1]));
      for (let i = 0; ; i++) {
        if (!usedIndices.includes(i)) return `${typeId}-${i}`;
      }
    },
    [placedShips]
  );

  const handleCellHover = useCallback(
    (row, col) => {
      if (confirmed) return;
      if (!selectedShipType && !movingShipId) {
        setHoveredCells([]);
        return;
      }

      const shipType = movingShipId
        ? placedShips.find((s) => s.instanceId === movingShipId)
        : selectedShipType;

      if (!shipType) return;

      const cells = getCells(shipType, row, col, rotation);
      const excludeId = movingShipId || null;
      const valid = canPlace(cells, occupiedMap, placedShips, excludeId);
      setHoveredCells(cells);
      setHoverValid(valid);
    },
    [selectedShipType, rotation, occupiedMap, placedShips, confirmed, movingShipId]
  );

  const handleCellClick = useCallback(
    (row, col) => {
      if (confirmed) return;

      // If clicking on placed ship, pick it up
      const key = `${row},${col}`;
      if (!selectedShipType && !movingShipId && occupiedMap.has(key)) {
        const shipId = occupiedMap.get(key);
        const ship = placedShips.find((s) => s.instanceId === shipId);
        if (ship) {
          setMovingShipId(shipId);
          setRotation(ship.rotation || 0);
          return;
        }
      }

      const shipType = movingShipId
        ? placedShips.find((s) => s.instanceId === movingShipId)
        : selectedShipType;

      if (!shipType) return;

      const cells = getCells(shipType, row, col, rotation);
      const excludeId = movingShipId || null;

      if (!canPlace(cells, occupiedMap, placedShips, excludeId)) return;

      if (movingShipId) {
        // Move existing ship
        setPlacedShips((prev) =>
          prev.map((s) =>
            s.instanceId === movingShipId ? { ...s, cells, rotation, row, col } : s
          )
        );
        setMovingShipId(null);
        setHoveredCells([]);
      } else {
        // Place new ship
        const instanceId = getNextInstanceId(shipType.id);
        setPlacedShips((prev) => [
          ...prev,
          { ...shipType, instanceId, cells, rotation, row, col },
        ]);

        // Auto-select next unplaced ship
        const newCount = (placedCounts[shipType.id] || 0) + 1;
        if (newCount >= shipType.count) {
          const nextType = SHIP_TYPES.find(
            (t) => t.id !== shipType.id && (placedCounts[t.id] || 0) < t.count
          );
          setSelectedShipType(nextType || null);
        }
      }
    },
    [
      selectedShipType,
      rotation,
      occupiedMap,
      placedShips,
      confirmed,
      placedCounts,
      getNextInstanceId,
      movingShipId,
    ]
  );

  const handleRotate = () => {
    const shipType = movingShipId
      ? placedShips.find((s) => s.instanceId === movingShipId)
      : selectedShipType;
    if (!shipType) return;
    const maxRot = shipType.shape === "triangle" ? 4 : 2;
    setRotation((r) => (r + 1) % maxRot);
  };

  const handleRemoveShip = (instanceId) => {
    if (confirmed) return;
    setPlacedShips((prev) => prev.filter((s) => s.instanceId !== instanceId));
    if (movingShipId === instanceId) setMovingShipId(null);
  };

  const handleAutoPlace = () => {
    if (confirmed) return;
    let result = null;
    for (let attempt = 0; attempt < 10; attempt++) {
      result = autoPlace(SHIP_TYPES);
      if (result) break;
    }
    if (result) {
      setPlacedShips(result);
      setSelectedShipType(null);
      setMovingShipId(null);
    } else {
      alert("Não foi possível posicionar automaticamente. Tente novamente.");
    }
  };

  const handleConfirm = () => {
    if (!allPlaced) return;
    setConfirmed(true);
    setSelectedShipType(null);
    setMovingShipId(null);
    setHoveredCells([]);
  };

  const handleReset = () => {
    setPlacedShips([]);
    setSelectedShipType(null);
    setMovingShipId(null);
    setRotation(0);
    setConfirmed(false);
    setHoveredCells([]);
  };

  const shipColorMap = useMemo(() => {
    const map = new Map();
    for (const ship of placedShips) {
      for (const [r, c] of ship.cells) {
        map.set(`${r},${c}`, {
          color: ship.color,
          instanceId: ship.instanceId,
          isMoving: ship.instanceId === movingShipId,
        });
      }
    }
    return map;
  }, [placedShips, movingShipId]);

  const hoveredSet = useMemo(() => new Set(hoveredCells.map(([r, c]) => `${r},${c}`)), [hoveredCells]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0", padding: "20px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4, color: "#94a3b8" }}>
          Batalha Naval
        </h1>
        <p style={{ fontSize: 14, color: "#64748b", marginBottom: 20 }}>
          Posicionamento da Esquadra
        </p>

        {confirmed && (
          <div style={{
            background: "#166534",
            border: "1px solid #22c55e",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>Esquadra confirmada e bloqueada.</span>
            <button onClick={handleReset} style={{
              background: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
              fontSize: 13,
            }}>
              Resetar
            </button>
          </div>
        )}

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {/* Grid */}
          <div>
            <div style={{ display: "inline-block" }}>
              {/* Column headers */}
              <div style={{ display: "flex" }}>
                <div style={{ width: 30 }} />
                {COLS.map((col) => (
                  <div
                    key={col}
                    style={{
                      width: 32,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {col}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {ROWS.map((rowNum, ri) => (
                <div key={ri} style={{ display: "flex" }}>
                  <div
                    style={{
                      width: 30,
                      height: 32,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      color: "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {rowNum}
                  </div>
                  {COLS.map((_, ci) => {
                    const key = `${ri},${ci}`;
                    const shipInfo = shipColorMap.get(key);
                    const isHovered = hoveredSet.has(key);
                    const isOccupied = !!shipInfo;
                    const isMovingShip = shipInfo?.isMoving;

                    let bg = "#1e293b";
                    let border = "1px solid #334155";
                    let opacity = 1;

                    if (isOccupied && !isMovingShip) {
                      bg = shipInfo.color;
                      opacity = 0.85;
                    }
                    if (isMovingShip) {
                      bg = shipInfo.color;
                      opacity = 0.3;
                    }
                    if (isHovered) {
                      bg = hoverValid ? "#22c55e" : "#dc2626";
                      opacity = 0.6;
                      border = hoverValid ? "1px solid #4ade80" : "1px solid #f87171";
                    }

                    return (
                      <div
                        key={ci}
                        onMouseEnter={() => handleCellHover(ri, ci)}
                        onMouseLeave={() => { setHoveredCells([]); setHoverValid(false); }}
                        onClick={() => handleCellClick(ri, ci)}
                        style={{
                          width: 32,
                          height: 32,
                          background: bg,
                          border,
                          borderRadius: 3,
                          cursor: confirmed ? "default" : "pointer",
                          opacity,
                          transition: "all 0.1s ease",
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Grid controls */}
            {!confirmed && (
              <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={handleRotate}
                  disabled={!selectedShipType && !movingShipId}
                  style={{
                    background: selectedShipType || movingShipId ? "#475569" : "#1e293b",
                    color: selectedShipType || movingShipId ? "#e2e8f0" : "#475569",
                    border: "1px solid #475569",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: selectedShipType || movingShipId ? "pointer" : "default",
                    fontSize: 13,
                  }}
                >
                  Rotacionar (R)
                </button>
                <button
                  onClick={handleAutoPlace}
                  style={{
                    background: "#1e40af",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Distribuir automaticamente
                </button>
                <button
                  onClick={handleReset}
                  style={{
                    background: "#7f1d1d",
                    color: "#fca5a5",
                    border: "1px solid #991b1b",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Limpar tudo
                </button>
              </div>
            )}
          </div>

          {/* Ship panel */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#94a3b8" }}>
              Esquadra
            </h2>

            {SHIP_TYPES.map((type) => {
              const count = placedCounts[type.id] || 0;
              const remaining = type.count - count;
              const isSelected = selectedShipType?.id === type.id;

              return (
                <div key={type.id} style={{ marginBottom: 12 }}>
                  <div
                    onClick={() => {
                      if (confirmed || remaining <= 0) return;
                      setMovingShipId(null);
                      setSelectedShipType(isSelected ? null : type);
                      setRotation(0);
                    }}
                    style={{
                      background: isSelected ? "#1e3a5f" : "#1e293b",
                      border: isSelected ? `2px solid ${type.color}` : "1px solid #334155",
                      borderRadius: 8,
                      padding: "10px 14px",
                      cursor: confirmed || remaining <= 0 ? "default" : "pointer",
                      opacity: remaining <= 0 ? 0.5 : 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            background: type.color,
                            marginRight: 8,
                          }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{type.name}</span>
                        <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>
                          {type.size} cel{type.size > 1 ? "s" : ""} · {type.shape === "triangle" ? "triangular" : "linear"}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, color: remaining > 0 ? "#4ade80" : "#64748b" }}>
                        {count}/{type.count}
                      </span>
                    </div>

                    {/* Shape preview */}
                    <div style={{ marginTop: 6, display: "flex", gap: 2 }}>
                      {type.shape === "linear" ? (
                        Array.from({ length: type.size }, (_, i) => (
                          <div
                            key={i}
                            style={{
                              width: 14,
                              height: 14,
                              background: type.color,
                              borderRadius: 2,
                              opacity: 0.6,
                            }}
                          />
                        ))
                      ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "14px 14px 14px", gap: 2 }}>
                          <div style={{ width: 14, height: 14 }} />
                          <div style={{ width: 14, height: 14, background: type.color, borderRadius: 2, opacity: 0.6 }} />
                          <div style={{ width: 14, height: 14 }} />
                          <div style={{ width: 14, height: 14, background: type.color, borderRadius: 2, opacity: 0.6 }} />
                          <div style={{ width: 14, height: 14 }} />
                          <div style={{ width: 14, height: 14, background: type.color, borderRadius: 2, opacity: 0.6 }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Placed instances */}
                  {placedShips
                    .filter((s) => s.id === type.id)
                    .map((ship) => (
                      <div
                        key={ship.instanceId}
                        style={{
                          fontSize: 12,
                          color: "#94a3b8",
                          marginTop: 4,
                          marginLeft: 12,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ opacity: ship.instanceId === movingShipId ? 0.4 : 1 }}>
                          {ship.cells.map(([r, c]) => `${COLS[c]}${r + 1}`).join(", ")}
                        </span>
                        {!confirmed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveShip(ship.instanceId);
                            }}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              fontSize: 12,
                              padding: "2px 6px",
                            }}
                          >
                            remover
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              );
            })}

            {/* Confirm button */}
            {!confirmed && (
              <button
                onClick={handleConfirm}
                disabled={!allPlaced}
                style={{
                  marginTop: 16,
                  width: "100%",
                  padding: "12px",
                  background: allPlaced ? "#16a34a" : "#1e293b",
                  color: allPlaced ? "white" : "#475569",
                  border: allPlaced ? "none" : "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: allPlaced ? "pointer" : "default",
                  transition: "all 0.15s ease",
                }}
              >
                {allPlaced ? "Confirmar Esquadra" : `Posicione todos os navios (${placedShips.length}/${SHIP_TYPES.reduce((a, t) => a + t.count, 0)})`}
              </button>
            )}

            {/* Instructions */}
            {!confirmed && (
              <div style={{
                marginTop: 16,
                padding: 12,
                background: "#1e293b",
                borderRadius: 8,
                fontSize: 12,
                color: "#64748b",
                lineHeight: 1.6,
              }}>
                <strong style={{ color: "#94a3b8" }}>Como usar:</strong><br />
                1. Selecione um navio no painel<br />
                2. Clique no grid para posicionar<br />
                3. Use "Rotacionar" para mudar orientação<br />
                4. Clique num navio já posicionado para mover<br />
                5. Confirme quando todos estiverem posicionados
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
