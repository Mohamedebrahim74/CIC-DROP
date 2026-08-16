import { OBJECT_TYPES } from '../utils/constants.js';

/**
 * AABB (Axis-Aligned Bounding Box) collision detection.
 * Tests player against each falling object.
 *
 * Returns an array of collision results: { object, type: 'cap' | 'bomb' }
 */
export class CollisionSystem {
  /**
   * @param {Player} player
   * @param {FallingObject[]} objects
   * @returns {{ object: FallingObject, type: string }[]}
   */
  static check(player, objects) {
    const results = [];

    // Player hitbox (slightly smaller for fairness)
    const pad = 8;
    const px1 = player.x + pad;
    const px2 = player.x + player.width - pad;
    const py1 = player.y + pad;
    const py2 = player.y + player.height - pad;

    for (const obj of objects) {
      if (obj.collected || obj.offScreen) continue;

      const r = obj.getRect();

      // AABB overlap test
      if (px1 < r.right && px2 > r.left && py1 < r.bottom && py2 > r.top) {
        results.push({ object: obj, type: obj.type });
        obj.collected = true; // Mark immediately to prevent double-hits
      }
    }

    return results;
  }
}
