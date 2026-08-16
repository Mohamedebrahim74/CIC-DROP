import { useEffect, useRef, useCallback } from 'react';

/**
 * Tracks keyboard state for game input.
 * Returns a ref to the live input state.
 * @param {boolean} enabled - whether to process input
 */
export function useKeyboard(enabled, onInput) {
  const keysRef = useRef({ left: false, right: false });

  useEffect(() => {
    const handleDown = (e) => {
      if (!enabled) return;
      let changed = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (!keysRef.current.left) { keysRef.current.left = true; changed = true; }
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (!keysRef.current.right) { keysRef.current.right = true; changed = true; }
      }
      if (changed && onInput) {
        onInput(keysRef.current.left, keysRef.current.right);
      }
      // Prevent page scroll on arrow keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };

    const handleUp = (e) => {
      let changed = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        if (keysRef.current.left) { keysRef.current.left = false; changed = true; }
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        if (keysRef.current.right) { keysRef.current.right = false; changed = true; }
      }
      if (changed && onInput) {
        onInput(keysRef.current.left, keysRef.current.right);
      }
    };

    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);

    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, [enabled, onInput]);

  // Reset all keys
  const resetKeys = useCallback(() => {
    keysRef.current = { left: false, right: false };
    if (onInput) onInput(false, false);
  }, [onInput]);

  return { keysRef, resetKeys };
}
