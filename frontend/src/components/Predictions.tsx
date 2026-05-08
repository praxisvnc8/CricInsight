import { useState } from "react";
import {
  predictMatchWinner,
  predictInningsScore,
  predictPlayerPerformance,
  fetchPlayerStats,
} from "../services/api";
import { getTeamLogo, getPlayerAvatar } from "../utils/teamLogos";

/* ── Constants ───────────────────────────────────────────────────────────── */
const TEAMS = [
  "Chennai Super Kings", "Delhi Capitals", "Gujarat Titans", "Kolkata Knight Riders",
  "Lucknow Super Giants", "Mumbai Indians", "Punjab Kings",
  "Rajasthan Royals", "Royal Challengers Bengaluru", "Sunrisers Hyderabad",
];
const CITIES = [
  "Mumbai", "Chennai", "Kolkata", "Delhi", "Bengaluru",
  "Hyderabad", "Jaipur", "Ahmedabad", "Chandigarh", "Lucknow",
];

/* ── Types ───────────────────────────────────────────────────────────────── */
interface WinnerResult { predicted_winner: string; team1: string; team2: string; team1_prob: number; team2_prob: number; }
interface ScoreResult { predicted_score: number; score_low: number; score_high: number; batting_team: string; bowling_team: string; }
interface PerfResult { label: string; thresholds: { poor_below: number; good_above: number }; input_stats: Record<string, number>; }
type TabId = "winner" | "score" | "player";

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  .pr-wrapper {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a0e1a 0%, #111827 40%, #0f172a 100%);
    padding: 2.5rem 2rem;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
    display: flex; flex-direction: column; align-items: center;
  }
  .pr-heading {
    font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .pr-subtitle { text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 2rem; }

  /* Tabs */
  .pr-tab-row {
    display: flex; gap: 0.4rem; margin-bottom: 2rem;
    background: rgba(255,255,255,0.03); border-radius: 14px;
    padding: 0.35rem; border: 1px solid rgba(255,255,255,0.05);
  }
  .pr-tab {
    padding: 0.65rem 1.4rem; border-radius: 10px; border: none;
    background: transparent; color: #64748b; font-weight: 600; font-size: 0.88rem;
    cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; white-space: nowrap;
  }
  .pr-tab--active {
    background: rgba(0,198,255,0.1); color: #fff;
    border: 1px solid rgba(0,198,255,0.2); box-shadow: 0 0 16px rgba(0,114,255,0.08);
  }

  /* Form card */
  .pr-form-card {
    width: 100%; max-width: 560px;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
    padding: 2rem 2rem 2.25rem; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .pr-form-title { font-size: 1.1rem; font-weight: 600; color: #94a3b8; margin-bottom: 1.5rem; text-align: center; }
  .pr-field-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.5rem;
  }
  .pr-field-group { display: flex; flex-direction: column; gap: 0.35rem; }
  .pr-field-full { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 0.35rem; }
  .pr-label {
    font-size: 0.75rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1px;
  }
  .pr-select-wrapper {
    display: flex; align-items: center; gap: 0.6rem;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 0.4rem 0.6rem; transition: border-color 0.2s;
  }
  .pr-select-wrapper:focus-within { border-color: rgba(0,198,255,0.3); }
  .pr-team-logo-xs { width: 26px; height: 26px; object-fit: contain; flex-shrink: 0; }
  .pr-select {
    flex: 1; background: transparent; border: none; color: #e2e8f0;
    font-size: 0.9rem; font-family: 'Inter', sans-serif; outline: none; cursor: pointer;
  }
  .pr-select option { background: #1e293b; color: #e2e8f0; }
  .pr-input {
    padding: 0.7rem 1rem; border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
    color: #e2e8f0; font-size: 0.92rem; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .pr-input:focus { border-color: rgba(0,198,255,0.3); }
  .pr-submit-btn {
    width: 100%; padding: 0.85rem; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer;
    letter-spacing: 0.5px; font-family: 'Inter', sans-serif;
    transition: opacity 0.2s, transform 0.15s;
  }
  .pr-submit-btn:disabled { opacity: 0.6; pointer-events: none; }
  .pr-validation { text-align: center; font-size: 0.85rem; color: #f87171; margin-bottom: 0.75rem; }

  /* Result card */
  .pr-result-card {
    width: 100%; max-width: 560px; margin-top: 2rem;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
    padding: 2rem; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .pr-result-label {
    font-size: 0.78rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.75rem;
  }

  /* Winner result */
  .pr-winner-banner {
    display: flex; align-items: center; justify-content: center;
    gap: 1rem; margin-bottom: 1.5rem;
  }
  .pr-winner-logo { width: 52px; height: 52px; object-fit: contain; }
  .pr-winner-name {
    font-size: 1.5rem; font-weight: 800;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .pr-prob-row { margin-bottom: 0.85rem; }
  .pr-prob-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 0.35rem; font-size: 0.85rem; font-weight: 500;
  }
  .pr-prob-team {
    display: flex; align-items: center; gap: 0.5rem;
  }
  .pr-prob-logo { width: 22px; height: 22px; object-fit: contain; }
  .pr-prob-track {
    height: 10px; border-radius: 5px; background: rgba(255,255,255,0.06); overflow: hidden;
  }
  .pr-prob-fill { height: 100%; border-radius: 5px; transition: width 0.8s ease; }

  /* Score result */
  .pr-score-value {
    font-size: 3.5rem; font-weight: 800; line-height: 1;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 0.4rem;
  }
  .pr-score-range { font-size: 0.95rem; color: #64748b; margin-bottom: 0.5rem; }
  .pr-score-teams {
    display: flex; align-items: center; justify-content: center; gap: 0.5rem;
    font-size: 0.85rem; color: #64748b;
  }
  .pr-score-logo { width: 24px; height: 24px; object-fit: contain; }

  /* Player perf result */
  .pr-perf-avatar {
    width: 72px; height: 72px; border-radius: 50%;
    border: 3px solid rgba(0,198,255,0.3); margin: 0 auto 0.75rem;
    box-shadow: 0 0 20px rgba(0,198,255,0.12);
  }
  .pr-perf-badge {
    display: inline-block; padding: 0.6rem 2rem; border-radius: 30px;
    font-size: 1.1rem; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; margin-bottom: 1rem;
  }
  .pr-perf-badge--good { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399; }
  .pr-perf-badge--average { background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
  .pr-perf-badge--poor { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #f87171; }
  .pr-perf-stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem; margin-top: 1rem;
  }
  .pr-perf-stat-val { font-size: 1.15rem; font-weight: 700; color: #e2e8f0; }
  .pr-perf-stat-lbl {
    font-size: 0.65rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.8px; margin-top: 0.15rem;
  }

  /* Error */
  .pr-error-msg {
    width: 100%; max-width: 560px; margin-top: 1.5rem;
    text-align: center; color: #f87171; font-size: 0.95rem;
  }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Predictions() {
  const [activeTab, setActiveTab] = useState<TabId>("winner");

  /* Tab 1 – Match Winner */
  const [w_team1, w_setTeam1] = useState(TEAMS[5]);
  const [w_team2, w_setTeam2] = useState(TEAMS[0]);
  const [w_city, w_setCity] = useState(CITIES[0]);
  const [w_toss, w_setToss] = useState(TEAMS[5]);
  const [w_decision, w_setDecision] = useState("bat");
  const [w_loading, w_setLoading] = useState(false);
  const [w_result, w_setResult] = useState<WinnerResult | null>(null);
  const [w_error, w_setError] = useState<string | null>(null);
  const [w_validation, w_setValidation] = useState<string | null>(null);

  /* Tab 2 – Innings Score */
  const [sc_bat, sc_setBat] = useState(TEAMS[5]);
  const [sc_bowl, sc_setBowl] = useState(TEAMS[0]);
  const [sc_city, sc_setCity] = useState(CITIES[0]);
  const [sc_season, sc_setSeason] = useState(2024);
  const [sc_toss, sc_setToss] = useState(TEAMS[5]);
  const [sc_decision, sc_setDecision] = useState("bat");
  const [sc_loading, sc_setLoading] = useState(false);
  const [sc_result, sc_setResult] = useState<ScoreResult | null>(null);
  const [sc_error, sc_setError] = useState<string | null>(null);
  const [sc_validation, sc_setValidation] = useState<string | null>(null);

  /* Tab 3 – Player Classifier */
  const [pl_name, pl_setName] = useState("");
  const [pl_loading, pl_setLoading] = useState(false);
  const [pl_result, pl_setResult] = useState<PerfResult | null>(null);
  const [pl_error, pl_setError] = useState<string | null>(null);
  const [pl_playerName, pl_setPlayerName] = useState("");

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleWinner = () => {
    if (w_team1 === w_team2) { w_setValidation("Team 1 and Team 2 must be different."); return; }
    if (w_toss !== w_team1 && w_toss !== w_team2) { w_setValidation("Toss Winner must be either Team 1 or Team 2."); return; }
    w_setValidation(null); w_setLoading(true); w_setError(null); w_setResult(null);
    predictMatchWinner({ team1: w_team1, team2: w_team2, city: w_city, toss_winner: w_toss, toss_decision: w_decision })
      .then((d: WinnerResult) => w_setResult(d))
      .catch(() => w_setError("Prediction failed. Please check the backend."))
      .finally(() => w_setLoading(false));
  };

  const handleScore = () => {
    if (sc_bat === sc_bowl) { sc_setValidation("Batting and Bowling teams must be different."); return; }
    if (sc_toss !== sc_bat && sc_toss !== sc_bowl) { sc_setValidation("Toss Winner must be either team."); return; }
    sc_setValidation(null); sc_setLoading(true); sc_setError(null); sc_setResult(null);
    predictInningsScore({ batting_team: sc_bat, bowling_team: sc_bowl, city: sc_city, season: sc_season, toss_winner: sc_toss, toss_decision: sc_decision })
      .then((d: ScoreResult) => sc_setResult(d))
      .catch(() => sc_setError("Score prediction failed."))
      .finally(() => sc_setLoading(false));
  };

const handlePlayer = async () => {
  const name = pl_name.trim();
  if (!name) return;

  pl_setLoading(true);
  pl_setError(null);
  pl_setResult(null);

  try {
    const stats = await fetchPlayerStats(name);
    pl_setPlayerName(name);

    // --- 1. Batting Data & Derivations ---
    const total_runs = stats.total_runs ?? 0;
    const innings = stats.total_innings ?? 0;
    const balls_faced = stats.total_balls_faced ?? 0;
    const fours = stats.total_fours ?? 0;
    const sixes = stats.total_sixes ?? 0;

    const strike_rate =
      balls_faced > 0
        ? parseFloat(((total_runs / balls_faced) * 100).toFixed(2))
        : 0;

    const batting_avg =
      innings > 0 
        ? parseFloat((total_runs / innings).toFixed(2)) 
        : 0;

    // --- 2. Bowling Data & Derivations ---
    const wickets = stats.total_wickets ?? 0;
    const runs_conceded = stats.total_runs_conceded ?? 0;
    const balls_bowled = stats.total_balls_bowled ?? 0;

    const economy =
      balls_bowled > 0
        ? parseFloat(((runs_conceded / balls_bowled) * 6).toFixed(2))
        : 0;

    const bowling_avg =
      wickets > 0 
        ? parseFloat((runs_conceded / wickets).toFixed(2)) 
        : 0;

    // --- 3. Combined Prediction Call ---
    const perf: PerfResult = await predictPlayerPerformance({
      // Batting inputs
      innings,
      balls_faced,
      total_runs,
      strike_rate,
      batting_avg,
      fours,
      sixes,
      // Bowling inputs
      wickets,
      economy,
      bowling_avg,
    });

    pl_setResult(perf);
  } catch (err: any) {
    if (err?.response?.status === 404) {
      pl_setError(`Player "${name}" not found. Try "V Kohli", "JJ Bumrah", etc.`);
    } else {
      pl_setError("Classification failed. Please try again.");
    }
  } finally {
    pl_setLoading(false);
  }
};

  /* ── Render helpers ───────────────────────────────────────────────────── */
  const renderTeamSelect = (label: string, value: string, onChange: (v: string) => void, options: string[], full = false) => (
    <div className={full ? "pr-field-full" : "pr-field-group"}>
      <label className="pr-label">{label}</label>
      <div className="pr-select-wrapper">
        <img className="pr-team-logo-xs" src={getTeamLogo(value)} alt="" />
        <select className="pr-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );

  const renderPlainSelect = (label: string, value: string, onChange: (v: string) => void, options: string[], full = false) => (
    <div className={full ? "pr-field-full" : "pr-field-group"}>
      <label className="pr-label">{label}</label>
      <div className="pr-select-wrapper">
        <select className="pr-select" value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );

  /* ── TAB 1 ────────────────────────────────────────────────────────────── */
  const renderWinnerTab = () => (
    <>
      <div className="pr-form-card">
        <h2 className="pr-form-title">🏆 Match Winner Predictor</h2>
        <div className="pr-field-grid">
          {renderTeamSelect("Team 1", w_team1, (v) => { w_setTeam1(v); if (w_toss !== v && w_toss !== w_team2) w_setToss(v); }, TEAMS)}
          {renderTeamSelect("Team 2", w_team2, (v) => { w_setTeam2(v); if (w_toss !== w_team1 && w_toss !== v) w_setToss(v); }, TEAMS)}
          {renderPlainSelect("Venue (City)", w_city, w_setCity, CITIES)}
          {renderTeamSelect("Toss Winner", w_toss, w_setToss, [w_team1, w_team2])}
          {renderPlainSelect("Toss Decision", w_decision, w_setDecision, ["bat", "field"], true)}
        </div>
        {w_validation && <p className="pr-validation">⚠️ {w_validation}</p>}
        <button className="pr-submit-btn" disabled={w_loading} onClick={handleWinner}>
          {w_loading ? "⏳ Predicting…" : "🏆 Predict Winner"}
        </button>
      </div>
      {w_error && <p className="pr-error-msg">❌ {w_error}</p>}
      {w_result && (
        <div className="pr-result-card">
          <p className="pr-result-label">Predicted Winner</p>
          <div className="pr-winner-banner">
            <img className="pr-winner-logo" src={getTeamLogo(w_result.predicted_winner)} alt="" />
            <h3 className="pr-winner-name">{w_result.predicted_winner}</h3>
          </div>
          <div className="pr-prob-row">
            <div className="pr-prob-header">
              <span className="pr-prob-team"><img className="pr-prob-logo" src={getTeamLogo(w_result.team1)} alt="" />{w_result.team1}</span>
              <span style={{ color: "#00c6ff", fontWeight: 700 }}>{w_result.team1_prob}%</span>
            </div>
            <div className="pr-prob-track"><div className="pr-prob-fill" style={{ width: `${w_result.team1_prob}%`, background: "linear-gradient(90deg, #00c6ff, #0072ff)" }} /></div>
          </div>
          <div className="pr-prob-row">
            <div className="pr-prob-header">
              <span className="pr-prob-team"><img className="pr-prob-logo" src={getTeamLogo(w_result.team2)} alt="" />{w_result.team2}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{w_result.team2_prob}%</span>
            </div>
            <div className="pr-prob-track"><div className="pr-prob-fill" style={{ width: `${w_result.team2_prob}%`, background: "linear-gradient(90deg, #f59e0b, #ef4444)" }} /></div>
          </div>
        </div>
      )}
    </>
  );

  /* ── TAB 2 ────────────────────────────────────────────────────────────── */
  const renderScoreTab = () => (
    <>
      <div className="pr-form-card">
        <h2 className="pr-form-title">🏏 First Innings Score Predictor</h2>
        <div className="pr-field-grid">
          {renderTeamSelect("Batting Team", sc_bat, (v) => { sc_setBat(v); if (sc_toss !== v && sc_toss !== sc_bowl) sc_setToss(v); }, TEAMS)}
          {renderTeamSelect("Bowling Team", sc_bowl, (v) => { sc_setBowl(v); if (sc_toss !== sc_bat && sc_toss !== v) sc_setToss(v); }, TEAMS)}
          {renderPlainSelect("Venue (City)", sc_city, sc_setCity, CITIES)}
          <div className="pr-field-group">
            <label className="pr-label">Season</label>
            <div className="pr-select-wrapper">
              <select className="pr-select" value={sc_season} onChange={(e) => sc_setSeason(Number(e.target.value))}>
                {Array.from({ length: 17 }, (_, i) => 2008 + i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          {renderTeamSelect("Toss Winner", sc_toss, sc_setToss, [sc_bat, sc_bowl])}
          {renderPlainSelect("Toss Decision", sc_decision, sc_setDecision, ["bat", "field"], true)}
        </div>
        {sc_validation && <p className="pr-validation">⚠️ {sc_validation}</p>}
        <button className="pr-submit-btn" disabled={sc_loading} onClick={handleScore}>
          {sc_loading ? "⏳ Predicting…" : "🏏 Predict Score"}
        </button>
      </div>
      {sc_error && <p className="pr-error-msg">❌ {sc_error}</p>}
      {sc_result && (
        <div className="pr-result-card">
          <p className="pr-result-label">Predicted First Innings Score</p>
          <h3 className="pr-score-value">{sc_result.predicted_score}</h3>
          <p className="pr-score-range">Likely range: {sc_result.score_low} – {sc_result.score_high}</p>
          <div className="pr-score-teams">
            <img className="pr-score-logo" src={getTeamLogo(sc_result.batting_team)} alt="" />
            <span>{sc_result.batting_team}</span>
            <span style={{ color: "#475569" }}>vs</span>
            <img className="pr-score-logo" src={getTeamLogo(sc_result.bowling_team)} alt="" />
            <span>{sc_result.bowling_team}</span>
          </div>
        </div>
      )}
    </>
  );

  /* ── TAB 3 ────────────────────────────────────────────────────────────── */
  const renderPlayerTab = () => {
    const badgeCls = pl_result
      ? pl_result.label === "Good" ? "pr-perf-badge--good"
        : pl_result.label === "Average" ? "pr-perf-badge--average"
        : "pr-perf-badge--poor"
      : "";

    return (
      <>
        <div className="pr-form-card">
          <h2 className="pr-form-title">🧠 Player Performance Classifier</h2>
          <div className="pr-field-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="pr-field-full">
              <label className="pr-label">Player Name</label>
              <input
                className="pr-input"
                type="text"
                placeholder='e.g. "V Kohli", "MS Dhoni", "JJ Bumrah"'
                value={pl_name}
                onChange={(e) => pl_setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlayer()}
              />
            </div>
          </div>
          <button className="pr-submit-btn" disabled={pl_loading} onClick={handlePlayer}>
            {pl_loading ? "⏳ Analysing…" : "🧠 Classify Performance"}
          </button>
        </div>
        {pl_error && <p className="pr-error-msg">⚠️ {pl_error}</p>}
        {pl_result && (
          <div className="pr-result-card">
            <img className="pr-perf-avatar" src={getPlayerAvatar(pl_playerName)} alt={pl_playerName} />
            <p className="pr-result-label">Career Performance Rating</p>
            <div>
              <span className={`pr-perf-badge ${badgeCls}`}>
                {pl_result.label === "Good" && "🥇 "}
                {pl_result.label === "Average" && "🥈 "}
                {pl_result.label === "Poor" && "🥉 "}
                {pl_result.label}
              </span>
            </div>
            <div className="pr-perf-stats">
              {Object.entries(pl_result.input_stats).map(([key, val]) => (
                <div key={key}>
                  <div className="pr-perf-stat-val">{typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}</div>
                  <div className="pr-perf-stat-lbl">{key.replace(/_/g, " ")}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  /* ── Main render ──────────────────────────────────────────────────────── */
  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "winner", label: "Match Winner", icon: "🏆" },
    { id: "score", label: "Innings Score", icon: "🏏" },
    { id: "player", label: "Player Classifier", icon: "🧠" },
  ];

  return (
    <>
      <style>{css}</style>
      <div className="pr-wrapper">
        <h1 className="pr-heading">Predictions</h1>
        <p className="pr-subtitle">ML-powered match predictions and player classification</p>

        <div className="pr-tab-row">
          {tabs.map((t) => (
            <button key={t.id} className={`pr-tab ${activeTab === t.id ? "pr-tab--active" : ""}`} onClick={() => setActiveTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {activeTab === "winner" && renderWinnerTab()}
        {activeTab === "score" && renderScoreTab()}
        {activeTab === "player" && renderPlayerTab()}
      </div>
    </>
  );
}
