import { DIFFICULTY_TABLE, SCORE_CONFIG } from '../utils/constants.js';

export class DifficultyManager {
  constructor() {
    this.level = 1;
    this._config = { ...DIFFICULTY_TABLE[0] };
  }

  /** Update difficulty based on current score */
  update(score) {
    const newLevel = Math.min(
      Math.floor(score / SCORE_CONFIG.LEVEL_THRESHOLD) + 1,
      SCORE_CONFIG.MAX_LEVEL
    );
    const levelChanged = newLevel !== this.level;
    this.level = newLevel;
    const tableIdx = Math.min(newLevel - 1, DIFFICULTY_TABLE.length - 1);
    this._config = { ...DIFFICULTY_TABLE[tableIdx] };
    return levelChanged;
  }

  get fallSpeed() { return this._config.fallSpeed; }
  get spawnInterval() { return this._config.spawnInterval; }
  get bombProbability() { return this._config.bombProbability; }
  get maxObjects() { return this._config.maxObjects; }

  reset() {
    this.level = 1;
    this._config = { ...DIFFICULTY_TABLE[0] };
  }
}
