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

function drawPowerTrail() {
  state.pacTrail.forEach(t => {
    ctx.save();
    ctx.globalAlpha = t.alpha * 0.7;
    ctx.shadowColor = '#00f5ff';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#00f5ff';
    ctx.beginPath();
    ctx.arc(t.x, t.y, state.pac.radius * 0.55 * t.alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawPowerShine(pac) {
  const pulse     = 1 + 0.3 * Math.sin(state.animFrame * 0.22);
  const numRays   = 8;
  const innerR    = pac.radius * 1.1;
  const outerR    = pac.radius * (1.9 + 0.4 * pulse);
  ctx.save();
  ctx.translate(pac.x, pac.y);
  ctx.rotate(state.animFrame * 0.04);
  ctx.shadowColor = '#ffe000';
  ctx.shadowBlur  = 18;
  for (let i = 0; i < numRays; i++) {
    const angle = (i / numRays) * Math.PI * 2;
    const ax    = Math.cos(angle), ay = Math.sin(angle);
    const spread = Math.PI / (numRays * 2.5);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,224,0,0.75)' : 'rgba(0,245,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(ax * innerR, ay * innerR);
    ctx.lineTo(Math.cos(angle - spread) * outerR, Math.sin(angle - spread) * outerR);
    ctx.lineTo(Math.cos(angle + spread) * outerR, Math.sin(angle + spread) * outerR);
    ctx.closePath();
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawPac() {
  const pac = state.pac;
  if (pac.dead) { drawPacDeath(); return; }

  if (state.powerActive) {
    drawPowerTrail();
    drawPowerShine(pac);
  }

  let rot = 0;
  if      (pac.dir.x ===  1) rot = 0;
  else if (pac.dir.x === -1) rot = Math.PI;
  else if (pac.dir.y ===  1) rot = Math.PI / 2;
  else if (pac.dir.y === -1) rot = -Math.PI / 2;

  ctx.save();
  ctx.translate(pac.x, pac.y);
  ctx.rotate(rot);
  // Larger pulsing glow when powered up
  const glowSize = state.powerActive ? 22 + 8 * Math.sin(state.animFrame * 0.2) : 14;
  ctx.shadowColor = state.powerActive ? '#00f5ff' : C.pac;
  ctx.shadowBlur  = glowSize;
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

  // Fade existing trail entries each frame
  state.pacTrail = state.pacTrail.filter(t => t.alpha > 0.05);
  state.pacTrail.forEach(t => t.alpha *= 0.78);

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

  // Record neon trail when powered up (every 3 frames to avoid too many points)
  if (state.powerActive && state.animFrame % 3 === 0) {
    state.pacTrail.push({ x: pac.x, y: pac.y, alpha: 1 });
    if (state.pacTrail.length > 14) state.pacTrail.shift();
  }

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
