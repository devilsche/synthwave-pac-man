import { W, H, ctx } from './constants.js';
import { state } from './state.js';

export function updateHUD() {
  document.getElementById('scoreVal').textContent = state.score;
  document.getElementById('highVal').textContent  = state.highScore;
  document.getElementById('levelVal').textContent = state.level;
  const hearts = '❤'.repeat(Math.max(0, state.lives));
  document.getElementById('livesVal').textContent = hearts || '☠';
}

export function showMessage(txt) {
  const el        = document.getElementById('message');
  el.style.display = 'block';
  el.innerHTML    = txt;
}

export function hideMessage() {
  document.getElementById('message').style.display = 'none';
}

export function addScore(n, x, y) {
  state.score += n;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    try { localStorage.setItem('swpac_hi', state.highScore); } catch (e) {}
  }
  if (x !== undefined) state.scorePopups.push({ x, y, text: '+' + n, alpha: 1, vy: -1.2 });
  updateHUD();
}

export function drawScorePopups() {
  state.scorePopups = state.scorePopups.filter(p => p.alpha > 0.05);
  ctx.save();
  ctx.textAlign   = 'center';
  ctx.font        = 'bold 13px Courier New';
  ctx.shadowColor = '#00f5ff';
  state.scorePopups.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle   = '#00f5ff';
    ctx.shadowBlur  = 8;
    ctx.fillText(p.text, p.x, p.y);
    p.y    += p.vy;
    p.alpha -= 0.022;
  });
  ctx.restore();
}

export function drawFlash() {
  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(255,255,255,${(state.flashTimer / 90) * 0.35})`;
    ctx.fillRect(0, 0, W, H);
    state.flashTimer--;
  }
}
