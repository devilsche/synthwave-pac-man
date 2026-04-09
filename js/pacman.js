import { CELL, COLS, ROWS, W, W_, G, E, P, PP, PAC_SPEED, C, ctx } from './constants.js';
import { state } from './state.js';
import { addScore } from './ui.js';
import { startFrightened } from './ghosts.js';
import { playChomp, playPowerUp } from './audio.js';

export function resetPac() {
  const pac      = state.pac;
  pac.x          = 10 * CELL + CELL / 2;
  pac.y          = 16 * CELL + CELL / 2;
  pac.dir        = { x: -1, y: 0 };
  pac.nextDir    = { x: -1, y: 0 };
  pac.dead       = false;
  pac.deathTimer = 0;
  pac.deathAngle = 0;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawPacDeath() {
  const pac      = state.pac;
  const progress = pac.deathTimer / 60;
  const r        = pac.radius * (1 - progress);
  if (r <= 0) return;
  ctx.save();
  ctx.translate(pac.x, pac.y);
  ctx.rotate(pac.deathAngle);
  ctx.globalAlpha = 1 - progress * 0.5;
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur  = 20;
  ctx.fillStyle   = `hsl(${40 - progress * 40}, 100%, 50%)`;
  ctx.beginPath();
  ctx.arc(0, 0, r, progress * Math.PI, Math.PI * 2 - progress * Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur  = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawPac() {
  const pac = state.pac;
  if (pac.dead) { drawPacDeath(); return; }

  let rot = 0;
  if      (pac.dir.x ===  1) rot = 0;
  else if (pac.dir.x === -1) rot = Math.PI;
  else if (pac.dir.y ===  1) rot = Math.PI / 2;
  else if (pac.dir.y === -1) rot = -Math.PI / 2;

  ctx.save();
  ctx.translate(pac.x, pac.y);
  ctx.rotate(rot);
  ctx.shadowColor = C.pac;
  ctx.shadowBlur  = 14;
  ctx.fillStyle   = C.pac;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, pac.radius, pac.mouthAngle * Math.PI, Math.PI * 2 - pac.mouthAngle * Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function updatePac() {
  const pac = state.pac;

  if (pac.dead) {
    pac.deathTimer++;
    pac.deathAngle += 0.18;
    return;
  }

  // Mouth animation
  if (pac.mouthOpen) {
    pac.mouthAngle += 0.07;
    if (pac.mouthAngle >= 0.40) pac.mouthOpen = false;
  } else {
    pac.mouthAngle -= 0.07;
    if (pac.mouthAngle <= 0.02) pac.mouthOpen = true;
  }

  // Try to turn in nextDir when grid-aligned
  const cx      = Math.round((pac.x - CELL / 2) / CELL);
  const cy      = Math.round((pac.y - CELL / 2) / CELL);
  const nx      = cx + pac.nextDir.x;
  const ny      = cy + pac.nextDir.y;
  const aligned = Math.abs(pac.x - (cx * CELL + CELL / 2)) < CELL * 0.4
               && Math.abs(pac.y - (cy * CELL + CELL / 2)) < CELL * 0.4;

  if (aligned && ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS
      && state.maze[ny][nx] !== W_ && state.maze[ny][nx] !== G) {
    if (pac.dir.x !== pac.nextDir.x || pac.dir.y !== pac.nextDir.y) {
      pac.dir = { ...pac.nextDir };
      pac.x   = cx * CELL + CELL / 2;
      pac.y   = cy * CELL + CELL / 2;
    }
  }

  // Move
  const tx  = pac.x + pac.dir.x * PAC_SPEED;
  const ty  = pac.y + pac.dir.y * PAC_SPEED;
  const tcx = Math.floor((tx + pac.dir.x * (pac.radius - 2)) / CELL);
  const tcy = Math.floor((ty + pac.dir.y * (pac.radius - 2)) / CELL);

  const onTunnelRow = Math.round((pac.y - CELL / 2) / CELL) === 10;
  if (onTunnelRow && (tcx < 0 || tcx >= COLS)) {
    pac.x = tx; pac.y = ty;
  } else if (tcx >= 0 && tcx < COLS && tcy >= 0 && tcy < ROWS
          && state.maze[tcy][tcx] !== W_ && state.maze[tcy][tcx] !== G) {
    pac.x = tx; pac.y = ty;
  }

  // Tunnel wrap
  if (pac.x < -CELL)    pac.x = W + CELL / 2;
  if (pac.x > W + CELL) pac.x = -CELL / 2;

  // Eat pellets
  const pr  = Math.round((pac.y - CELL / 2) / CELL);
  const pc2 = Math.round((pac.x - CELL / 2) / CELL);
  if (pr >= 0 && pr < ROWS && pc2 >= 0 && pc2 < COLS) {
    if (state.maze[pr][pc2] === P) {
      state.maze[pr][pc2] = E;
      state.pelletCount--;
      addScore(10);
      playChomp();
    } else if (state.maze[pr][pc2] === PP) {
      state.maze[pr][pc2] = E;
      state.pelletCount--;
      addScore(50);
      startFrightened();
      playPowerUp();
    }
  }
}
