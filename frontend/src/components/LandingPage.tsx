import { useNavigate } from "react-router-dom";
import "./LandingPage.css";

const features = [
  {
    icon: "🤖",
    title: "ML Match Predictor",
    desc: "Real-time win probabilities powered by ensemble machine learning models trained on every IPL ball.",
  },
  {
    icon: "📊",
    title: "Deep Player Analytics",
    desc: "Granular batting, bowling & fielding breakdowns with head-to-head matchup intelligence.",
  },
  {
    icon: "🏆",
    title: "Historical Hall of Fame",
    desc: "Explore 16 seasons of champions, record-breakers, and milestone moments in stunning detail.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Animated background layers ──────────────────────────────── */}
      <div className="landing__grid" />
      <div className="landing__orb landing__orb--1" />
      <div className="landing__orb landing__orb--2" />
      <div className="landing__orb landing__orb--3" />
      <div className="landing__vignette" />

      {/* ── Floating particles ──────────────────────────────────────── */}
      <div className="landing__particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="landing__particle" style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }} />
        ))}
      </div>

      {/* ── Hero content ───────────────────────────────────────────── */}
      <div className="landing__content">
        <div className="landing__badge">
          <span className="landing__badge-dot" />
          IPL Analytics Platform
        </div>

        <h1 className="landing__headline">
          <span className="landing__headline-line">CricInsight:</span>
          <span className="landing__headline-accent">The Future of IPL Analytics</span>
        </h1>

        <p className="landing__subheadline">
          Powered by Machine Learning. Backed by 16 years of historical data.
        </p>

        <button
          id="launch-dashboard-btn"
          className="landing__cta"
          onClick={() => navigate("/overview")}
        >
          <span className="landing__cta-text">Launch Dashboard</span>
          <span className="landing__cta-arrow">→</span>
          <span className="landing__cta-glow" />
        </button>

        {/* ── Feature cards ──────────────────────────────────────── */}
        <div className="landing__features">
          {features.map((f) => (
            <div key={f.title} className="landing__card">
              <div className="landing__card-icon">{f.icon}</div>
              <h3 className="landing__card-title">{f.title}</h3>
              <p className="landing__card-desc">{f.desc}</p>
              <div className="landing__card-shine" />
            </div>
          ))}
        </div>

        <p className="landing__footer-note">
          © 2025 CricInsight &nbsp;·&nbsp; Built for cricket lovers, by cricket lovers.
        </p>
      </div>
    </div>
  );
}
