import { useState, useEffect, useRef } from 'react';
import { checkPlayerAccess } from '../services/accessControl.js';
import { isSupabaseAvailable } from '../services/supabase.js';

// sessionStorage keys — scoped to this tab session
const SK_OK   = 'cic_access_ok';
const SK_NAME = 'cic_access_name';
const SK_ID   = 'cic_access_id';

/**
 * AccessGate
 *
 * Shows the existing Convocation closing screen with a Name + Student ID
 * form layered on top.
 *
 * Props:
 *   onGranted(name, studentId) — called when access is approved.
 *
 * Flow:
 *   1. On mount, check sessionStorage — if already approved, call onGranted
 *      immediately (no flicker, no re-check).
 *   2. Otherwise show the form.
 *   3. On submit, call the check_player_access Supabase RPC.
 *   4. Approved  → save to sessionStorage, call onGranted.
 *   5. Rejected  → show generic "Access Restricted" message.
 */
export default function AccessGate({ onGranted }) {
  const [name,      setName]      = useState('');
  const [studentId, setStudentId] = useState('');
  const [nameError, setNameError] = useState('');
  const [idError,   setIdError]   = useState('');
  // 'idle' | 'checking' | 'denied'
  const [status, setStatus] = useState('idle');
  const nameRef = useRef(null);

  // ── Check existing session on mount ───────────────────────────
  useEffect(() => {
    if (sessionStorage.getItem(SK_OK) === '1') {
      const n  = sessionStorage.getItem(SK_NAME) || '';
      const id = sessionStorage.getItem(SK_ID)   || '';
      onGranted(n, id);
      return;
    }
    // Auto-focus the name field
    nameRef.current?.focus();
  }, [onGranted]);

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    let ok = true;
    if (!name.trim()) {
      setNameError('Please enter your full name.');
      ok = false;
    } else {
      setNameError('');
    }
    if (!studentId.trim()) {
      setIdError('Please enter your Student ID.');
      ok = false;
    } else {
      setIdError('');
    }
    return ok;
  };

  // ── Submit handler ─────────────────────────────────────────────
  const handleCheck = async () => {
    if (!validate() || status === 'checking') return;

    // If Supabase is not configured, always deny (fail-closed).
    if (!isSupabaseAvailable) {
      setStatus('denied');
      return;
    }

    setStatus('checking');

    const { allowed } = await checkPlayerAccess(name, studentId);

    if (allowed) {
      // Persist the session so the player doesn't need to re-enter details
      sessionStorage.setItem(SK_OK,   '1');
      sessionStorage.setItem(SK_NAME, name.trim());
      sessionStorage.setItem(SK_ID,   studentId.trim());
      onGranted(name.trim(), studentId.trim());
    } else {
      setStatus('denied');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleCheck();
  };

  const handleTryAgain = () => {
    setStatus('idle');
    setName('');
    setStudentId('');
    setNameError('');
    setIdError('');
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="start-screen">
      <div className="start-content">

        {/* ── Logo (identical to the existing Convocation screen) ── */}
        <div className="start-logo-wrap">
          <img
            src="/cic-logo-full.svg"
            alt="Canadian International College"
            className="start-logo"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="start-logo-fallback" style={{ display: 'none' }}>
            <span className="maple-leaf-big" aria-hidden="true">🍁</span>
            <div>
              <div className="logo-cic-text">CIC</div>
              <div className="logo-full-text">CANADIAN INTERNATIONAL COLLEGE</div>
            </div>
          </div>
        </div>

        {/* ── Title (same as Convocation screen) ── */}
        <h1 className="start-title">
          SEE YOU IN
          <span className="title-accent">CONVOCATION 🎓</span>
        </h1>

        {/* ── Access form card ── */}
        <div className="start-card">
          {status === 'denied' ? (
            /* ── Denied state ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
              <p className="form-heading" style={{ marginBottom: 10 }}>
                ACCESS RESTRICTED
              </p>
              <p style={{
                fontSize: 13,
                color: 'var(--white-50)',
                lineHeight: 1.6,
                marginBottom: 20,
              }}>
                This game is currently available for invited students only.
              </p>
              <button
                className="overlay-btn btn-ghost"
                onClick={handleTryAgain}
              >
                ← TRY AGAIN
              </button>
            </div>
          ) : (
            /* ── Form state (idle or checking) ── */
            <>
              <p className="form-heading">GAME ACCESS</p>

              {/* Name field */}
              <div className="form-group">
                <label htmlFor="access-name" className="form-label">Name</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden="true">👤</span>
                  <input
                    ref={nameRef}
                    id="access-name"
                    type="text"
                    className={`form-input${nameError ? ' input-error' : ''}`}
                    placeholder="Enter your full name"
                    value={name}
                    maxLength={50}
                    autoComplete="off"
                    onChange={(e) => { setName(e.target.value); setNameError(''); }}
                    onKeyDown={handleKey}
                  />
                </div>
                {nameError && (
                  <span className="error-msg" role="alert">{nameError}</span>
                )}
              </div>

              {/* Student ID field */}
              <div className="form-group">
                <label htmlFor="access-id" className="form-label">Student ID</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden="true">🪪</span>
                  <input
                    id="access-id"
                    type="text"
                    className={`form-input${idError ? ' input-error' : ''}`}
                    placeholder="Enter your Student ID"
                    value={studentId}
                    maxLength={20}
                    autoComplete="off"
                    onChange={(e) => { setStudentId(e.target.value); setIdError(''); }}
                    onKeyDown={handleKey}
                  />
                </div>
                {idError && (
                  <span className="error-msg" role="alert">{idError}</span>
                )}
              </div>

              {/* Submit button */}
              <button
                id="check-access-btn"
                className="start-btn"
                onClick={handleCheck}
                disabled={status === 'checking'}
              >
                <span className="btn-icon" aria-hidden="true">
                  {status === 'checking' ? '⏳' : '🎓'}
                </span>
                {status === 'checking' ? 'VERIFYING…' : 'CHECK ACCESS'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
