import { supabase, isSupabaseAvailable } from './supabase.js';

const TABLE = 'allowed_players';

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC — used by the access gate on the main site
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ask Supabase whether a student is authorised to play.
 * Uses the check_player_access() RPC which only returns true/false —
 * it never exposes the student list.
 *
 * On any network or Supabase error → returns { allowed: false }.
 * The game must NEVER open if Supabase is unavailable.
 */
export async function checkPlayerAccess(name, studentId) {
  if (!isSupabaseAvailable) {
    return { allowed: false, error: 'Database not configured.' };
  }

  try {
    const { data, error } = await supabase.rpc('check_player_access', {
      input_name:       name.trim(),
      input_student_id: studentId.trim(),
    });

    if (error) {
      console.error('[Access] RPC error:', error);
      return { allowed: false, error: 'Verification failed. Please try again.' };
    }

    return { allowed: data === true };
  } catch (err) {
    console.error('[Access] Network error:', err);
    return { allowed: false, error: 'Network error. Please try again.' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — called only from the password-protected /admin page
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch all players ordered by newest first. */
export async function getAllowedPlayers() {
  if (!isSupabaseAvailable) return { data: [], error: 'Supabase not configured.' };
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error: error?.message };
  } catch (err) {
    return { data: [], error: err.message };
  }
}

/** Add a single player. Returns { success } or { error }. */
export async function addPlayer(name, studentId) {
  if (!isSupabaseAvailable) return { error: 'Supabase not configured.' };
  try {
    const { error } = await supabase.from(TABLE).insert([{
      name:       name.trim(),
      student_id: studentId.trim(),
      allowed:    true,
    }]);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/** Enable or disable a player by their UUID. */
export async function setPlayerAllowed(id, allowed) {
  if (!isSupabaseAvailable) return { error: 'Supabase not configured.' };
  try {
    const { error } = await supabase
      .from(TABLE)
      .update({ allowed })
      .eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/** Delete a player by their UUID. */
export async function deletePlayer(id) {
  if (!isSupabaseAvailable) return { error: 'Supabase not configured.' };
  try {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
}

/**
 * Bulk-import an array of { name, student_id } objects.
 * Rows with a duplicate student_id are silently skipped (no error).
 * Returns { inserted, skipped, error? }.
 */
export async function bulkImportPlayers(records) {
  if (!isSupabaseAvailable) return { error: 'Supabase not configured.' };
  if (!records.length) return { inserted: 0, skipped: 0 };

  try {
    // Insert one-by-one so we can count duplicates without aborting the batch.
    let inserted = 0;
    let skipped  = 0;

    for (const r of records) {
      const { error } = await supabase.from(TABLE).insert([{
        name:       r.name.trim(),
        student_id: r.student_id.trim(),
        allowed:    true,
      }]);

      if (error) {
        // Unique violation code in PostgreSQL / Supabase
        if (error.code === '23505') {
          skipped++;
        } else {
          // Unexpected error — surface it
          return { error: error.message, inserted, skipped };
        }
      } else {
        inserted++;
      }
    }

    return { inserted, skipped };
  } catch (err) {
    return { error: err.message };
  }
}
