export default function PauseMenu({ onResume, onRestart, onHome }) {
  return (
    <div className="overlay-screen" role="dialog" aria-modal="true" aria-label="Game Paused">
      <div className="overlay-card">
        <div className="pause-icon" aria-hidden="true">⏸</div>
        <h2 className="overlay-title">GAME PAUSED</h2>
        <p className="overlay-subtitle">Your caps are waiting — ready to continue?</p>
        <div className="overlay-actions">
          <button id="resume-btn"       className="overlay-btn btn-primary"   onClick={onResume}>  ▶ RESUME GAME</button>
          <button id="pause-restart-btn" className="overlay-btn btn-secondary" onClick={onRestart}> ↺ RESTART</button>
          <button id="pause-home-btn"   className="overlay-btn btn-ghost"     onClick={onHome}>   🏠 HOME</button>
        </div>
      </div>
    </div>
  );
}
