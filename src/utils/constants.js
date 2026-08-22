// ============================================================
// GAME CONSTANTS — CIC DROP ARCADE GAME
// ============================================================

export const COLORS = {
  CIC_RED: '#C8102E',
  GOLD: '#F5C842',
  WHITE: '#ffffff',
};

export const GAME_CONFIG = {
  BASE_WIDTH: 480,
  BASE_HEIGHT: 720,
  PLAYER_SPEED: 520,      // responsive and snappy
  PLAYER_ACCEL: 2600,
  PLAYER_DECEL: 3200,
  PLAYER_WIDTH: 60,
  PLAYER_HEIGHT: 78,
  OBJECT_SIZE: 54,
  GROUND_Y_OFFSET: 72,
};

export const SCORE_CONFIG = {
  CAP_POINTS: 10,
  LEVEL_THRESHOLD: 60,   // Level up every 60 points (6 caps) — fast exciting progression!
  MAX_LEVEL: 20,
  MAX_VALID_SCORE: 99999,
  MAX_VALID_LEVEL: 100,
};

// ── Challenging Progressive Difficulty ──────────────────────────
export const DIFFICULTY_TABLE = [
  // Fast and engaging from level 1!
  { fallSpeed: 230, spawnInterval: 1.10, bombProbability: 0.22, maxObjects: 6 },  // Level 1
  { fallSpeed: 270, spawnInterval: 0.95, bombProbability: 0.28, maxObjects: 7 },  // Level 2
  { fallSpeed: 320, spawnInterval: 0.82, bombProbability: 0.32, maxObjects: 8 },  // Level 3
  { fallSpeed: 370, spawnInterval: 0.72, bombProbability: 0.35, maxObjects: 9 },  // Level 4
  { fallSpeed: 420, spawnInterval: 0.64, bombProbability: 0.38, maxObjects: 10 }, // Level 5
  { fallSpeed: 470, spawnInterval: 0.58, bombProbability: 0.40, maxObjects: 11 }, // Level 6
  { fallSpeed: 520, spawnInterval: 0.52, bombProbability: 0.42, maxObjects: 12 }, // Level 7
  { fallSpeed: 570, spawnInterval: 0.47, bombProbability: 0.44, maxObjects: 13 }, // Level 8
  { fallSpeed: 620, spawnInterval: 0.43, bombProbability: 0.45, maxObjects: 14 }, // Level 9
  { fallSpeed: 670, spawnInterval: 0.40, bombProbability: 0.46, maxObjects: 15 }, // Level 10
  { fallSpeed: 710, spawnInterval: 0.37, bombProbability: 0.47, maxObjects: 16 }, // Level 11+
  { fallSpeed: 750, spawnInterval: 0.35, bombProbability: 0.48, maxObjects: 16 },
  { fallSpeed: 790, spawnInterval: 0.33, bombProbability: 0.48, maxObjects: 17 },
  { fallSpeed: 820, spawnInterval: 0.31, bombProbability: 0.49, maxObjects: 17 },
  { fallSpeed: 850, spawnInterval: 0.29, bombProbability: 0.49, maxObjects: 18 },
  { fallSpeed: 880, spawnInterval: 0.28, bombProbability: 0.50, maxObjects: 18 },
  { fallSpeed: 900, spawnInterval: 0.27, bombProbability: 0.50, maxObjects: 18 },
  { fallSpeed: 920, spawnInterval: 0.26, bombProbability: 0.50, maxObjects: 19 },
  { fallSpeed: 940, spawnInterval: 0.25, bombProbability: 0.50, maxObjects: 19 },
  { fallSpeed: 960, spawnInterval: 0.24, bombProbability: 0.50, maxObjects: 20 },
];

export const OBJECT_TYPES = { CAP: 'cap', BOMB: 'bomb' };

export const GAME_SCREENS = {
  START: 'start', PLAYING: 'playing', PAUSED: 'paused',
  GAME_OVER: 'game_over', LEADERBOARD: 'leaderboard',
};

// Maximum number of times a single Student ID is allowed to play.
export const MAX_ATTEMPTS_PER_ID = 3;

export const PARTICLE_CONFIG = {
  SCORE_POPUP_DURATION: 0.9,
  SPARKLE_COUNT: 14,
  EXPLOSION_COUNT: 28,
  SCREEN_SHAKE_DURATION: 0.5,
  SCREEN_SHAKE_INTENSITY: 16,
};
