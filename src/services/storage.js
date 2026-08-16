// ============================================================
// LOCAL STORAGE SERVICE
// ============================================================

const KEYS = {
  HIGH_SCORE: 'cic_game_high_score',
  PLAYER_NAME: 'cic_game_player_name',
  STUDENT_ID: 'cic_game_student_id',
  SOUND_MUTED: 'cic_game_sound_muted',
  LAST_SUBMITTED: 'cic_game_last_submitted',
};

export const storage = {
  getHighScore() {
    const v = localStorage.getItem(KEYS.HIGH_SCORE);
    return v ? parseInt(v, 10) : 0;
  },

  setHighScore(score) {
    localStorage.setItem(KEYS.HIGH_SCORE, String(score));
  },

  getPlayerName() {
    return localStorage.getItem(KEYS.PLAYER_NAME) || '';
  },

  setPlayerName(name) {
    localStorage.setItem(KEYS.PLAYER_NAME, name);
  },

  getStudentId() {
    return localStorage.getItem(KEYS.STUDENT_ID) || '';
  },

  setStudentId(id) {
    localStorage.setItem(KEYS.STUDENT_ID, id);
  },

  getSoundMuted() {
    return localStorage.getItem(KEYS.SOUND_MUTED) === 'true';
  },

  setSoundMuted(muted) {
    localStorage.setItem(KEYS.SOUND_MUTED, String(muted));
  },

  getLastSubmittedTime() {
    const v = localStorage.getItem(KEYS.LAST_SUBMITTED);
    return v ? parseInt(v, 10) : 0;
  },

  setLastSubmittedTime() {
    localStorage.setItem(KEYS.LAST_SUBMITTED, String(Date.now()));
  },
};
