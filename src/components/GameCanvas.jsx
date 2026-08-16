import { useEffect, useRef, useCallback } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { useKeyboard } from '../hooks/useKeyboard.js';
import GameHUD from './GameHUD.jsx';
import MobileControls from './MobileControls.jsx';

export default function GameCanvas({
  playerName, score, level, highScore,
  muted, onToggleMute,
  onScoreChange, onLevelChange, onGameOver, onPause,
  isPaused,
}) {
  const canvasRef  = useRef(null);
  const engineRef  = useRef(null);
  const wrapRef    = useRef(null);
  const containerRef = useRef(null);

  const handleInput = useCallback((left, right) => {
    engineRef.current?.setInput(left, right);
  }, []);

  useKeyboard(!isPaused, handleInput);

  const handleLeftStart  = useCallback(() => engineRef.current?.setInput(true,  false), []);
  const handleLeftEnd    = useCallback(() => engineRef.current?.setInput(false, false), []);
  const handleRightStart = useCallback(() => engineRef.current?.setInput(false, true),  []);
  const handleRightEnd   = useCallback(() => engineRef.current?.setInput(false, false), []);

  /**
   * Choose canvas dimensions:
   *  - On narrow screens (mobile) → portrait 2:3
   *  - On wide screens (desktop/tablet) → fill available space, still 2:3 portrait
   *    but centred inside the dark wrapper
   */
  const getCanvasSize = useCallback(() => {
    const cont = containerRef.current;
    if (!cont) return { w: 420, h: 630 };

    const maxW = cont.clientWidth;
    const maxH = cont.clientHeight;

    // Keep 2:3 portrait ratio, fit inside container
    let w = maxW;
    let h = w * 1.5;

    if (h > maxH) {
      h = maxH;
      w = h / 1.5;
    }

    // Clamp to reasonable bounds
    w = Math.max(280, Math.min(w, 520));
    h = w * 1.5;

    return { w: Math.floor(w), h: Math.floor(h) };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { w, h } = getCanvasSize();
    canvas.width  = w;
    canvas.height = h;

    const engine = new GameEngine(canvas, { onScoreChange, onLevelChange, onGameOver });
    engineRef.current = engine;
    engine.start();

    const onResize = () => {
      if (!engineRef.current) return;
      const { w, h } = getCanvasSize();
      engineRef.current.resize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      engine.stop();
      engineRef.current = null;
      window.removeEventListener('resize', onResize);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!engineRef.current) return;
    if (isPaused) engineRef.current.pause();
    else          engineRef.current.resume();
  }, [isPaused]);

  return (
    /* Full-screen wrapper with atmospheric background */
    <div className="game-screen-bg" ref={wrapRef}>
      {/* Centred game column */}
      <div className="game-column">
        <GameHUD
          score={score} level={level} highScore={highScore}
          playerName={playerName}
          onPause={onPause} muted={muted} onToggleMute={onToggleMute}
        />

        <div className="canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            id="game-canvas"
            className="game-canvas"
            aria-label="CIC Game canvas"
          />
        </div>

        <MobileControls
          onLeftStart={handleLeftStart} onLeftEnd={handleLeftEnd}
          onRightStart={handleRightStart} onRightEnd={handleRightEnd}
        />
      </div>
    </div>
  );
}
