const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx    = null;
let chompToggle = false;

function getAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, type, duration, gainVal, startTime, endFreq) {
  const ac   = getAudio();
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, startTime || ac.currentTime);
  if (endFreq) osc.frequency.linearRampToValueAtTime(endFreq, (startTime || ac.currentTime) + duration);
  gain.gain.setValueAtTime(gainVal || 0.15, startTime || ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, (startTime || ac.currentTime) + duration);
  osc.start(startTime || ac.currentTime);
  osc.stop((startTime || ac.currentTime) + duration + 0.01);
}

export function resetAudio() {
  chompToggle = false;
}

// ─── Satisfying bwop chomp ───────────────────────────────────────────────────
export function playChomp() {
  const ac        = getAudio();
  const t         = ac.currentTime;
  chompToggle     = !chompToggle;
  const base      = chompToggle ? 220 : 280;

  // Main sweep: starts high, drops to base — "bwop"
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain); gain.connect(ac.destination);
  osc.type = 'square';
  osc.frequency.setValueAtTime(base * 2.2, t);
  osc.frequency.exponentialRampToValueAtTime(base, t + 0.07);
  gain.gain.setValueAtTime(0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  osc.start(t); osc.stop(t + 0.10);

  // Harmonic shimmer on top
  const osc2  = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.connect(gain2); gain2.connect(ac.destination);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(base * 3, t);
  osc2.frequency.exponentialRampToValueAtTime(base * 1.5, t + 0.06);
  gain2.gain.setValueAtTime(0.07, t);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  osc2.start(t); osc2.stop(t + 0.08);
}

export function playPowerUp() {
  const ac = getAudio();
  const t  = ac.currentTime;
  playTone(200, 'sawtooth', 0.3, 0.18, t, 600);
}

export function playGhostEaten() {
  const ac = getAudio();
  const t  = ac.currentTime;
  [800, 600, 400, 200].forEach((f, i) => playTone(f, 'square', 0.07, 0.15, t + i * 0.07));
}

export function playDeath() {
  const ac = getAudio();
  const t  = ac.currentTime;
  for (let i = 0; i < 20; i++) {
    const fBase  = 400 - i * 17;
    const wobble = fBase + Math.sin(i * 1.2) * 30;
    playTone(wobble, 'sawtooth', 0.06, 0.2, t + i * 0.06);
  }
}

export function playLevelComplete() {
  const ac = getAudio();
  const t  = ac.currentTime;
  [262, 330, 392, 523, 660, 784].forEach((f, i) => playTone(f, 'triangle', 0.12, 0.18, t + i * 0.1));
}

export function playIntroJingle() {
  const ac = getAudio();
  const t  = ac.currentTime;
  [262, 330, 392, 523].forEach((f, i) => {
    playTone(f,     'triangle', 0.2,  0.2,  t + i * 0.18);
    playTone(f * 2, 'square',   0.05, 0.06, t + i * 0.18);
  });
}

// ─── 8-bit synthwave background music ────────────────────────────────────────

// Note frequencies (A minor)
const N = {
  D4: 293.7, E4: 329.6, G4: 392.0, A4: 440.0, B4: 493.9,
  C5: 523.3, D5: 587.3, E5: 659.3, G5: 784.0, A5: 880.0,
  A2: 110.0, E3: 164.8, C3: 130.8, D3: 146.8, G3: 196.0,
  _:  0,
};

// Normal gameplay: A minor, 120 BPM, gentle arpeggio
//   Each entry: [freq, duration_in_beats]  (0 = rest)
const MELODY_NORMAL = [
  [N.A4, 1], [N._, 0.5], [N.C5, 0.5], [N.E5, 1], [N.C5, 0.5], [N.A4, 0.5], // bar 1
  [N.G4, 1], [N._, 0.5], [N.A4, 0.5], [N.B4, 1], [N.A4,  1  ], // bar 2
  [N.D5, 1.5],            [N.C5, 0.5], [N.A4, 1], [N.G4,  1  ], // bar 3
  [N.A4, 2], [N._, 2], // bar 4
];
const BASS_NORMAL = [
  [N.A2, 2], [N.E3, 2],
  [N.A2, 1.5], [N.C3, 0.5], [N.E3, 2],
  [N.D3, 2], [N.A2, 2],
  [N.E3, 2], [N.A2, 2],
];

// Intense mode (power pill): faster, higher octave runs, 155 BPM
const MELODY_INTENSE = [
  [N.A4,0.5],[N.C5,0.5],[N.E5,0.5],[N.A5,0.5], [N.G5,0.5],[N.E5,0.5],[N.C5,0.5],[N.G4,0.5], // bar 1
  [N.A4,0.5],[N.E5,0.5],[N.A5,0.5],[N.E5,0.5], [N.D5,0.5],[N.E5,0.5],[N.C5,0.5],[N.A4,0.5], // bar 2
  [N.D5,0.5],[N.E5,0.5],[N.A5,0.5],[N.G5,0.5], [N.E5,0.5],[N.D5,0.5],[N.C5,0.5],[N.B4,0.5], // bar 3
  [N.C5,0.5],[N.E5,0.5],[N.G5,0.5],[N.E5,0.5], [N.C5,0.5],[N.A4,0.5],[N.G4,0.5],[N.A4,0.5], // bar 4
];
const BASS_INTENSE = [
  [N.A2,1],[N.A2,1],[N.E3,1],[N.E3,1],
  [N.A2,1],[N.C3,1],[N.D3,1],[N.E3,1],
  [N.D3,1],[N.D3,1],[N.A2,1],[N.A2,1],
  [N.E3,1],[N.G3,1],[N.A2,1],[N.A2,1],
];

// ─── Scheduler state ─────────────────────────────────────────────────────────
let musicPlaying    = false;
let musicMode       = 'normal';
let musicInterval   = null;
let melodyIndex     = 0;
let bassIndex       = 0;
let nextMelodyTime  = 0;
let nextBassTime    = 0;
let nextDrumTime    = 0;

function getMelody() { return musicMode === 'intense' ? MELODY_INTENSE : MELODY_NORMAL; }
function getBass()   { return musicMode === 'intense' ? BASS_INTENSE   : BASS_NORMAL; }
function getBPM()    { return musicMode === 'intense' ? 155 : 120; }
function getBeat()   { return 60 / getBPM(); }

function schedOsc(freq, type, time, dur, vol) {
  if (!freq) return;
  const ac   = getAudio();
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain); gain.connect(ac.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur * 0.88);
  osc.start(time); osc.stop(time + dur);
}

function schedKick(time) {
  // Punchy pitch-drop kick
  schedOsc(160, 'sine', time, 0.12, 0.4);
  playTone(160, 'sine', 0.12, 0.4, time, 38);
}

function schedHihat(time) {
  schedOsc(1400, 'square', time, 0.025, 0.035);
}

function runScheduler() {
  if (!musicPlaying) return;
  const ac    = getAudio();
  const now   = ac.currentTime;
  const AHEAD = 0.12;
  const beat  = getBeat();
  const mel   = getMelody();
  const bas   = getBass();

  // Melody (square wave lead)
  while (nextMelodyTime < now + AHEAD) {
    const note = mel[melodyIndex % mel.length];
    schedOsc(note[0], 'square', nextMelodyTime, note[1] * beat * 0.82, 0.09);
    nextMelodyTime += note[1] * beat;
    melodyIndex++;
    if (melodyIndex >= mel.length) melodyIndex = 0;
  }

  // Bass (sawtooth)
  while (nextBassTime < now + AHEAD) {
    const note = bas[bassIndex % bas.length];
    schedOsc(note[0], 'sawtooth', nextBassTime, note[1] * beat * 0.75, 0.14);
    nextBassTime += note[1] * beat;
    bassIndex++;
    if (bassIndex >= bas.length) bassIndex = 0;
  }

  // Drums: kick on 1&3, hihat on every beat; intense = kick every beat + faster hihat
  while (nextDrumTime < now + AHEAD) {
    schedKick(nextDrumTime);
    if (musicMode === 'intense') {
      schedHihat(nextDrumTime + beat * 0.5);
      schedHihat(nextDrumTime + beat);
      nextDrumTime += beat;
    } else {
      schedHihat(nextDrumTime + beat);
      nextDrumTime += beat * 2;
    }
  }
}

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying   = true;
  musicMode      = 'normal';
  melodyIndex    = 0;
  bassIndex      = 0;
  const ac       = getAudio();
  nextMelodyTime = ac.currentTime;
  nextBassTime   = ac.currentTime;
  nextDrumTime   = ac.currentTime;
  musicInterval  = setInterval(runScheduler, 25);
}

export function stopMusic() {
  musicPlaying = false;
  clearInterval(musicInterval);
  musicInterval = null;
}

export function setMusicIntense(intense) {
  const next = intense ? 'intense' : 'normal';
  if (musicMode === next) return;
  musicMode   = next;
  // Reset pattern positions so new loop starts cleanly
  melodyIndex = 0;
  bassIndex   = 0;
}

