import { useState, useEffect, useRef } from 'react';

export default function GameHUD({ score, level, highScore, playerName, onPause, muted, onToggleMute }) {
  const [levelNotify, setLevelNotify] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);
  const timer = useRef(null);

  useEffect(() => {
    if (level > prevLevel) {
      setLevelNotify(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setLevelNotify(false), 2500);
      setPrevLevel(level);
    }
  }, [level, prevLevel]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="game-hud" role="status" aria-live="polite">
      {/* LEFT — Score */}
      <div className="hud-section">
        <div className="hud-label">SCORE</div>
        <div className="hud-score-wrap">
          <span className="hud-trophy" aria-hidden="true">🏆</span>
          <span className="hud-value hud-score">{score.toLocaleString()}</span>
        </div>
      </div>

      {/* CENTER — Level + Player */}
      <div className="hud-section hud-center">
        <div className="hud-label">LEVEL</div>
        <div className={`hud-value hud-level${levelNotify ? ' level-bump' : ''}`}>{level}</div>
        <div className="hud-player-name">
          PLAYER: <span className="player-name-val">{playerName}</span>
        </div>
      </div>

      {/* RIGHT — High Score + Buttons */}
      <div className="hud-section hud-right">
        <div className="hud-label">HIGH SCORE</div>
        <div className="hud-value hud-highscore">{highScore.toLocaleString()}</div>
        <div className="hud-buttons">
          <button id="pause-btn" className="hud-btn" onClick={onPause} aria-label="Pause game" title="Pause">⏸</button>
          <button id="mute-btn"  className="hud-btn" onClick={onToggleMute} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
        </div>
      </div>

      {/* Level-up toast */}
      {levelNotify && (
        <div className="level-up-toast" aria-live="assertive">🏆 LEVEL {level}!</div>
      )}
    </div>
  );
}
