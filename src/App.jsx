import { useCallback, useRef, useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState.js';
import { useSound } from './hooks/useSound.js';
import { GAME_SCREENS, MAX_ATTEMPTS_PER_ID } from './utils/constants.js';
import { submitScore, checkAttemptsAllowed } from './services/leaderboard.js';

import StartScreen from './components/StartScreen.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import Leaderboard from './components/Leaderboard.jsx';

import './App.css';

export default function App() {
  const {
    screen, score, level, playerName, studentId, highScore, isNewHighScore, branch,
    startGame, handleGameOver, goToStart, goToLeaderboard,
    pause, resume, updateScore, updateLevel,
  } = useGameState();

  const { muted, toggleMute, sounds } = useSound();

  // ── Attempt-limit gating ─────────────────────────────────────
  // Every path that can start a game (Start Screen submit, Restart from
  // pause, Play Again from game-over/leaderboard) funnels through this
  // one function so the MAX_ATTEMPTS_PER_ID cap is always enforced,
  // regardless of which button was pressed.
  const [attemptsError, setAttemptsError] = useState('');
  const [checkingAttempts, setCheckingAttempts] = useState(false);

  const beginGame = useCallback(async (name, id) => {
    setCheckingAttempts(true);
    setAttemptsError('');
    const { allowed, used } = await checkAttemptsAllowed(id);
    setCheckingAttempts(false);

    if (!allowed) {
      setAttemptsError(
        `This Student ID has already played ${used} of ${MAX_ATTEMPTS_PER_ID} allowed games. No more attempts are available.`
      );
      goToStart();
      return;
    }

    startGame(name, id);
  }, [startGame, goToStart]);

  const clearAttemptsError = useCallback(() => setAttemptsError(''), []);

  // Track previous level for sound
  const prevLevelRef = useRef(1);

  // Score change callback (from engine)
  const onScoreChange = useCallback((newScore) => {
    updateScore(newScore);
  }, [updateScore]);

  // Level change callback (from engine)
  const onLevelChange = useCallback((newLevel) => {
    updateLevel(newLevel);
    if (newLevel > prevLevelRef.current) {
      sounds.levelUp();
      prevLevelRef.current = newLevel;
    }
  }, [updateLevel, sounds]);

  // Game over callback (from engine)
  const onGameOverCallback = useCallback((finalScore, finalLevel) => {
    sounds.gameOver();
    handleGameOver(finalScore, finalLevel);

    // Submit score to leaderboard
    submitScore(playerName, studentId, finalScore, finalLevel, branch).then(({ success, error }) => {
      if (!success) console.warn('[Score submit]', error);
    });

    // Play high score sound if new record
    const localHighScore = parseInt(localStorage.getItem('cic_game_high_score') || '0');
    if (finalScore >= localHighScore && finalScore > 0) {
      setTimeout(() => sounds.highScore(), 400);
    }
  }, [sounds, handleGameOver, playerName, studentId, branch]);

  // Collect cap sound — wired from score changes
  const prevScoreRef = useRef(0);
  useEffect(() => {
    if (score > prevScoreRef.current && screen === GAME_SCREENS.PLAYING) {
      sounds.cap();
    }
    prevScoreRef.current = score;
  }, [score, screen, sounds]);

  // Pause handlers
  const handlePause = useCallback(() => { pause(); }, [pause]);
  const handleResume = useCallback(() => { resume(); }, [resume]);

  const handleRestart = useCallback(() => {
    prevLevelRef.current = 1;
    prevScoreRef.current = 0;
    beginGame(playerName, studentId);
  }, [beginGame, playerName, studentId]);

  const handlePlayAgain = useCallback(() => {
    prevLevelRef.current = 1;
    prevScoreRef.current = 0;
    beginGame(playerName, studentId);
  }, [beginGame, playerName, studentId]);

  const isPaused = screen === GAME_SCREENS.PAUSED;
  const isPlaying = screen === GAME_SCREENS.PLAYING || isPaused;

  return (
    <div
      className="app-root"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Start Screen */}
      {screen === GAME_SCREENS.START && (
        <StartScreen
          onStart={beginGame}
          checking={checkingAttempts}
          attemptsError={attemptsError}
          onClearAttemptsError={clearAttemptsError}
        />
      )}

      {/* Game Canvas (keep mounted while playing or paused) */}
      {isPlaying && (
        <GameCanvas
          playerName={playerName}
          score={score}
          level={level}
          highScore={highScore}
          muted={muted}
          branch={branch}
          onToggleMute={toggleMute}
          onScoreChange={onScoreChange}
          onLevelChange={onLevelChange}
          onGameOver={onGameOverCallback}
          onPause={handlePause}
          isPaused={isPaused}
        />
      )}

      {/* Pause Menu overlay */}
      {isPaused && (
        <PauseMenu
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={goToStart}
        />
      )}

      {/* Game Over Screen */}
      {screen === GAME_SCREENS.GAME_OVER && (
        <GameOverScreen
          playerName={playerName}
          score={score}
          level={level}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onPlayAgain={handlePlayAgain}
          onHome={goToStart}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {/* Leaderboard Screen */}
      {screen === GAME_SCREENS.LEADERBOARD && (
        <Leaderboard
          currentPlayerName={playerName}
          currentScore={score}
          branch={branch}
          onHome={goToStart}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
