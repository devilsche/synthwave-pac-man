// ─── Grid ────────────────────────────────────────────────────────────────────
export const CELL = 20;
export const COLS = 21;
export const ROWS = 23;
export const W    = COLS * CELL;  // 420
export const H    = ROWS * CELL;  // 460

// ─── Cell types ──────────────────────────────────────────────────────────────
export const E  = 0; // empty
export const W_ = 1; // wall
export const P  = 2; // pellet
export const PP = 3; // power pellet
export const G  = 4; // ghost house (empty, no pellet)

// ─── Maze template (21×23) ───────────────────────────────────────────────────
export const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,4,4,4,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,4,4,4,4,4,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
  [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// ─── Colour palette ──────────────────────────────────────────────────────────
export const C = {
  bg:          '#0d0015',
  wall:        '#1a0040',
  wallGlow:    '#c77dff',
  pellet:      '#ffe8a0',
  power:       '#ffffff',
  pac:         '#ffe000',
  blinky:      '#ff2d78',
  pinky:       '#c77dff',
  inky:        '#00f5ff',
  clyde:       '#ff8c42',
  scared:      '#2d1b69',
  scaredFlash: '#ffffff',
  text:        '#ff2d78',
};

// ─── Speeds ───────────────────────────────────────────────────────────────────
export const PAC_SPEED   = 1.8;
export const GHOST_SPEED = 1.4;

// ─── Ghost definitions ────────────────────────────────────────────────────────
export const GHOST_DEFS = [
  { name: 'Blinky', color: C.blinky, startCol: 10, startRow: 9,  exitDelay: 0   },
  { name: 'Pinky',  color: C.pinky,  startCol: 9,  startRow: 10, exitDelay: 120 },
  { name: 'Inky',   color: C.inky,   startCol: 10, startRow: 10, exitDelay: 240 },
  { name: 'Clyde',  color: C.clyde,  startCol: 11, startRow: 10, exitDelay: 360 },
];

// ─── Movement directions ──────────────────────────────────────────────────────
export const DIRS = [
  { x: 0, y: -1 }, { x: 0, y: 1 },
  { x: -1, y: 0 }, { x: 1, y: 0 },
];

// ─── Ghost scatter/chase cycle (frames at 60 fps) ────────────────────────────
export const MODE_CYCLE = [
  { mode: 'SCATTER', frames: 420 },
  { mode: 'CHASE',   frames: 1200 },
  { mode: 'SCATTER', frames: 300 },
  { mode: 'CHASE',   frames: 1200 },
  { mode: 'SCATTER', frames: 240 },
  { mode: 'CHASE',   frames: Infinity },
];

// ─── Canvas ───────────────────────────────────────────────────────────────────
export const canvas = document.getElementById('gameCanvas');
export const ctx    = canvas.getContext('2d');
canvas.width  = W;
canvas.height = H;
