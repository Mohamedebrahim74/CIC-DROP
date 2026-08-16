export default function MobileControls({ onLeftStart, onLeftEnd, onRightStart, onRightEnd }) {
  const stop = e => e.preventDefault();
  return (
    <div className="mobile-controls" aria-label="Mobile game controls">
      <button
        id="mobile-left-btn"
        className="mobile-btn mobile-btn-left"
        onTouchStart={e => { stop(e); onLeftStart(); }}
        onTouchEnd={e   => { stop(e); onLeftEnd(); }}
        onTouchCancel={e => { stop(e); onLeftEnd(); }}
        onMouseDown={onLeftStart} onMouseUp={onLeftEnd} onMouseLeave={onLeftEnd}
        aria-label="Move left"
      >
        <span className="mobile-btn-arrow">◀</span>
      </button>

      <button
        id="mobile-right-btn"
        className="mobile-btn mobile-btn-right"
        onTouchStart={e => { stop(e); onRightStart(); }}
        onTouchEnd={e   => { stop(e); onRightEnd(); }}
        onTouchCancel={e => { stop(e); onRightEnd(); }}
        onMouseDown={onRightStart} onMouseUp={onRightEnd} onMouseLeave={onRightEnd}
        aria-label="Move right"
      >
        <span className="mobile-btn-arrow">▶</span>
      </button>
    </div>
  );
}
