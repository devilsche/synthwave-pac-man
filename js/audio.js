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
// Outrun / 80s pop synthwave — A minor, 132 BPM
// Four layers: lead melody + fast arpeggio + pumping bass + 4-on-floor drums

const N = {
  A2: 110.0, C3: 130.8, D3: 146.8, E3: 164.8, F3: 174.6, G3: 196.0,
  A3: 220.0, B3: 246.9, C4: 261.6, D4: 293.7, E4: 329.6, F4: 349.2, G4: 392.0,
  A4: 440.0, B4: 493.9, C5: 523.3, D5: 587.3, E5: 659.3, F5: 698.5, G5: 784.0, A5: 880.0,
  _: 0,
};

// ─── Normal (gameplay) ────────────────────────────────────────────────────────

// 8-bar catchy hook — punchy ascending runs with 80s pop phrasing
const MELODY_NORMAL = [
  // Bar 1: Opening hook — spring up to A4
  [N.E4, 0.5],[N.E4, 0.25],[N.G4, 0.25],[N.A4, 0.5],[N.G4, 0.5],
  // Bar 2: Answer — fall back with drive
  [N.E4, 0.5],[N.D4, 0.5],[N.C4, 0.5],[N.E4, 0.5],
  // Bar 3: Rise — peak at B4
  [N.A4, 0.5],[N.A4, 0.25],[N.B4, 0.25],[N.A4, 0.5],[N.G4, 0.5],
  // Bar 4: Settle — F4→G4 colour
  [N.E4, 0.5],[N.F4, 0.5],[N.G4, 0.5],[N.E4, 0.5],
  // Bar 5: Build — climb to C5
  [N.C5, 0.5],[N.B4, 0.5],[N.A4, 0.5],[N.G4, 0.5],
  // Bar 6: Drive — ascending scale run
  [N.E4, 0.5],[N.G4, 0.5],[N.A4, 0.5],[N.B4, 0.5],
  // Bar 7: Peak — hit E5
  [N.C5, 0.5],[N.D5, 0.5],[N.E5, 0.5],[N.D5, 0.5],
  // Bar 8: Resolution — sweep back home
  [N.C5, 0.5],[N.A4, 0.5],[N.G4, 0.25],[N.E4, 0.25],[N.A3, 1.0],
];

// Fast 16th-note arpeggio — Am→F→Am→G, the synthwave heartbeat
const ARPEGGIO_NORMAL = [
  [N.A3,0.25],[N.C4,0.25],[N.E4,0.25],[N.A4,0.25],
  [N.A3,0.25],[N.C4,0.25],[N.E4,0.25],[N.A4,0.25],
  [N.F3,0.25],[N.A3,0.25],[N.C4,0.25],[N.F4,0.25],
  [N.F3,0.25],[N.A3,0.25],[N.C4,0.25],[N.F4,0.25],
  [N.A3,0.25],[N.C4,0.25],[N.E4,0.25],[N.A4,0.25],
  [N.A3,0.25],[N.C4,0.25],[N.E4,0.25],[N.A4,0.25],
  [N.G3,0.25],[N.B3,0.25],[N.D4,0.25],[N.G4,0.25],
  [N.G3,0.25],[N.B3,0.25],[N.D4,0.25],[N.G4,0.25],
];

// Pumping 8th-note sawtooth bass — walks through Am→F→C→G
const BASS_NORMAL = [
  [N.A2,0.5],[N.A2,0.5],[N.A2,0.5],[N.A2,0.5],
  [N.A2,0.5],[N.A2,0.5],[N.A2,0.5],[N.E3,0.5],
  [N.F3,0.5],[N.F3,0.5],[N.F3,0.5],[N.F3,0.5],
  [N.C3,0.5],[N.C3,0.5],[N.G3,0.5],[N.G3,0.5],
  [N.A2,0.5],[N.A2,0.5],[N.C3,0.5],[N.C3,0.5],
  [N.F3,0.5],[N.F3,0.5],[N.G3,0.5],[N.G3,0.5],
  [N.A2,0.5],[N.E3,0.5],[N.A2,0.5],[N.E3,0.5],
  [N.G3,0.5],[N.G3,0.5],[N.A2,0.5],[N.A2,0.5],
];

// ─── Intense (power pill) ─────────────────────────────────────────────────────

// Upper-octave screaming lead, 150 BPM
const MELODY_INTENSE = [
  [N.E5,0.25],[N.G5,0.25],[N.A5,0.25],[N.G5,0.25],
  [N.E5,0.25],[N.D5,0.25],[N.C5,0.25],[N.E5,0.25],
  [N.A4,0.25],[N.B4,0.25],[N.C5,0.25],[N.B4,0.25],
  [N.A4,0.25],[N.G4,0.25],[N.A4,0.25],[N.E4,0.25],
  [N.C5,0.25],[N.B4,0.25],[N.A4,0.25],[N.B4,0.25],
  [N.C5,0.25],[N.D5,0.25],[N.E5,0.25],[N.G5,0.25],
  [N.A5,0.25],[N.G5,0.25],[N.E5,0.25],[N.D5,0.25],
  [N.E5,0.25],[N.C5,0.25],[N.A4,0.25],[N.E4,0.25],
];

// Arpeggio one octave higher — frenetic 16th notes
const ARPEGGIO_INTENSE = [
  [N.A4,0.25],[N.C5,0.25],[N.E5,0.25],[N.A5,0.25],
  [N.A4,0.25],[N.C5,0.25],[N.E5,0.25],[N.A5,0.25],
  [N.F4,0.25],[N.A4,0.25],[N.C5,0.25],[N.F5,0.25],
  [N.F4,0.25],[N.A4,0.25],[N.C5,0.25],[N.F5,0.25],
  [N.A4,0.25],[N.C5,0.25],[N.E5,0.25],[N.A5,0.25],
  [N.A4,0.25],[N.C5,0.25],[N.E5,0.25],[N.A5,0.25],
  [N.G4,0.25],[N.B4,0.25],[N.D5,0.25],[N.G5,0.25],
  [N.G4,0.25],[N.B4,0.25],[N.D5,0.25],[N.G5,0.25],
];

// Same bass pattern compressed to quarter notes at double speed
const BASS_INTENSE = [
  [N.A2,0.25],[N.A2,0.25],[N.A2,0.25],[N.A2,0.25],
  [N.A2,0.25],[N.A2,0.25],[N.A2,0.25],[N.E3,0.25],
  [N.F3,0.25],[N.F3,0.25],[N.F3,0.25],[N.F3,0.25],
  [N.C3,0.25],[N.C3,0.25],[N.G3,0.25],[N.G3,0.25],
  [N.A2,0.25],[N.A2,0.25],[N.C3,0.25],[N.C3,0.25],
  [N.F3,0.25],[N.F3,0.25],[N.G3,0.25],[N.G3,0.25],
  [N.A2,0.25],[N.E3,0.25],[N.A2,0.25],[N.E3,0.25],
  [N.G3,0.25],[N.G3,0.25],[N.A2,0.25],[N.A2,0.25],
];

// ─── Scheduler state ─────────────────────────────────────────────────────────
let musicPlaying   = false;
let musicMode      = 'normal';
let musicInterval  = null;
let melodyIndex    = 0;
let arpIndex       = 0;
let bassIndex      = 0;
let drumBeatCount  = 0;
let nextMelodyTime = 0;
let nextArpTime    = 0;
let nextBassTime   = 0;
let nextDrumTime   = 0;

function getMelody()   { return musicMode === 'intense' ? MELODY_INTENSE   : MELODY_NORMAL;   }
function getArpeggio() { return musicMode === 'intense' ? ARPEGGIO_INTENSE : ARPEGGIO_NORMAL; }
function getBass()     { return musicMode === 'intense' ? BASS_INTENSE     : BASS_NORMAL;     }
function getBPM()      { return musicMode === 'intense' ? 150 : 132; }
function getBeat()     { return 60 / getBPM(); }

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
  schedOsc(160, 'sine', time, 0.12, 0.4);
  playTone(160, 'sine', 0.12, 0.4, time, 38);
}

// 8-bit snare: two-oscillator square burst
function schedSnare(time) {
  schedOsc(220, 'square', time, 0.06, 0.12);
  schedOsc(175, 'square', time, 0.05, 0.08);
}

function schedHihat(time) {
  schedOsc(1400, 'square', time, 0.022, 0.03);
}

function runScheduler() {
  if (!musicPlaying) return;
  const ac    = getAudio();
  const now   = ac.currentTime;
  const AHEAD = 0.18; // slightly wider window for fast 16th-note arpeggios
  const beat  = getBeat();
  const mel   = getMelody();
  const arp   = getArpeggio();
  const bas   = getBass();

  // Lead melody (square wave)
  while (nextMelodyTime < now + AHEAD) {
    const note = mel[melodyIndex % mel.length];
    if (note[0]) schedOsc(note[0], 'square', nextMelodyTime, note[1] * beat * 0.82, 0.09);
    nextMelodyTime += note[1] * beat;
    melodyIndex = (melodyIndex + 1) % mel.length;
  }

  // Arpeggio (triangle — sits behind the lead)
  while (nextArpTime < now + AHEAD) {
    const note = arp[arpIndex % arp.length];
    if (note[0]) schedOsc(note[0], 'triangle', nextArpTime, note[1] * beat * 0.7, 0.055);
    nextArpTime += note[1] * beat;
    arpIndex = (arpIndex + 1) % arp.length;
  }

  // Bass (sawtooth)
  while (nextBassTime < now + AHEAD) {
    const note = bas[bassIndex % bas.length];
    if (note[0]) schedOsc(note[0], 'sawtooth', nextBassTime, note[1] * beat * 0.75, 0.14);
    nextBassTime += note[1] * beat;
    bassIndex = (bassIndex + 1) % bas.length;
  }

  // Drums: 4-on-the-floor kick, snare on beats 2 & 4, 8th-note hihats
  while (nextDrumTime < now + AHEAD) {
    schedKick(nextDrumTime);
    if (drumBeatCount % 2 === 1) schedSnare(nextDrumTime); // beats 2 & 4
    schedHihat(nextDrumTime + beat * 0.5);
    if (musicMode === 'intense') {
      schedHihat(nextDrumTime + beat * 0.25);
      schedHihat(nextDrumTime + beat * 0.75);
    }
    nextDrumTime += beat;
    drumBeatCount++;
  }
}

export function startMusic() {
  if (musicPlaying) return;
  musicPlaying   = true;
  musicMode      = 'normal';
  melodyIndex    = 0;
  arpIndex       = 0;
  bassIndex      = 0;
  drumBeatCount  = 0;
  const ac       = getAudio();
  nextMelodyTime = ac.currentTime;
  nextArpTime    = ac.currentTime;
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
  musicMode     = next;
  melodyIndex   = 0;
  arpIndex      = 0;
  bassIndex     = 0;
  drumBeatCount = 0;
}

