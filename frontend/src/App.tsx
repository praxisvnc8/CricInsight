import { NavLink, Routes, Route } from "react-router-dom";
import OverviewDashboard from "./components/OverviewDashboard";
import "./App.css";

/* ── Inline placeholder pages ───────────────────────────────────────────── */
function TeamsPlaceholder() {
  return (
    <div className="placeholder-page">
      <span className="placeholder-icon">🏟️</span>
      <h2>Team Analysis</h2>
      <p>Coming Soon</p>
    </div>
  );
}

function PlayersPlaceholder() {
  return (
    <div className="placeholder-page">
      <span className="placeholder-icon">🏏</span>
      <h2>Player Analysis</h2>
      <p>Coming Soon</p>
    </div>
  );
}

function PredictPlaceholder() {
  return (
    <div className="placeholder-page">
      <span className="placeholder-icon">🤖</span>
      <h2>Predictions</h2>
      <p>Coming Soon</p>
    </div>
  );
}

/* ── Nav items ──────────────────────────────────────────────────────────── */
const navItems = [
  { to: "/", label: "Overview", icon: "📊" },
  { to: "/teams", label: "Teams", icon: "🏟️" },
  { to: "/players", label: "Players", icon: "🏏" },
  { to: "/predict", label: "Predictions", icon: "🤖" },
];

/* ── App shell ──────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">🏆</span>
          <span className="brand-text">CricInsight</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link--active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>© 2025 CricInsight</span>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<OverviewDashboard />} />
          <Route path="/teams" element={<TeamsPlaceholder />} />
          <Route path="/players" element={<PlayersPlaceholder />} />
          <Route path="/predict" element={<PredictPlaceholder />} />
        </Routes>
      </main>
    </div>
  );
}
