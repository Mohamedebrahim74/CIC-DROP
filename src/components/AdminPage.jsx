import { useState, useEffect, useCallback } from 'react';
import { getAllLeaderboardEntries } from '../services/leaderboard.js';
import { BRANCHES, BRANCH_LABELS } from '../utils/branch.js';

const SESSION_KEY = 'cic_admin_authed';

const TABS = [
  { key: 'all', label: 'ALL BRANCHES' },
  { key: BRANCHES.NEW_CAIRO, label: BRANCH_LABELS[BRANCHES.NEW_CAIRO] },
  { key: BRANCHES.ZAYED, label: BRANCH_LABELS[BRANCHES.ZAYED] },
];

// Admin password comes from an env var set at build/deploy time
// (VITE_ADMIN_PASSWORD). Never hardcode it in source.
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

function AdminLogin({ onAuthed }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ADMIN_PASSWORD) {
      setError('Admin password is not configured on this deployment.');
      return;
    }
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onAuthed();
    } else {
      setError('Incorrect password.');
    }
  };

  return (
    <div className="start-screen">
      <div className="start-content">
        <div className="start-card" style={{ maxWidth: 360, margin: '0 auto' }}>
          <p className="form-heading">🔒 ADMIN LOGIN</p>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="admin-password" className="form-label">Password</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden="true">🔑</span>
                <input
                  id="admin-password"
                  type="password"
                  className={`form-input${error ? ' input-error' : ''}`}
                  placeholder="Enter admin password"
                  value={password}
                  autoComplete="off"
                  autoFocus
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                />
              </div>
              {error && <span className="error-msg" role="alert">{error}</span>}
            </div>
            <button type="submit" id="admin-login-btn" className="start-btn">
              <span className="btn-icon" aria-hidden="true">🔓</span>
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [branch, setBranch] = useState('all');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback((b) => {
    setLoading(true);
    setError('');
    getAllLeaderboardEntries(b).then(({ data, error }) => {
      setEntries(data || []);
      if (error) setError(error);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(branch); }, [branch, load]);

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    onLogout();
  };

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-container">
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">🔒 ADMIN DASHBOARD</h1>
          <p className="leaderboard-subtitle">
            {loading ? 'Loading…' : `${entries.length} submission${entries.length === 1 ? '' : 's'}`}
          </p>
          {error && <div className="leaderboard-notice">⚠️ {error}</div>}
        </div>

        {/* Branch tabs */}
        <div className="leaderboard-actions" style={{ marginBottom: '1rem' }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`overlay-btn ${branch === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setBranch(tab.key)}
              disabled={loading && branch === tab.key}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="leaderboard-table-wrap">
          {loading ? (
            <div className="leaderboard-status">
              <div className="loading-spinner" aria-label="Loading…" />
              <p>Loading scores…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="leaderboard-status">
              <div className="empty-icon">🎓</div>
              <p>No scores submitted yet.</p>
            </div>
          ) : (
            <table className="leaderboard-table" aria-label="All leaderboard results">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">PLAYER</th>
                  <th scope="col">STUDENT ID</th>
                  <th scope="col">SCORE</th>
                  <th scope="col">LVL</th>
                  <th scope="col">BRANCH</th>
                  <th scope="col">DATE</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => (
                  <tr key={entry.id} className="leaderboard-row">
                    <td className="rank-cell">{idx + 1}</td>
                    <td className="player-cell">{entry.player_name}</td>
                    <td className="id-cell">{entry.student_id}</td>
                    <td className="score-cell">{entry.score.toLocaleString()}</td>
                    <td className="level-cell">{entry.level}</td>
                    <td className="level-cell">{entry.branch || '—'}</td>
                    <td className="level-cell">
                      {entry.created_at ? new Date(entry.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="leaderboard-actions">
          <button id="admin-refresh-btn" className="overlay-btn btn-primary" onClick={() => load(branch)}>↻ REFRESH</button>
          <button id="admin-logout-btn" className="overlay-btn btn-ghost" onClick={handleLogout}>🚪 LOGOUT</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');

  return authed
    ? <AdminDashboard onLogout={() => setAuthed(false)} />
    : <AdminLogin onAuthed={() => setAuthed(true)} />;
}
