import { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/leaderboard.js';
import { getBranchLabel } from '../utils/branch.js';

export default function Leaderboard({ currentPlayerName, currentScore, branch, onHome, onPlayAgain }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLeaderboard(branch || 'all').then(({ data, local }) => {
      if (!alive) return;
      setEntries(data || []);
      setIsLocal(!!local);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [branch]);

  const medal = r => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : r;
  const isMe  = e => e.player_name === currentPlayerName && e.score === currentScore;
  const branchLabel = branch ? getBranchLabel(branch) : '';

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-container">

        {/* Header */}
        <div className="leaderboard-header">
          <img src="/cic-logo-full.svg" alt="CIC" className="leaderboard-logo"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
            onError={e => e.target.style.display = 'none'} />
          <h1 className="leaderboard-title">
            🏆 {branchLabel ? `${branchLabel} LEADERBOARD` : 'CIC LEADERBOARD'}
          </h1>
          <p className="leaderboard-subtitle">Top players — compete for the crown!</p>
          {isLocal && (
            <div className="leaderboard-notice">⚠️ Showing local data — connect to see global rankings</div>
          )}
        </div>

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
              <p>No scores yet — be the first!</p>
            </div>
          ) : (
            <table className="leaderboard-table" aria-label="CIC Game Leaderboard">
              <thead>
                <tr>
                  <th scope="col">RANK</th>
                  <th scope="col">PLAYER</th>
                  <th scope="col">ID</th>
                  <th scope="col">SCORE</th>
                  <th scope="col">LVL</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.id || entry.rank}
                    className={`leaderboard-row${entry.rank <= 3 ? ' top-row' : ''}${isMe(entry) ? ' my-row' : ''}`}
                    aria-current={isMe(entry) ? 'true' : undefined}>
                    <td className="rank-cell"><span className="rank-badge">{medal(entry.rank)}</span></td>
                    <td className="player-cell">{entry.player_name}</td>
                    <td className="id-cell">{entry.student_id}</td>
                    <td className="score-cell">{entry.score.toLocaleString()}</td>
                    <td className="level-cell">{entry.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Actions */}
        <div className="leaderboard-actions">
          <button id="lb-play-again-btn" className="overlay-btn btn-primary" onClick={onPlayAgain}>↺ PLAY AGAIN</button>
          <button id="lb-home-btn"       className="overlay-btn btn-ghost"   onClick={onHome}>🏠 HOME</button>
        </div>

        <p className="leaderboard-footer">
          PLAY · COMPETE · <span className="text-accent">BE THE BEST</span>
        </p>
      </div>
    </div>
  );
}
