import { SCORE_CONFIG } from './constants.js';

/**
 * Validate a submitted score before storing to Supabase.
 * Returns { valid: boolean, reason: string }
 */
export function validateScore(score, level) {
  if (typeof score !== 'number' || isNaN(score)) {
    return { valid: false, reason: 'Score must be a number' };
  }
  if (score < 0) {
    return { valid: false, reason: 'Score cannot be negative' };
  }
  if (score > SCORE_CONFIG.MAX_VALID_SCORE) {
    return { valid: false, reason: `Score exceeds maximum allowed (${SCORE_CONFIG.MAX_VALID_SCORE})` };
  }
  if (typeof level !== 'number' || level < 1) {
    return { valid: false, reason: 'Level must be at least 1' };
  }
  if (level > SCORE_CONFIG.MAX_VALID_LEVEL) {
    return { valid: false, reason: `Level exceeds maximum allowed (${SCORE_CONFIG.MAX_VALID_LEVEL})` };
  }
  // Sanity check: max achievable score at this level should be plausible
  // Each level requires 100 pts, 10 pts per cap = 10 caps per level
  // Add some buffer for speed
  const theoreticalMaxScore = level * SCORE_CONFIG.LEVEL_THRESHOLD * 3;
  if (score > theoreticalMaxScore) {
    return { valid: false, reason: 'Score/level combination is not plausible' };
  }
  return { valid: true, reason: 'OK' };
}

/**
 * Mask a student ID for public display.
 * Example: "20261234567" → "2026****67"
 */
export function maskStudentId(studentId) {
  const s = String(studentId);
  if (s.length <= 4) return '****';
  const prefix = s.slice(0, 4);
  const suffix = s.slice(-2);
  const masked = '*'.repeat(Math.max(s.length - 6, 2));
  return `${prefix}${masked}${suffix}`;
}

/**
 * Sanitize player name for display (trim whitespace, limit length)
 */
export function sanitizeName(name) {
  return String(name).trim().slice(0, 30);
}
