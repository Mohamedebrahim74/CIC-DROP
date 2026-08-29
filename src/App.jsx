import { useState, useCallback } from 'react';
import AdminPage    from './components/AdminPage.jsx';
import AccessGate   from './components/AccessGate.jsx';
import StartScreen  from './components/StartScreen.jsx';
import GameCanvas   from './components/GameCanvas.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import PauseMenu    from './components/PauseMenu.jsx';
import Leaderboard  from './components/Leaderboard.jsx';
import { useGameState } from './hooks/useGameState.js';
import { useSound }     from './hooks/useSound.js';
import { checkAttemptsAllowed, submitScore } from './services/leaderboard.js';
import { GAME_SCREENS }  from './utils/constants.js';
import './App.css';

// ─────────────────────────────────────────────────────────────────────────────
// GameApp — full game flow (rendered only after access is granted)
// ─────────────────────────────────────────────────────────────────────────────
function GameApp({ initialName, initialStudentId }) {
  const {
    screen, score, level, playerName, studentId,
    highScore, isNewHighScore, branch,
    startGame, handleGameOver, goToStart,
    goToLeaderboard, pause, resume,
    updateScore, updateLevel,
  } = useGameState();

  const { muted, toggleMute } = useSound();

  const [checking,      setChecking]      = useState(false);
  const [attemptsError, setAttemptsError] = useState('');

  // ── Start game: check attempt cap then transition to PLAYING ──
  const handleStart = useCallback(async (name, id) => {
    setChecking(true);
    setAttemptsError('');
    const { allowed, remaining } = await checkAttemptsAllowed(id);
    setChecking(false);
    if (!allowed) {
      setAttemptsError(`You have used all your allowed attempts. (${remaining} remaining)`);
      return;
    }
    startGame(name, id);
  }, [startGame]);

  // ── Game over: submit score then show overlay ──
  const onGameOver = useCallback(async (finalScore, finalLevel) => {
    handleGameOver(finalScore, finalLevel);
    if (finalScore > 0) {
      await submitScore(playerName, studentId, finalScore, finalLevel, branch);
    }
  }, [handleGameOver, playerName, studentId, branch]);

  const isPaused = screen === GAME_SCREENS.PAUSED;

  return (
    <>
      {/* ── START SCREEN ── */}
      {screen === GAME_SCREENS.START && (
        <StartScreen
          onStart={handleStart}
          checking={checking}
          attemptsError={attemptsError}
          onClearAttemptsError={() => setAttemptsError('')}
          prefillName={initialName}
          prefillId={initialStudentId}
        />
      )}

      {/* ── GAME CANVAS (visible while playing or paused) ── */}
      {(screen === GAME_SCREENS.PLAYING || screen === GAME_SCREENS.PAUSED) && (
        <GameCanvas
          playerName={playerName}
          score={score}
          level={level}
          highScore={highScore}
          muted={muted}
          onToggleMute={toggleMute}
          branch={branch}
          onScoreChange={updateScore}
          onLevelChange={updateLevel}
          onGameOver={onGameOver}
          onPause={pause}
          isPaused={isPaused}
        />
      )}

      {/* ── PAUSE MENU ── */}
      {screen === GAME_SCREENS.PAUSED && (
        <PauseMenu
          onResume={resume}
          onRestart={() => startGame(playerName, studentId)}
          onHome={goToStart}
        />
      )}

      {/* ── GAME OVER ── */}
      {screen === GAME_SCREENS.GAME_OVER && (
        <GameOverScreen
          playerName={playerName}
          score={score}
          level={level}
          highScore={highScore}
          isNewHighScore={isNewHighScore}
          onPlayAgain={() => startGame(playerName, studentId)}
          onHome={goToStart}
          onLeaderboard={goToLeaderboard}
        />
      )}

      {/* ── LEADERBOARD ── */}
      {screen === GAME_SCREENS.LEADERBOARD && (
        <Leaderboard
          currentPlayerName={playerName}
          currentScore={score}
          branch={branch}
          onHome={goToStart}
          onPlayAgain={() => startGame(playerName, studentId)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App — top-level router
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // /admin route → existing admin page (unchanged)
  const isAdminRoute =
    window.location.pathname.replace(/\/+$/, '') === '/admin';

  if (isAdminRoute) {
    return <AdminPage />;
  }

  // All other routes: access gate → game
  return <GatedGame />;
}

// Separate component so hook calls are always at the top level of a component.
function GatedGame() {
  const [accessState, setAccessState] = useState(null); // null | { name, studentId }

  const handleGranted = useCallback((name, studentId) => {
    setAccessState({ name, studentId });
  }, []);

  if (!accessState) {
    return <AccessGate onGranted={handleGranted} />;
  }

  return (
    <GameApp
      initialName={accessState.name}
      initialStudentId={accessState.studentId}
    />
  );
}
