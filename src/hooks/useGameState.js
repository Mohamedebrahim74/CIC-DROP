import { useState, useCallback, useRef } from 'react';
import { GAME_SCREENS } from '../utils/constants.js';
import { storage } from '../services/storage.js';

export function useGameState() {
  const [screen, setScreen] = useState(GAME_SCREENS.START);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [playerName, setPlayerName] = useState(storage.getPlayerName());
  const [studentId, setStudentId] = useState(storage.getStudentId());
  const [highScore, setHighScore] = useState(storage.getHighScore());
  const [isNewHighScore, setIsNewHighScore] = useState(false);

  const updateScore = useCallback((newScore) => {
    setScore(newScore);
    if (newScore > storage.getHighScore()) {
      storage.setHighScore(newScore);
      setHighScore(newScore);
      setIsNewHighScore(true);
    }
  }, []);

  const updateLevel = useCallback((newLevel) => {
    setLevel(newLevel);
  }, []);

  const startGame = useCallback((name, id) => {
    storage.setPlayerName(name);
    storage.setStudentId(id);
    setPlayerName(name);
    setStudentId(id);
    setScore(0);
    setLevel(1);
    setIsNewHighScore(false);
    setScreen(GAME_SCREENS.PLAYING);
  }, []);

  const handleGameOver = useCallback((finalScore, finalLevel) => {
    setScore(finalScore);
    setLevel(finalLevel);
    const hs = storage.getHighScore();
    if (finalScore >= hs && finalScore > 0) {
      setIsNewHighScore(true);
    }
    setScreen(GAME_SCREENS.GAME_OVER);
  }, []);

  const goToStart = useCallback(() => {
    setScreen(GAME_SCREENS.START);
    setScore(0);
    setLevel(1);
    setIsNewHighScore(false);
  }, []);

  const goToLeaderboard = useCallback(() => {
    setScreen(GAME_SCREENS.LEADERBOARD);
  }, []);

  const pause = useCallback(() => {
    setScreen(GAME_SCREENS.PAUSED);
  }, []);

  const resume = useCallback(() => {
    setScreen(GAME_SCREENS.PLAYING);
  }, []);

  return {
    screen, score, level, playerName, studentId, highScore,
    isNewHighScore, setHighScore,
    startGame, handleGameOver, goToStart, goToLeaderboard,
    pause, resume, updateScore, updateLevel,
  };
}
