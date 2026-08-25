import { supabase, isSupabaseAvailable } from './supabase.js';
import { storage } from './storage.js';
import { validateScore, maskStudentId, sanitizeName } from '../utils/scoreValidator.js';
import { MAX_ATTEMPTS_PER_ID } from '../utils/constants.js';
import { BRANCHES } from '../utils/branch.js';

const TABLE = 'game_scores';
const SUBMISSION_COOLDOWN_MS = 5000; // 5 seconds between submissions
const VALID_BRANCHES = Object.values(BRANCHES); // ['newcairo', 'zayed']

/**
 * Only ever allow one of the known branch values through to Supabase.
 * The branch is derived from the URL (see utils/branch.js) and is never
 * taken from arbitrary user input, but this is a last line of defense
 * against a tampered/forged value reaching the database.
 */
function sanitizeBranch(branch) {
  return VALID_BRANCHES.includes(branch) ? branch : null;
}

/**
 * Normalize a student ID for comparison (trim whitespace, case-insensitive)
 * so "abc123", " ABC123", and "Abc123" are all treated as the same player.
 */
function normalizeId(studentId) {
  return (studentId || '').trim();
}

/**
 * Count how many scores have already been submitted for a given Student ID.
 * Used to enforce the MAX_ATTEMPTS_PER_ID cap before a new game starts, and
 * again right before a score is inserted as a defense-in-depth check.
 * Fails OPEN (returns 0) on network/Supabase errors so a transient outage
 * never locks a legitimate player out.
 */
export async function getAttemptsUsed(studentId) {
  const id = normalizeId(studentId);
  if (!id) return 0;

  if (!isSupabaseAvailable) {
    // No backend configured (local/dev preview) -- can't enforce a
    // cross-device limit, so don't block play.
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from(TABLE)
      .select('id', { count: 'exact', head: true })
      .ilike('student_id', id); // case-insensitive exact match

    if (error) {
      console.error('[Leaderboard] Attempts check failed:', error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error('[Leaderboard] Attempts check network error:', err);
    return 0;
  }
}

/**
 * Returns { allowed, used, remaining } for a given Student ID.
 */
export async function checkAttemptsAllowed(studentId) {
  const used = await getAttemptsUsed(studentId);
  return {
    allowed: used < MAX_ATTEMPTS_PER_ID,
    used,
    remaining: Math.max(0, MAX_ATTEMPTS_PER_ID - used),
  };
}

/**
 * Submit a score to Supabase leaderboard.
 * Falls back to localStorage-only if Supabase unavailable.
 * Returns { success: boolean, error?: string }
 */
export async function submitScore(playerName, studentId, score, level, branch) {
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

  // Defense-in-depth: re-check the attempt cap right before inserting, in
  // case the client-side gate was bypassed or stale (e.g. two tabs open).
  const used = await getAttemptsUsed(studentId);
  if (used >= MAX_ATTEMPTS_PER_ID) {
    return { success: false, error: 'MAX_ATTEMPTS_REACHED' };
  }

  try {
    const { error } = await supabase.from(TABLE).insert([
      {
        player_name: cleanName,
        student_id: studentId,
        score: Math.floor(score),
        level: Math.floor(level),
        branch: sanitizeBranch(branch),
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
 * Fetch top 10 scores from Supabase, one entry per Student ID (their best
 * score only -- so a player who has used multiple of their 3 attempts
 * never shows up more than once on the board).
 *
 * @param {'newcairo'|'zayed'|'all'} branch - which board to show.
 *   'all' (default) returns the combined leaderboard across all branches.
 * Falls back to a local mock if unavailable.
 * Returns { data: Array, error?: string }
 */
export async function getLeaderboard(branch = 'all') {
  if (!isSupabaseAvailable) {
    return { data: getLocalLeaderboard(), local: true };
  }

  try {
    // Fetch a wide pool ordered by score desc, then keep only each
    // player's first (= highest) row. A generous pool size means the
    // dedup still surfaces a full top 10 even with many repeat players.
    let query = supabase
      .from(TABLE)
      .select('id, player_name, student_id, score, level, branch, created_at')
      .order('score', { ascending: false })
      .limit(500);

    if (branch && branch !== 'all' && VALID_BRANCHES.includes(branch)) {
      query = query.eq('branch', branch);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Leaderboard] Supabase fetch error:', error);
      return { data: getLocalLeaderboard(), local: true, error: error.message };
    }

    const seenIds = new Set();
    const deduped = [];
    for (const row of data || []) {
      const key = normalizeId(row.student_id).toLowerCase();
      if (key && seenIds.has(key)) continue;
      if (key) seenIds.add(key);
      deduped.push(row);
      if (deduped.length >= 10) break;
    }

    // Mask student IDs before returning
    const masked = deduped.map((row, idx) => ({
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
 * ADMIN ONLY: Fetch every leaderboard row (unmasked, not deduped/limited to
 * top 10). Used by the admin page to review all results.
 * Returns { data: Array, error?: string }
 */
export async function getAllLeaderboardEntries() {
  if (!isSupabaseAvailable) {
    return { data: [], error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, player_name, student_id, score, level, branch, created_at')
      .order('score', { ascending: false });

    if (error) {
      console.error('[Leaderboard] Admin fetch error:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [] };
  } catch (err) {
    console.error('[Leaderboard] Admin fetch network error:', err);
    return { data: [], error: err.message };
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
