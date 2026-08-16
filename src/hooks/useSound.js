import { useState, useCallback, useRef, useEffect } from 'react';
import { storage } from '../services/storage.js';

let _audioCtx = null;

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function playTone({ type = 'sine', freq = 440, freq2, duration = 0.2, volume = 0.3, delay = 0 } = {}) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    if (freq2 !== undefined) {
      osc.frequency.linearRampToValueAtTime(freq2, ctx.currentTime + delay + duration);
    }
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  } catch {
    // Ignore audio errors
  }
}

// ── Sound Definitions ──────────────────────────────────────────────────────────

function playCap() {
  // Pleasant ascending chime
  playTone({ type: 'sine', freq: 523, freq2: 784, duration: 0.18, volume: 0.25 });
  playTone({ type: 'triangle', freq: 784, duration: 0.12, volume: 0.15, delay: 0.05 });
}

function playBomb() {
  // Low explosion rumble
  playTone({ type: 'sawtooth', freq: 200, freq2: 40, duration: 0.45, volume: 0.4 });
  playTone({ type: 'square', freq: 80, freq2: 30, duration: 0.3, volume: 0.3, delay: 0.05 });
}

function playLevelUp() {
  // Cheerful ascending arpeggio
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    playTone({ type: 'triangle', freq: f, duration: 0.15, volume: 0.28, delay: i * 0.1 });
  });
}

function playGameOver() {
  // Descending sad tone
  playTone({ type: 'sawtooth', freq: 440, freq2: 220, duration: 0.5, volume: 0.3 });
  playTone({ type: 'sine', freq: 220, freq2: 110, duration: 0.6, volume: 0.25, delay: 0.4 });
}

function playHighScore() {
  // Fanfare
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((f, i) => {
    playTone({ type: 'triangle', freq: f, duration: 0.18, volume: 0.3, delay: i * 0.09 });
  });
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useSound() {
  const [muted, setMuted] = useState(storage.getSoundMuted());
  const mutedRef = useRef(muted);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const toggleMute = useCallback(() => {
    setMuted(prev => {
      const next = !prev;
      mutedRef.current = next;
      storage.setSoundMuted(next);
      return next;
    });
  }, []);

  const play = useCallback((soundFn) => {
    if (!mutedRef.current) {
      // Resume AudioContext if suspended (browser autoplay policy)
      try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        soundFn();
      } catch {
        // Ignore
      }
    }
  }, []);

  return {
    muted,
    toggleMute,
    sounds: {
      cap: () => play(playCap),
      bomb: () => play(playBomb),
      levelUp: () => play(playLevelUp),
      gameOver: () => play(playGameOver),
      highScore: () => play(playHighScore),
    },
  };
}
