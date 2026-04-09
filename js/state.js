import { CELL } from './constants.js';

// Single mutable state object — all modules read/write properties of this object.
export const state = {
  // Maze & pellets
  maze:            null,
  pelletCount:     0,
  totalPellets:    0,

  // Scoring & progression
  score:           0,
  highScore:       0,
  lives:           3,
  level:           1,

  // Game flow
  gameState:       'INTRO', // 'INTRO' | 'PLAYING' | 'DEAD' | 'LEVEL_COMPLETE' | 'GAME_OVER'
  animFrame:       0,
  flashTimer:      0,
  scorePopups:     [], // [{ x, y, text, alpha, vy }]

  // Power pill state
  powerActive:     false,
  shakeTimer:      0,
  pacTrail:        [],
  modeIndex:       0,
  modeTimer:       0,

  // Frightened state
  frightenedTimer: 0,
  ghostEatChain:   0, // multiplier index: 200→400→800→1600

  // Entities
  ghosts: [],
  pac: {
    x:          10 * CELL + CELL / 2,
    y:          16 * CELL + CELL / 2,
    dir:        { x: -1, y: 0 },
    nextDir:    { x: -1, y: 0 },
    mouthAngle: 0.40,
    mouthOpen:  true,
    radius:     CELL * 0.42,
    dead:       false,
    deathTimer: 0,
    deathAngle: 0,
  },
};
