import { CELL, COLS, ROWS, W, W_, G, C, GHOST_DEFS, GHOST_SPEED, DIRS, MODE_CYCLE, ctx } from './constants.js';
import { state } from './state.js';
import { setMusicIntense } from './audio.js';

// ─── Setup ────────────────────────────────────────────────────────────────────

export function buildGhosts() {
  state.ghosts = GHOST_DEFS.map(d => ({
    ...d,
    x:             d.startCol * CELL + CELL / 2,
    y:             d.startRow * CELL + CELL / 2,
    dir:           { x: 0, y: -1 },
    state:         'HOUSE',
    exitTimer:     d.exitDelay,
    trail:         [],
    skirtPhase:    Math.random() * Math.PI * 2,
    recoveryTimer: 0,
  }));
}

// ─── Frightened mode ─────────────────────────────────────────────────────────

export function startFrightened() {
  state.frightenedTimer = 7 * 60;
  state.ghostEatChain   = 0;
  state.powerActive     = true;
  state.ghosts.forEach(g => {
    if (g.state === 'CHASE' || g.state === 'SCATTER') {
      g.state = 'FRIGHTENED';
      g.dir   = { x: -g.dir.x, y: -g.dir.y };
    }
  });
  setMusicIntense(true);
}

export function updateFrightened() {
  if (state.frightenedTimer > 0) {
    state.frightenedTimer--;
    if (state.frightenedTimer === 0) {
      state.ghostEatChain = 0;
      state.powerActive   = false;
      state.ghosts.forEach(g => { if (g.state === 'FRIGHTENED') g.state = 'CHASE'; });
      setMusicIntense(false);
    }
  }
}

// ─── Mode cycling ────────────────────────────────────────────────────────────

export function updateGhostModes() {
  if (state.gameState !== 'PLAYING') return;
  state.modeTimer++;
  if (state.modeTimer >= MODE_CYCLE[state.modeIndex].frames) {
    state.modeIndex = Math.min(state.modeIndex + 1, MODE_CYCLE.length - 1);
    state.modeTimer = 0;
    const mode = MODE_CYCLE[state.modeIndex].mode;
    state.ghosts.forEach(g => {
      if (g.state === 'CHASE' || g.state === 'SCATTER') g.state = mode;
    });
  }
}

// ─── Speed ───────────────────────────────────────────────────────────────────

export function getGhostSpeed(g) {
  const base = GHOST_SPEED + (state.level - 1) * 0.15;
  if (g.state === 'FRIGHTENED') return base * 0.55;
  if (g.state === 'EATEN')      return base * 2;
  return base;
}

// ─── AI helpers ──────────────────────────────────────────────────────────────

function canGhostMove(cx, cy, dir, gState) {
  const nx = cx + dir.x, ny = cy + dir.y;
  if (ny === 10 && (nx < 0 || nx >= COLS)) return true; // tunnel row
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) return false;
  const cell = state.maze[ny][nx];
  if (cell === W_) return false;
  // EATEN and RECOVERING can pass through ghost house; HOUSE can too
  if (cell === G && gState !== 'EATEN' && gState !== 'HOUSE' && gState !== 'RECOVERING') return false;
  return true;
}

function ghostTargetCell(g, index) {
  const corners = [{ c: 1, r: 1 }, { c: 19, r: 1 }, { c: 1, r: 21 }, { c: 19, r: 21 }];
  if (g.state === 'SCATTER') return corners[index];

  const pac = state.pac;
  const pc  = Math.round((pac.x - CELL / 2) / CELL);
  const pr  = Math.round((pac.y - CELL / 2) / CELL);

  switch (index) {
    case 0: return { c: pc, r: pr }; // Blinky — direct chase
    case 1: return { c: pc + pac.dir.x * 4, r: pr + pac.dir.y * 4 }; // Pinky — 4 tiles ahead
    case 2: { // Inky — flanker (uses Blinky position)
      const bx = Math.round((state.ghosts[0].x - CELL / 2) / CELL);
      const by = Math.round((state.ghosts[0].y - CELL / 2) / CELL);
      return { c: pc + (pc - bx), r: pr + (pr - by) };
    }
    case 3: { // Clyde — chase if far, scatter if close
      const dc   = Math.round((state.ghosts[3].x - CELL / 2) / CELL);
      const dr   = Math.round((state.ghosts[3].y - CELL / 2) / CELL);
      const dist = Math.hypot(dc - pc, dr - pr);
      return dist > 8 ? { c: pc, r: pr } : corners[3];
    }
    default: return { c: pc, r: pr };
  }
}

function chooseDirection(g, cx, cy, target, reverseDir) {
  let best = Infinity, bestDir = null;
  for (const d of DIRS) {
    if (reverseDir && d.x === reverseDir.x && d.y === reverseDir.y) continue;
    if (!canGhostMove(cx, cy, d, g.state)) continue;
    const dist = Math.hypot((cx + d.x) - target.c, (cy + d.y) - target.r);
    if (dist < best) { best = dist; bestDir = d; }
  }
  if (bestDir) g.dir = bestDir;
  else if (reverseDir) g.dir = reverseDir;
}

function updateGhostTrail(g) {
  g.trail.push({ x: g.x, y: g.y, alpha: 1 });
  if (g.trail.length > 6) g.trail.shift();
  g.trail.forEach(t => t.alpha *= 0.75);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function updateGhost(g, index) {
  updateGhostTrail(g);

  if (g.state === 'HOUSE') {
    g.exitTimer--;
    if (g.exitTimer <= 0) {
      g.state = 'CHASE';
      g.x     = 10 * CELL + CELL / 2;
      g.y     = 8  * CELL + CELL / 2;
      g.dir   = { x: 0, y: -1 };
    } else {
      g.y = g.startRow * CELL + CELL / 2 + Math.sin(state.animFrame * 0.08) * 3;
    }
    return;
  }

  // Ghost is regenerating in the house after being eaten
  if (g.state === 'RECOVERING') {
    g.recoveryTimer--;
    g.y = 10 * CELL + CELL / 2 + Math.sin(state.animFrame * 0.08) * 3;
    if (g.recoveryTimer <= 0) {
      g.state = 'CHASE';
      g.x     = 10 * CELL + CELL / 2;
      g.y     = 8  * CELL + CELL / 2;
      g.dir   = { x: 0, y: -1 };
    }
    return;
  }

  const speed   = getGhostSpeed(g);
  const cx      = Math.round((g.x - CELL / 2) / CELL);
  const cy      = Math.round((g.y - CELL / 2) / CELL);

  // Robust house-arrival check — fires every frame so high-speed ghosts
  // can't overshoot the cell-alignment window and stay stuck as EATEN.
  if (g.state === 'EATEN') {
    const houseX = 10 * CELL + CELL / 2; // pixel centre of col 10
    const gateY  = 8  * CELL + CELL / 2; // pixel centre of row 8 (entrance)
    if (Math.abs(g.x - houseX) < CELL && g.y >= gateY - speed) {
      g.state         = 'RECOVERING';
      g.recoveryTimer = 10 * 60;
      g.x             = houseX;
      g.y             = 10 * CELL + CELL / 2; // snap to house centre
      return;
    }
  }

  const aligned = Math.abs(g.x - (cx * CELL + CELL / 2)) < speed + 1
               && Math.abs(g.y - (cy * CELL + CELL / 2)) < speed + 1;

  if (aligned) {
    const prevDirX = g.dir.x, prevDirY = g.dir.y;

    if (g.state === 'EATEN') {
      chooseDirection(g, cx, cy, { c: 10, r: 8 }, null);
    } else if (g.state === 'FRIGHTENED') {
      const rev  = { x: -g.dir.x, y: -g.dir.y };
      const opts = DIRS.filter(d => canGhostMove(cx, cy, d, g.state) && !(d.x === rev.x && d.y === rev.y));
      if (opts.length) g.dir = opts[Math.floor(Math.random() * opts.length)];
      else if (canGhostMove(cx, cy, rev, g.state)) g.dir = rev;
    } else {
      const target = ghostTargetCell(g, index);
      const rev    = { x: -g.dir.x, y: -g.dir.y };
      chooseDirection(g, cx, cy, target, rev);
    }

    // Snap to grid centre only on direction change (prevents oscillation)
    if (g.dir.x !== prevDirX || g.dir.y !== prevDirY) {
      g.x = cx * CELL + CELL / 2;
      g.y = cy * CELL + CELL / 2;
    }
  }

  // Move
  const nx  = g.x + g.dir.x * speed;
  const ny  = g.y + g.dir.y * speed;
  const tcx = Math.floor((nx + g.dir.x * (CELL * 0.4)) / CELL);
  const tcy = Math.floor((ny + g.dir.y * (CELL * 0.4)) / CELL);
  const atTunnelRow = Math.round((g.y - CELL / 2) / CELL) === 10;
  if (atTunnelRow && (tcx < 0 || tcx >= COLS)) {
    g.x = nx; g.y = ny;
  } else if (tcx >= 0 && tcx < COLS && tcy >= 0 && tcy < ROWS
          && state.maze[tcy][tcx] !== W_
          && (state.maze[tcy][tcx] !== G || g.state === 'EATEN')) {
    g.x = nx; g.y = ny;
  }
  // Tunnel wrap
  if (g.x < -CELL)    g.x = W + CELL / 2;
  if (g.x > W + CELL) g.x = -CELL / 2;
}

// ─── Drawing helpers ─────────────────────────────────────────────────────────

function shiftColor(hex, amount) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return `rgb(${r},${g},${b})`;
}

function lighten(hex, amount) { return shiftColor(hex,  amount); }
function darken(hex,  amount) { return shiftColor(hex, -amount); }

function drawGhostEyes(x, y, dir, color) {
  const r      = CELL * 0.44;
  const eyeR   = r * 0.22;
  const pupilR = eyeR * 0.55;
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = '#fff';
  ctx.shadowBlur  = 4;
  ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.2, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.3, y - r * 0.2, eyeR, 0, Math.PI * 2); ctx.fill();
  const px = dir.x * pupilR * 0.7;
  const py = dir.y * pupilR * 0.7;
  ctx.fillStyle  = color || '#4444ff';
  ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(x - r * 0.3 + px, y - r * 0.2 + py, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.3 + px, y - r * 0.2 + py, pupilR, 0, Math.PI * 2); ctx.fill();
}

// ─── Draw ─────────────────────────────────────────────────────────────────────

export function drawGhost(g) {
  if (g.state === 'EATEN') {
    ctx.globalAlpha = 1;
    drawGhostEyes(g.x, g.y, g.dir, g.color);
    return;
  }

  // Pulsing transparency while regenerating in the ghost house
  if (g.state === 'RECOVERING') {
    ctx.globalAlpha = 0.4 + 0.35 * Math.abs(Math.sin(state.animFrame * 0.12));
  }

  const isScared   = g.state === 'FRIGHTENED';
  const isFlashing = state.frightenedTimer < 120 && state.frightenedTimer > 0 && isScared;
  const bodyColor  = isScared
    ? (isFlashing && Math.floor(state.animFrame / 8) % 2 === 0 ? C.scaredFlash : C.scared)
    : g.color;

  // Trail (behind body)
  g.trail.forEach(t => {
    ctx.globalAlpha = t.alpha * 0.4;
    ctx.fillStyle   = bodyColor;
    ctx.beginPath();
    ctx.arc(t.x, t.y, CELL * 0.28, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const r  = CELL * 0.44;
  const by = g.y - r * 1.1;
  const bw = r * 2;
  const bh = r * 2;

  ctx.shadowColor = bodyColor;
  ctx.shadowBlur  = 18;

  const grad = ctx.createLinearGradient(g.x, by, g.x, by + bh);
  grad.addColorStop(0,   lighten(bodyColor, 40));
  grad.addColorStop(0.5, bodyColor);
  grad.addColorStop(1,   darken(bodyColor, 40));
  ctx.fillStyle = grad;

  // Rounded top
  ctx.beginPath();
  ctx.arc(g.x, g.y - r * 0.3, r, Math.PI, 0);

  // Animated skirt
  g.skirtPhase += 0.08;
  ctx.lineTo(g.x + r, by + bh);
  for (let i = 1; i <= 30; i++) {
    const t2 = i / 30;
    const sx = (g.x + r) - t2 * bw;
    const sy = (by + bh) - Math.abs(Math.sin(t2 * Math.PI * 3 + g.skirtPhase)) * (r * 0.35);
    ctx.lineTo(sx, sy);
  }
  ctx.lineTo(g.x - r, by + bh - r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  if (!isScared) {
    drawGhostEyes(g.x, g.y - r * 0.15, g.dir, g.color);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(g.x - r * 0.3, g.y - r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(g.x + r * 0.3, g.y - r * 0.2, r * 0.12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1; // restore after possible RECOVERING transparency
}
