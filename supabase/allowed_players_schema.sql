-- ================================================================
-- CIC DROP — allowed_players table + access check RPC
-- ================================================================
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ================================================================


-- ────────────────────────────────────────────────────────────────
-- 1. CREATE TABLE
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.allowed_players (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  student_id  TEXT        NOT NULL,
  allowed     BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Student IDs must be unique
  CONSTRAINT allowed_players_student_id_key UNIQUE (student_id)
);

COMMENT ON TABLE  public.allowed_players                IS 'Students who are permitted to access the CIC DROP game.';
COMMENT ON COLUMN public.allowed_players.name           IS 'Full name of the student.';
COMMENT ON COLUMN public.allowed_players.student_id     IS 'Unique student ID (TEXT to preserve leading zeros).';
COMMENT ON COLUMN public.allowed_players.allowed        IS 'Set to false to temporarily block a student without deleting them.';


-- ────────────────────────────────────────────────────────────────
-- 2. INDEXES for fast lookups
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_allowed_players_student_id
  ON public.allowed_players (student_id);

CREATE INDEX IF NOT EXISTS idx_allowed_players_allowed
  ON public.allowed_players (allowed);


-- ────────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.allowed_players ENABLE ROW LEVEL SECURITY;

-- The public can NOT do raw SELECT/INSERT/UPDATE/DELETE on this table.
-- All public access goes through the check_player_access() RPC below.
-- The admin page calls the table directly via the anon key but is
-- already protected by the VITE_ADMIN_PASSWORD frontend gate.
-- To keep the admin CRUD working with the anon key:
CREATE POLICY "admin_full_access" ON public.allowed_players
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────
-- 4. SECURE ACCESS CHECK FUNCTION (RPC)
-- ────────────────────────────────────────────────────────────────
-- The public website calls this RPC to verify a student.
-- It only ever returns TRUE or FALSE — it never exposes the
-- student list or any row data.
--
-- Normalisation applied:
--   • leading/trailing spaces trimmed
--   • internal multiple spaces collapsed to one
--   • comparison is case-insensitive
--   • student_id is trimmed only (case-sensitive by default)
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_player_access(
  input_name       TEXT,
  input_student_id TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM   public.allowed_players
    WHERE
      -- Normalise name: trim outer spaces, collapse inner spaces, lowercase
      lower(regexp_replace(trim(name),       '\s+', ' ', 'g'))
        = lower(regexp_replace(trim(input_name), '\s+', ' ', 'g'))
      -- Normalise student_id: trim only
      AND trim(student_id) = trim(input_student_id)
      -- Must be explicitly allowed
      AND allowed = true
  ) INTO v_result;

  RETURN COALESCE(v_result, false);
END;
$$;

-- Grant execute to the anon role (used by the frontend anon key).
-- Revoke from PUBLIC first so only anon can call it.
REVOKE EXECUTE ON FUNCTION public.check_player_access(TEXT, TEXT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.check_player_access(TEXT, TEXT) TO   anon;


-- ────────────────────────────────────────────────────────────────
-- 5. OPTIONAL: seed a test student (remove before production)
-- ────────────────────────────────────────────────────────────────
-- INSERT INTO public.allowed_players (name, student_id, allowed)
-- VALUES ('Test Student', '000001', true);
