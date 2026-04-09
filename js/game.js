import { CELL, W, H, C, canvas, ctx } from './constants.js';
import { state } from './state.js';
import { playIntroJingle, playGhostEaten, playDeath, playVictoryDance, resetAudio, startMusic, stopMusic } from './audio.js';
import { buildMaze, countPellets, drawMaze } from './maze.js';
import { updateHUD, showMessage, hideMessage, addScore, drawScorePopups, drawFlash } from './ui.js';
import { resetPac, drawPac, updatePac } from './pacman.js';
import {
  buildGhosts, drawGhost, updateGhost,
  updateGhostModes, updateFrightened,
} from './ghosts.js';

// ─── Intro screen ────────────────────────────────────────────────────────────

function drawIntro() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign   = 'center';
  ctx.shadowColor = '#ff2d78';
  ctx.shadowBlur  = 30;
  ctx.fillStyle   = '#ff2d78';
  ctx.font        = 'bold 36px Courier New';
  ctx.fillText('SYNTHWAVE', W / 2, H / 2 - 70);

  ctx.shadowColor = '#ffe000';
  ctx.shadowBlur  = 24;
  ctx.fillStyle   = '#ffe000';
  ctx.font        = 'bold 48px Courier New';
  ctx.fillText('PAC-MAN', W / 2, H / 2 - 20);

  // Ghost preview row
  const colors   = [C.blinky, C.pinky, C.inky, C.clyde];
  const gSpacing = 60;
  const startX   = W / 2 - (colors.length - 1) * gSpacing / 2;
  colors.forEach((col, i) => {
    drawGhost({
      x: startX + i * gSpacing, y: H / 2 + 50,
      color: col, state: 'CHASE',
      dir: { x: 0, y: 0 }, trail: [],
      skirtPhase: state.animFrame * 0.06 + i,
    });
  });

  // Blinking prompt
  if (Math.floor(state.animFrame / 30) % 2 === 0) {
    ctx.shadowColor = '#c77dff';
    ctx.shadowBlur  = 12;
    ctx.fillStyle   = '#c77dff';
    ctx.font        = '14px Courier New';
    ctx.fillText('PRESS SPACE TO START', W / 2, H / 2 + 130);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle  = '#ffffff44';
  ctx.font       = '11px Courier New';
  ctx.fillText('WASD / ARROW KEYS', W / 2, H / 2 + 160);
  ctx.textAlign  = 'left';
  ctx.restore();
}

// ─── Win screen ───────────────────────────────────────────────────────────────

function drawWin() {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.textAlign = 'center';

  // "YOU WIN!" with pulsing golden glow
  const pulse = 1 + 0.12 * Math.sin(state.animFrame * 0.07);
  ctx.shadowColor = '#ffe000';
  ctx.shadowBlur  = 28 * pulse;
  ctx.fillStyle   = '#ffe000';
  ctx.font        = 'bold 52px Courier New';
  ctx.fillText('YOU WIN!', W / 2, H / 2 - 100);

  // Big Pac-Man (chomping + bobbing)
  const bigR       = 65;
  const mouthAngle = 0.15 + 0.25 * Math.abs(Math.sin(state.animFrame * 0.15));
  const pacBob     = Math.sin(state.animFrame * 0.08) * 8;
  const pcx        = W / 2;
  const pcy        = H / 2 - 10 + pacBob;

  ctx.shadowColor = C.pac;
  ctx.shadowBlur  = 30;
  ctx.fillStyle   = C.pac;
  ctx.beginPath();
  ctx.moveTo(pcx, pcy);
  ctx.arc(pcx, pcy, bigR, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
  ctx.closePath();
  ctx.fill();

  // Eye
  ctx.shadowBlur = 0;
  ctx.fillStyle  = C.bg;
  ctx.beginPath();
  ctx.arc(pcx + bigR * 0.18, pcy - bigR * 0.55, bigR * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting sparkles
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + state.animFrame * 0.04;
    const dist  = bigR + 22 + Math.sin(state.animFrame * 0.07 + i) * 8;
    ctx.fillStyle   = i % 2 === 0 ? '#ff2d78' : '#c77dff';
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur  = 8;
    const size = 3 + Math.sin(state.animFrame * 0.12 + i * 0.8) * 2;
    ctx.beginPath();
    ctx.arc(pcx + Math.cos(angle) * dist, pcy + Math.sin(angle) * dist, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  // Level / score
  ctx.fillStyle   = '#c77dff';
  ctx.shadowColor = '#c77dff';
  ctx.shadowBlur  = 12;
  ctx.font        = '16px Courier New';
  ctx.fillText(`LEVEL ${state.level} COMPLETE`, W / 2, H / 2 + 90);
  ctx.fillText(`SCORE: ${state.score}`, W / 2, H / 2 + 114);

  // Blinking prompt
  if (Math.floor(state.animFrame / 25) % 2 === 0) {
    ctx.fillStyle  = '#ffffff55';
    ctx.shadowBlur = 0;
    ctx.font       = '12px Courier New';
    ctx.fillText('NEXT LEVEL LOADING…', W / 2, H / 2 + 150);
  }

  ctx.shadowBlur = 0;
  ctx.textAlign  = 'left';
  ctx.restore();
}

// ─── Collisions ──────────────────────────────────────────────────────────────

function eatGhost(g) {
  state.ghostEatChain++;
  const pts = [200, 400, 800, 1600][Math.min(state.ghostEatChain - 1, 3)];
  addScore(pts, g.x, g.y - 10);
  g.state = 'EATEN';
  state.shakeTimer = 12; // ~200ms at 60fps
  playGhostEaten();
}

function killPac() {
  if (state.gameState !== 'PLAYING') return;
  state.pac.dead       = true;
  state.pac.deathTimer = 0;
  state.gameState      = 'DEAD';
  playDeath();
  setTimeout(() => {
    state.lives--;
    updateHUD();
    if (state.lives <= 0) {
      state.gameState = 'GAME_OVER';
      stopMusic();
      showMessage('GAME OVER<br><br>PRESS SPACE');
    } else {
      resetPac();
      buildGhosts();
      state.gameState = 'PLAYING';
    }
  }, 1800);
}

function checkGhostCollisions() {
  if (state.pac.dead) return;
  state.ghosts.forEach(g => {
    if (g.state === 'HOUSE' || g.state === 'EATEN') return;
    const dist = Math.hypot(state.pac.x - g.x, state.pac.y - g.y);
    if (dist < CELL * 0.75) {
      if      (g.state === 'FRIGHTENED')                         eatGhost(g);
      else if (g.state === 'CHASE' || g.state === 'SCATTER')     killPac();
    }
  });
}

function checkLevelComplete() {
  if (state.pelletCount <= 0 && state.gameState === 'PLAYING') {
    state.gameState = 'LEVEL_COMPLETE';
    stopMusic();
    playVictoryDance();
    setTimeout(() => {
      state.level++;
      state.maze    = buildMaze();
      countPellets();
      resetPac();
      buildGhosts();
      state.modeIndex = 0;
      state.modeTimer = 0;
      state.pacTrail  = [];
      state.gameState = 'PLAYING';
      startMusic();
    }, 4000);
  }
}

// ─── Game management ─────────────────────────────────────────────────────────

function initGame() {
  state.maze = buildMaze();
  state.score = 0;
  try { state.highScore = parseInt(localStorage.getItem('swpac_hi')) || 0; } catch (e) {}
  state.lives     = 3;
  state.level     = 1;
  state.gameState = 'INTRO';
  countPellets();
  updateHUD();
}

function startGame() {
  state.score           = 0;
  state.lives           = 3;
  state.level           = 1;
  state.maze            = buildMaze();
  state.modeIndex       = 0;
  state.modeTimer       = 0;
  state.frightenedTimer = 0;
  state.powerActive     = false;
  state.shakeTimer      = 0;
  state.pacTrail        = [];
  resetAudio();
  countPellets();
  resetPac();
  buildGhosts();
  updateHUD();
  hideMessage();
  startMusic();
  state.gameState = 'PLAYING';
}

// ─── Input ───────────────────────────────────────────────────────────────────

document.addEventListener('keydown', e => {
  let handled = false;
  if (e.key === 'ArrowLeft'  || e.key === 'a') { state.pac.nextDir = { x: -1, y:  0 }; handled = true; }
  if (e.key === 'ArrowRight' || e.key === 'd') { state.pac.nextDir = { x:  1, y:  0 }; handled = true; }
  if (e.key === 'ArrowUp'    || e.key === 'w') { state.pac.nextDir = { x:  0, y: -1 }; handled = true; }
  if (e.key === 'ArrowDown'  || e.key === 's') { state.pac.nextDir = { x:  0, y:  1 }; handled = true; }
  if ((e.key === ' ' || e.key === 'Enter')
      && (state.gameState === 'INTRO' || state.gameState === 'GAME_OVER')) {
    playIntroJingle();
    startGame();
    handled = true;
  }
  if (handled) e.preventDefault();
});

// ─── Main loop ───────────────────────────────────────────────────────────────

function applyShake() {
  if (state.shakeTimer > 0) {
    const mag = state.shakeTimer * 0.5;
    ctx.save();
    ctx.translate(
      (Math.random() - 0.5) * mag,
      (Math.random() - 0.5) * mag
    );
    state.shakeTimer--;
    return true;
  }
  return false;
}

function gameLoop() {
  state.animFrame++;

  if (state.gameState === 'INTRO') {
    drawIntro();

  } else if (state.gameState === 'PLAYING') {
    updateGhostModes();
    updateFrightened();
    state.ghosts.forEach((g, i) => updateGhost(g, i));
    updatePac();
    checkGhostCollisions();
    checkLevelComplete();
    const shook = applyShake();
    drawMaze();
    state.ghosts.forEach(drawGhost);
    drawPac();
    drawScorePopups();
    drawFlash();
    if (shook) ctx.restore();

  } else if (state.gameState === 'DEAD') {
    updatePac();
    drawMaze();
    state.ghosts.forEach(drawGhost);
    drawPac();

  } else if (state.gameState === 'LEVEL_COMPLETE') {
    drawWin();

  } else if (state.gameState === 'GAME_OVER') {
    drawMaze();
    drawPac();
  }

  requestAnimationFrame(gameLoop);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
initGame();
buildGhosts();
gameLoop();
