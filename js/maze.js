import { CELL, COLS, ROWS, W, H, W_, P, PP, MAZE_TEMPLATE, C, ctx } from './constants.js';
import { state } from './state.js';

export function buildMaze() {
  return MAZE_TEMPLATE.map(row => [...row]);
}

export function countPellets() {
  state.pelletCount  = 0;
  state.totalPellets = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      if (state.maze[r][c] === P || state.maze[r][c] === PP) {
        state.pelletCount++;
        state.totalPellets++;
      }
}

// ─── Private drawing helpers ─────────────────────────────────────────────────

function isWall(c, r) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false;
  return state.maze[r][c] === W_;
}

function drawWallEdges(c, r, x, y) {
  ctx.strokeStyle = C.wallGlow;
  ctx.lineWidth   = 2;
  ctx.shadowColor = C.wallGlow;
  ctx.shadowBlur  = 8;
  ctx.beginPath();
  if (!isWall(c, r - 1)) { ctx.moveTo(x,        y);        ctx.lineTo(x + CELL, y); }
  if (!isWall(c, r + 1)) { ctx.moveTo(x,        y + CELL); ctx.lineTo(x + CELL, y + CELL); }
  if (!isWall(c - 1, r)) { ctx.moveTo(x,        y);        ctx.lineTo(x, y + CELL); }
  if (!isWall(c + 1, r)) { ctx.moveTo(x + CELL, y);        ctx.lineTo(x + CELL, y + CELL); }
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawPellet(x, y) {
  ctx.shadowColor = C.pellet;
  ctx.shadowBlur  = 6;
  ctx.fillStyle   = C.pellet;
  ctx.beginPath();
  ctx.arc(x, y, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawPowerPellet(x, y) {
  const pulse = 1 + 0.25 * Math.sin(state.animFrame * 0.1);
  ctx.shadowColor = C.power;
  ctx.shadowBlur  = 16;
  ctx.fillStyle   = C.power;
  ctx.beginPath();
  ctx.arc(x, y, 5 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export function drawMaze() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(199,125,255,0.04)';
  ctx.lineWidth   = 0.5;
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke();
  }
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke();
  }

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x    = c * CELL;
      const y    = r * CELL;
      const cell = state.maze[r][c];
      if      (cell === W_) { ctx.fillStyle = C.wall; ctx.fillRect(x, y, CELL, CELL); drawWallEdges(c, r, x, y); }
      else if (cell === P)  { drawPellet(x + CELL / 2, y + CELL / 2); }
      else if (cell === PP) { drawPowerPellet(x + CELL / 2, y + CELL / 2); }
    }
  }
}
