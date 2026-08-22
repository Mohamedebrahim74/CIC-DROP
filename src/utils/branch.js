// ============================================================
// BRANCH DETECTION — single source of truth for the game branch
// ============================================================
// The branch is always derived from the URL path, never from user
// input, so a player can never submit an arbitrary branch value.

export const BRANCHES = {
  NEW_CAIRO: 'newcairo',
  ZAYED: 'zayed',
};

export const BRANCH_LABELS = {
  [BRANCHES.NEW_CAIRO]: 'NEW CAIRO',
  [BRANCHES.ZAYED]: 'ZAYED',
};

/**
 * Reads the current URL path and returns 'newcairo', 'zayed', or null
 * (root URL / any other path — existing behavior, no branch).
 */
export function getCurrentBranch() {
  const path = window.location.pathname.toLowerCase();

  if (path === '/cic/newcairo' || path.startsWith('/cic/newcairo/')) {
    return BRANCHES.NEW_CAIRO;
  }

  if (path === '/cic/zayed' || path.startsWith('/cic/zayed/')) {
    return BRANCHES.ZAYED;
  }

  return null;
}

/**
 * Human-readable label for the HUD/leaderboard, or '' if no branch.
 */
export function getBranchLabel(branch) {
  return BRANCH_LABELS[branch] || '';
}
