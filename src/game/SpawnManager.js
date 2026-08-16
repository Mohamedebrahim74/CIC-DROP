import { FallingObject } from './FallingObject.js';
import { OBJECT_TYPES } from '../utils/constants.js';

export class SpawnManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.timer = 0;
    this.objects = [];
  }

  resize(w, h) {
    this.canvasWidth = w;
    this.canvasHeight = h;
  }

  /**
   * Update spawn timer. Returns newly spawned objects (if any).
   * @param {number} dt - delta time in seconds
   * @param {DifficultyManager} difficulty
   */
  update(dt, difficulty) {
    this.timer += dt;

    const spawned = [];
    if (this.timer >= difficulty.spawnInterval) {
      this.timer = 0;

      // How many objects to spawn at once (1 at low levels, up to 2+ later)
      const batchSize = difficulty.level >= 8 ? 2 : 1;

      for (let i = 0; i < batchSize; i++) {
        if (this.objects.length < difficulty.maxObjects) {
          const obj = this._spawnOne(difficulty);
          if (obj) {
            this.objects.push(obj);
            spawned.push(obj);
          }
        }
      }
    }

    return spawned;
  }

  _spawnOne(difficulty) {
    const isBomb = Math.random() < difficulty.bombProbability;
    const type = isBomb ? OBJECT_TYPES.BOMB : OBJECT_TYPES.CAP;

    // Spawn X spread across canvas with margin
    const margin = 40;
    const x = margin + Math.random() * (this.canvasWidth - margin * 2);

    return new FallingObject(x, type, difficulty.fallSpeed, this.canvasWidth, this.canvasHeight);
  }

  /**
   * Update all objects, remove off-screen and collected ones.
   * @returns {FallingObject[]} active objects
   */
  updateObjects(dt) {
    for (const obj of this.objects) {
      obj.update(dt);
    }
    this.objects = this.objects.filter(o => !o.offScreen && !o.collected);
    return this.objects;
  }

  clearAll() {
    this.objects = [];
    this.timer = 0;
  }

  reset() {
    this.clearAll();
  }
}
