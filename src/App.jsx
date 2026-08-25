import AdminPage from './components/AdminPage.jsx';
import './App.css';

// Game submissions are closed. The public app now only shows a closing
// message; the previous start/play flow (name+ID entry, gameplay,
// leaderboard) has been disabled and is no longer reachable. Result data
// is still viewable by an admin at /admin (password-protected).
export default function App() {
  const isAdminRoute = window.location.pathname.replace(/\/+$/, '') === '/admin';

  if (isAdminRoute) {
    return <AdminPage />;
  }

  return (
    <div className="start-screen">
      <div className="start-content">
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

        <h1 className="start-title">
          SEE YOU IN
          <span className="title-accent">CONVOCATION 🎓</span>
        </h1>
      </div>
    </div>
  );
}
