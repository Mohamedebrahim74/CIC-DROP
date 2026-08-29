import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllLeaderboardEntries } from '../services/leaderboard.js';
import {
  getAllowedPlayers, addPlayer,
  setPlayerAllowed, deletePlayer,
  bulkImportPlayers,
} from '../services/accessControl.js';
import { BRANCHES, BRANCH_LABELS } from '../utils/branch.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const SESSION_KEY   = 'cic_admin_authed';
const PAGE_SIZE     = 10;

const BRANCH_TABS = [
  { key: 'all',              label: 'ALL BRANCHES' },
  { key: BRANCHES.NEW_CAIRO, label: BRANCH_LABELS[BRANCHES.NEW_CAIRO] },
  { key: BRANCHES.ZAYED,     label: BRANCH_LABELS[BRANCHES.ZAYED] },
];

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

// ─────────────────────────────────────────────────────────────────────────────
// AdminLogin — unchanged from original
// ─────────────────────────────────────────────────────────────────────────────
function AdminLogin({ onAuthed }) {
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

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

// ─────────────────────────────────────────────────────────────────────────────
// LeaderboardTab — original AdminDashboard leaderboard content
// ─────────────────────────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [branch,  setBranch]  = useState('all');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [page,    setPage]    = useState(1);

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
  useEffect(() => { setPage(1); }, [branch, entries.length]);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const pageEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, page]);

  return (
    <>
      {/* Branch filter tabs */}
      <div className="leaderboard-actions" style={{ marginBottom: '1rem' }}>
        {BRANCH_TABS.map(tab => (
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

      {/* Subtitle */}
      <p className="leaderboard-subtitle" style={{ marginBottom: '0.5rem' }}>
        {loading ? 'Loading…' : `${entries.length} submission${entries.length === 1 ? '' : 's'}`}
      </p>
      {error && <div className="leaderboard-notice">⚠️ {error}</div>}

      {/* Table */}
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
          <>
            <table className="leaderboard-table" aria-label="Leaderboard results">
              <thead>
                <tr>
                  <th scope="col">PLAYER</th>
                  <th scope="col">SCORE</th>
                  <th scope="col">STUDENT ID</th>
                </tr>
              </thead>
              <tbody>
                {pageEntries.map((entry) => (
                  <tr key={entry.id} className="leaderboard-row">
                    <td className="player-cell">{entry.player_name}</td>
                    <td className="score-cell">{entry.score.toLocaleString()}</td>
                    <td className="id-cell">{entry.student_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="leaderboard-actions" style={{ marginTop: '1rem', justifyContent: 'center', gap: '1rem' }}>
                <button className="overlay-btn btn-ghost" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← PREV</button>
                <span style={{ alignSelf: 'center' }}>Page {page} of {totalPages}</span>
                <button className="overlay-btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>NEXT →</button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="leaderboard-actions" style={{ marginTop: '1rem' }}>
        <button id="admin-refresh-btn" className="overlay-btn btn-primary" onClick={() => load(branch)}>↻ REFRESH</button>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlayerAccessTab — add / enable / disable / delete students
// ─────────────────────────────────────────────────────────────────────────────
function PlayerAccessTab() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');

  // Add-player form
  const [addName,  setAddName]  = useState('');
  const [addId,    setAddId]    = useState('');
  const [addError, setAddError] = useState('');
  const [addOk,    setAddOk]    = useState('');
  const [adding,   setAdding]   = useState(false);

  // Bulk import
  const [bulkText,    setBulkText]    = useState('');
  const [bulkPreview, setBulkPreview] = useState(null); // null | { valid, invalid }
  const [bulkStatus,  setBulkStatus]  = useState('');
  const [importing,   setImporting]   = useState(false);

  // ── Load ────────────────────────────────────────────────────────
  const load = useCallback(() => {
    setLoading(true);
    setError('');
    getAllowedPlayers().then(({ data, error }) => {
      setPlayers(data || []);
      if (error) setError(error);
      setLoading(false);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Filtered list ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.student_id.toLowerCase().includes(q)
    );
  }, [players, search]);

  // ── Toggle allowed ───────────────────────────────────────────────
  const handleToggle = async (player) => {
    const res = await setPlayerAllowed(player.id, !player.allowed);
    if (res.error) {
      setError(res.error);
    } else {
      // Optimistic update
      setPlayers(prev => prev.map(p =>
        p.id === player.id ? { ...p, allowed: !player.allowed } : p
      ));
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const handleDelete = async (player) => {
    if (!window.confirm(`Delete "${player.name}" (${player.student_id})?`)) return;
    const res = await deletePlayer(player.id);
    if (res.error) {
      setError(res.error);
    } else {
      setPlayers(prev => prev.filter(p => p.id !== player.id));
    }
  };

  // ── Add player ───────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddOk('');
    if (!addName.trim())  { setAddError('Name is required.');       return; }
    if (!addId.trim())    { setAddError('Student ID is required.');  return; }
    setAdding(true);
    const res = await addPlayer(addName, addId);
    setAdding(false);
    if (res.error) {
      if (res.error.includes('23505') || res.error.toLowerCase().includes('unique') || res.error.toLowerCase().includes('duplicate')) {
        setAddError(`Student ID "${addId.trim()}" is already in the list.`);
      } else {
        setAddError(res.error);
      }
    } else {
      setAddOk(`✓ ${addName.trim()} added.`);
      setAddName('');
      setAddId('');
      load();
    }
  };

  // ── Bulk preview ─────────────────────────────────────────────────
  const handleBulkPreview = () => {
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    const valid   = [];
    const invalid = [];

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const id   = parts.slice(1).join(',').trim();
        if (name && id) {
          valid.push({ name, student_id: id });
        } else {
          invalid.push(line);
        }
      } else {
        invalid.push(line);
      }
    }

    setBulkPreview({ valid, invalid });
    setBulkStatus('');
  };

  // ── Bulk import ──────────────────────────────────────────────────
  const handleBulkImport = async () => {
    if (!bulkPreview?.valid?.length) return;
    setImporting(true);
    setBulkStatus('');
    const res = await bulkImportPlayers(bulkPreview.valid);
    setImporting(false);
    if (res.error) {
      setBulkStatus(`Error: ${res.error}`);
    } else {
      setBulkStatus(`✓ Imported ${res.inserted} student${res.inserted !== 1 ? 's' : ''}. ${res.skipped} skipped (duplicate ID).`);
      setBulkText('');
      setBulkPreview(null);
      load();
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <>
      {/* ── Search ── */}
      <div className="admin-search-wrap">
        <div className="input-wrap" style={{ maxWidth: 360 }}>
          <span className="input-icon" aria-hidden="true">🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or student ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="leaderboard-notice" style={{ marginBottom: '0.75rem' }}>⚠️ {error}</div>}

      {/* ── Player table ── */}
      <div className="leaderboard-table-wrap" style={{ marginBottom: '1.5rem' }}>
        {loading ? (
          <div className="leaderboard-status">
            <div className="loading-spinner" aria-label="Loading…" />
            <p>Loading players…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="leaderboard-status">
            <div className="empty-icon">👥</div>
            <p>{search ? 'No results for that search.' : 'No students added yet.'}</p>
          </div>
        ) : (
          <table className="leaderboard-table" aria-label="Allowed players">
            <thead>
              <tr>
                <th scope="col">NAME</th>
                <th scope="col">STUDENT ID</th>
                <th scope="col" style={{ textAlign: 'center' }}>ACCESS</th>
                <th scope="col" style={{ textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(player => (
                <tr key={player.id} className="leaderboard-row">
                  <td className="player-cell">{player.name}</td>
                  <td className="id-cell" style={{ fontFamily: 'monospace' }}>{player.student_id}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className={player.allowed ? 'access-badge access-on' : 'access-badge access-off'}>
                      {player.allowed ? 'ON' : 'OFF'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        className={`admin-action-btn ${player.allowed ? 'btn-disable' : 'btn-enable'}`}
                        onClick={() => handleToggle(player)}
                        title={player.allowed ? 'Disable access' : 'Enable access'}
                      >
                        {player.allowed ? 'DISABLE' : 'ENABLE'}
                      </button>
                      <button
                        className="admin-action-btn btn-delete"
                        onClick={() => handleDelete(player)}
                        title="Delete student"
                      >
                        DELETE
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Refresh ── */}
      <div className="leaderboard-actions" style={{ marginBottom: '2rem' }}>
        <button className="overlay-btn btn-primary" onClick={load}>↻ REFRESH</button>
      </div>

      {/* ── Add single player ── */}
      <div className="admin-section-card">
        <p className="form-heading" style={{ marginBottom: '1rem' }}>➕ ADD PLAYER</p>
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">👤</span>
              <input
                type="text"
                className="form-input"
                placeholder="Full name"
                value={addName}
                maxLength={60}
                onChange={e => { setAddName(e.target.value); setAddError(''); setAddOk(''); }}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Student ID</label>
            <div className="input-wrap">
              <span className="input-icon" aria-hidden="true">🪪</span>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 202201234"
                value={addId}
                maxLength={30}
                onChange={e => { setAddId(e.target.value); setAddError(''); setAddOk(''); }}
              />
            </div>
          </div>
          {addError && <p className="error-msg" role="alert" style={{ marginBottom: 8 }}>⚠️ {addError}</p>}
          {addOk    && <p style={{ color: '#4ade80', fontSize: 13, marginBottom: 8 }}>{addOk}</p>}
          <button type="submit" className="overlay-btn btn-primary" disabled={adding}>
            {adding ? 'ADDING…' : '+ ADD PLAYER'}
          </button>
        </form>
      </div>

      {/* ── Bulk import ── */}
      <div className="admin-section-card" style={{ marginTop: '1.5rem' }}>
        <p className="form-heading" style={{ marginBottom: '0.5rem' }}>📋 BULK IMPORT</p>
        <p style={{ fontSize: 12, color: 'var(--white-50)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
          Paste one student per line in the format:<br />
          <code style={{ color: 'var(--gold)' }}>Full Name,StudentID</code>
        </p>
        <textarea
          className="form-input bulk-textarea"
          placeholder={"Mohamed Ibrahim,202201234\nAhmed Ali,202201567\nSara Mohamed,202201999"}
          value={bulkText}
          onChange={e => { setBulkText(e.target.value); setBulkPreview(null); setBulkStatus(''); }}
          rows={5}
        />

        <button
          className="overlay-btn btn-ghost"
          style={{ marginTop: '0.75rem' }}
          onClick={handleBulkPreview}
          disabled={!bulkText.trim()}
        >
          👁 PREVIEW
        </button>

        {/* Preview table */}
        {bulkPreview && (
          <div style={{ marginTop: '1rem' }}>
            {bulkPreview.valid.length > 0 && (
              <>
                <p style={{ fontSize: 12, color: '#4ade80', marginBottom: 6 }}>
                  ✓ {bulkPreview.valid.length} valid record{bulkPreview.valid.length !== 1 ? 's' : ''}
                </p>
                <div className="leaderboard-table-wrap" style={{ marginBottom: '0.75rem', maxHeight: 180, overflowY: 'auto' }}>
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th scope="col">NAME</th>
                        <th scope="col">STUDENT ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkPreview.valid.map((r, i) => (
                        <tr key={i} className="leaderboard-row">
                          <td className="player-cell">{r.name}</td>
                          <td className="id-cell">{r.student_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {bulkPreview.invalid.length > 0 && (
              <p style={{ fontSize: 12, color: '#f87171', marginBottom: '0.75rem' }}>
                ✗ {bulkPreview.invalid.length} invalid line{bulkPreview.invalid.length !== 1 ? 's' : ''} (skipped)
              </p>
            )}

            {bulkPreview.valid.length > 0 && (
              <button
                className="overlay-btn btn-primary"
                onClick={handleBulkImport}
                disabled={importing}
              >
                {importing ? 'IMPORTING…' : `IMPORT ${bulkPreview.valid.length} STUDENTS`}
              </button>
            )}
          </div>
        )}

        {bulkStatus && (
          <p style={{
            marginTop: '0.75rem', fontSize: 13, lineHeight: 1.5,
            color: bulkStatus.startsWith('✓') ? '#4ade80' : '#f87171',
          }}>
            {bulkStatus}
          </p>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminDashboard — tabbed (Leaderboard + Player Access)
// ─────────────────────────────────────────────────────────────────────────────
const MAIN_TABS = [
  { key: 'leaderboard', label: '🏆 LEADERBOARD' },
  { key: 'players',     label: '👥 PLAYER ACCESS' },
];

function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('leaderboard');

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-container">

        {/* Header */}
        <div className="leaderboard-header">
          <h1 className="leaderboard-title">🔒 ADMIN DASHBOARD</h1>
        </div>

        {/* Main tab switcher */}
        <div className="leaderboard-actions" style={{ marginBottom: '1.5rem' }}>
          {MAIN_TABS.map(tab => (
            <button
              key={tab.key}
              className={`overlay-btn ${activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'leaderboard' && <LeaderboardTab />}
        {activeTab === 'players'     && <PlayerAccessTab />}

        {/* Logout */}
        <div className="leaderboard-actions" style={{ marginTop: '2rem' }}>
          <button
            id="admin-logout-btn"
            className="overlay-btn btn-ghost"
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); onLogout(); }}
          >
            🚪 LOGOUT
          </button>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminPage — entry point (login gate)
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  );

  return authed
    ? <AdminDashboard onLogout={() => setAuthed(false)} />
    : <AdminLogin onAuthed={() => setAuthed(true)} />;
}
