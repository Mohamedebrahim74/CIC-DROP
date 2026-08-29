import { useState, useEffect, useRef } from 'react';

function FloatingParticle({ delay, duration, x, size, opacity }) {
  return (
    <div
      className="floating-particle"
      style={{ left: `${x}%`, animationDelay: `${delay}s`, animationDuration: `${duration}s`, width: size, height: size, opacity }}
    />
  );
}

export default function StartScreen({ onStart, checking, attemptsError, onClearAttemptsError, prefillName = '', prefillId = '' }) {
  const [name, setName] = useState(prefillName);
  const [studentId, setStudentId] = useState(prefillId);
  const [nameError, setNameError] = useState('');
  const [idError, setIdError] = useState('');
  const [particles] = useState(() =>
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 7 + Math.random() * 9,
      size: `${5 + Math.random() * 16}px`,
      opacity: 0.1 + Math.random() * 0.5,
    }))
  );

  const nameRef = useRef(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const validate = () => {
    let ok = true;
    if (!name.trim()) { setNameError('Please enter your name.'); ok = false; }
    else setNameError('');
    if (!studentId.trim()) { setIdError('Please enter your Student ID.'); ok = false; }
    else if (studentId.trim().length < 4) { setIdError('Student ID must be at least 4 characters.'); ok = false; }
    else setIdError('');
    return ok;
  };

  const handleStart = () => { if (validate() && !checking) onStart(name.trim(), studentId.trim()); };
  const handleKey = (e) => { if (e.key === 'Enter') handleStart(); };
  const handleIdChange = (e) => {
    setStudentId(e.target.value);
    setIdError('');
    onClearAttemptsError?.();
  };

  return (
    <div className="start-screen">
      {/* Floating ambient particles */}
      <div className="particles-bg" aria-hidden="true">
        {particles.map(p => <FloatingParticle key={p.id} {...p} />)}
      </div>

      <div className="start-content">
        {/* Logo */}
        <div className="start-logo-wrap">
          <img
            src="/cic-logo-full.svg"
            alt="Canadian International College"
            className="start-logo"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className="start-logo-fallback" style={{ display: 'none' }}>
            <span className="maple-leaf-big" aria-hidden="true">🍁</span>
            <div>
              <div className="logo-cic-text">CIC</div>
              <div className="logo-full-text">CANADIAN INTERNATIONAL COLLEGE</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="start-title">
          WELCOME TO
          <span className="title-accent">CIC GAME</span>
        </h1>

        <p className="start-subtitle">
          Catch <span className="text-accent">your future.</span> Avoid the obstacles.
        </p>

        {/* Form */}
        <div className="start-card">
          <p className="form-heading">ENTER YOUR DETAILS</p>

          <div className="form-group">
            <label htmlFor="player-name" className="form-label">Name</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">👤</span>
              <input
                ref={nameRef}
                id="player-name"
                type="text"
                className={`form-input${nameError ? ' input-error' : ''}`}
                placeholder="Enter your name"
                value={name}
                maxLength={30}
                autoComplete="off"
                onChange={e => { setName(e.target.value); setNameError(''); }}
                onKeyDown={handleKey}
              />
            </div>
            {nameError && <span className="error-msg" role="alert">{nameError}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="student-id" className="form-label">Student ID</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">🪪</span>
              <input
                id="student-id"
                type="text"
                className={`form-input${idError ? ' input-error' : ''}`}
                placeholder="Enter your ID"
                value={studentId}
                maxLength={20}
                autoComplete="off"
                onChange={handleIdChange}
                onKeyDown={handleKey}
              />
            </div>
            {idError && <span className="error-msg" role="alert">{idError}</span>}
          </div>

          {attemptsError && (
            <p className="error-msg attempts-banner" role="alert">
              🚫 {attemptsError}
            </p>
          )}

          <button
            id="start-game-btn"
            className="start-btn"
            onClick={handleStart}
            disabled={checking}
          >
            <span className="btn-icon" aria-hidden="true">🎓</span>
            {checking ? 'CHECKING…' : 'START GAME'}
          </button>
        </div>

        <p className="start-tagline">THE FUTURE IS YOURS</p>
      </div>
    </div>
  );
}
