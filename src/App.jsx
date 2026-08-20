import { useCallback, useRef, useEffect } from 'react';
import { useGameState } from './hooks/useGameState.js';
import { useSound } from './hooks/useSound.js';
import { GAME_SCREENS } from './utils/constants.js';
import { submitScore } from './services/leaderboard.js';

import StartScreen from './components/StartScreen.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import Leaderboard from './components/Leaderboard.jsx';

import './App.css';

export default function App() {
  const {
    screen, score, level, playerName, studentId, highScore, isNewHighScore,
    startGame, handleGameOver, goToStart, goToLeaderboard,
    pause, resume, updateScore, updateLevel,
  } = useGameState();

  const { muted, toggleMute, sounds } = useSound();

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
    submitScore(playerName, studentId, finalScore, finalLevel).then(({ success, error }) => {
      if (!success) console.warn('[Score submit]', error);
    });

    // Play high score sound if new record
    const localHighScore = parseInt(localStorage.getItem('cic_game_high_score') || '0');
    if (finalScore >= localHighScore && finalScore > 0) {
      setTimeout(() => sounds.highScore(), 400);
    }
  }, [sounds, handleGameOver, playerName, studentId]);

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
    startGame(playerName, studentId);
  }, [startGame, playerName, studentId]);

  const handlePlayAgain = useCallback(() => {
    prevLevelRef.current = 1;
    prevScoreRef.current = 0;
    startGame(playerName, studentId);
  }, [startGame, playerName, studentId]);

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
        <StartScreen onStart={startGame} />
      )}

      {/* Game Canvas (keep mounted while playing or paused) */}
      {isPlaying && (
        <GameCanvas
          playerName={playerName}
          score={score}
          level={level}
          highScore={highScore}
          muted={muted}
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
          onHome={goToStart}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
