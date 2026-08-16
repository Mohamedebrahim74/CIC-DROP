import { useEffect, useState } from 'react';

export default function GameOverScreen({
  playerName, score, level, highScore, isNewHighScore,
  onPlayAgain, onHome, onLeaderboard,
}) {
  const [visible, setVisible]         = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 40);
    const t2 = isNewHighScore ? setTimeout(() => setShowCelebration(true), 700) : null;
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isNewHighScore]);

  return (
    <div className={`overlay-screen gameover-overlay${visible ? ' overlay-visible' : ''}`}
      role="dialog" aria-modal="true" aria-label="Game Over">

      {/* Confetti */}
      {showCelebration && (
        <div className="celebration-overlay" aria-hidden="true">
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="confetti-piece" style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 1.8}s`,
              animationDuration: `${2.4 + Math.random() * 1.2}s`,
              backgroundColor: ['#C8102E','#F5C842','#22c55e','#ffffff','#ff6b6b','#60a5fa'][i % 6],
            }} />
          ))}
        </div>
      )}

      <div className="overlay-card gameover-card">
        {/* Small logo */}
        <img src="/cic-logo.svg" alt="CIC" className="gameover-logo"
          onError={e => e.target.style.display = 'none'} />

        <div className="gameover-explosion" aria-hidden="true">💥</div>
        <h2 className="gameover-title">GAME OVER</h2>
        <p className="gameover-greeting">
          Great effort, <span className="text-accent">{playerName}</span>!
        </p>

        {/* Stats */}
        <div className="gameover-stats">
          <div className="stat-row">
            <span className="stat-label">YOUR SCORE</span>
            <span className="stat-value stat-score">{score.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">LEVEL REACHED</span>
            <span className="stat-value">{level}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-row">
            <span className="stat-label">HIGH SCORE</span>
            <span className="stat-value" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'clamp(18px,3.5vw,24px)' }}>
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>

        {isNewHighScore && (
          <div className="new-highscore-banner" aria-live="assertive">
            🏆 NEW HIGH SCORE!
          </div>
        )}

        <div className="overlay-actions">
          <button id="play-again-btn"      className="overlay-btn btn-primary"   onClick={onPlayAgain}>   ↺ PLAY AGAIN</button>
          <button id="view-leaderboard-btn" className="overlay-btn btn-secondary" onClick={onLeaderboard}> 🏆 LEADERBOARD</button>
          <button id="gameover-home-btn"   className="overlay-btn btn-ghost"     onClick={onHome}>        🏠 BACK TO HOME</button>
        </div>
      </div>
    </div>
  );
}
