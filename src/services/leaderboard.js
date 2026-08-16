import { supabase, isSupabaseAvailable } from './supabase.js';
import { storage } from './storage.js';
import { validateScore, maskStudentId, sanitizeName } from '../utils/scoreValidator.js';

const TABLE = 'game_scores';
const SUBMISSION_COOLDOWN_MS = 5000; // 5 seconds between submissions

/**
 * Submit a score to Supabase leaderboard.
 * Falls back to localStorage-only if Supabase unavailable.
 * Returns { success: boolean, error?: string }
 */
export async function submitScore(playerName, studentId, score, level) {
  // Validate
  const { valid, reason } = validateScore(score, level);
  if (!valid) {
    console.warn('[Leaderboard] Invalid score rejected:', reason);
    return { success: false, error: reason };
  }

  // Anti-spam: rate-limit submissions
  const lastSubmit = storage.getLastSubmittedTime();
  if (Date.now() - lastSubmit < SUBMISSION_COOLDOWN_MS) {
    return { success: false, error: 'Please wait before submitting again.' };
  }

  const cleanName = sanitizeName(playerName);

  // Update local high score
  if (score > storage.getHighScore()) {
    storage.setHighScore(score);
  }

  if (!isSupabaseAvailable) {
    console.warn('[Leaderboard] Supabase not available. Score saved locally only.');
    storage.setLastSubmittedTime();
    return { success: true, local: true };
  }

  try {
    const { error } = await supabase.from(TABLE).insert([
      {
        player_name: cleanName,
        student_id: studentId,
        score: Math.floor(score),
        level: Math.floor(level),
      },
    ]);

    if (error) {
      console.error('[Leaderboard] Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    storage.setLastSubmittedTime();
    return { success: true };
  } catch (err) {
    console.error('[Leaderboard] Network error:', err);
    return { success: false, error: 'Network error. Score saved locally.' };
  }
}

/**
 * Fetch top 10 scores from Supabase.
 * Falls back to a local mock if unavailable.
 * Returns { data: Array, error?: string }
 */
export async function getLeaderboard() {
  if (!isSupabaseAvailable) {
    return { data: getLocalLeaderboard(), local: true };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, player_name, student_id, score, level, created_at')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('[Leaderboard] Supabase fetch error:', error);
      return { data: getLocalLeaderboard(), local: true, error: error.message };
    }

    // Mask student IDs before returning
    const masked = (data || []).map((row, idx) => ({
      rank: idx + 1,
      id: row.id,
      player_name: row.player_name,
      student_id: maskStudentId(row.student_id),
      score: row.score,
      level: row.level,
    }));

    return { data: masked };
  } catch (err) {
    console.error('[Leaderboard] Network error:', err);
    return { data: getLocalLeaderboard(), local: true, error: err.message };
  }
}

/**
 * Get player rank for a given score from Supabase.
 */
export async function getPlayerRank(score) {
  if (!isSupabaseAvailable) return null;
  try {
    const { count } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .gt('score', score);
    return (count ?? 0) + 1;
  } catch {
    return null;
  }
}

/**
 * Build a local leaderboard entry from localStorage for fallback display.
 */
function getLocalLeaderboard() {
  const name = storage.getPlayerName() || 'You';
  const score = storage.getHighScore();
  if (!score) return [];
  return [
    {
      rank: 1,
      id: 'local-1',
      player_name: name,
      student_id: '****',
      score,
      level: 1,
    },
  ];
}
