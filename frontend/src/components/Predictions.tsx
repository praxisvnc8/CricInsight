import { useState } from "react";
import {
  predictMatchWinner,
  predictInningsScore,
  predictPlayerPerformance,
  fetchPlayerStats,
} from "../services/api";

/* ── Hardcoded IPL teams & venues ────────────────────────────────────────── */
const TEAMS = [
  "Chennai Super Kings",
  "Delhi Capitals",
  "Gujarat Titans",
  "Kolkata Knight Riders",
  "Lucknow Super Giants",
  "Mumbai Indians",
  "Punjab Kings",
  "Rajasthan Royals",
  "Royal Challengers Bengaluru",
  "Sunrisers Hyderabad",
];

const CITIES = [
  "Mumbai",
  "Chennai",
  "Kolkata",
  "Delhi",
  "Bengaluru",
  "Hyderabad",
  "Jaipur",
  "Ahmedabad",
  "Chandigarh",
  "Lucknow",
];

/* ── Types ───────────────────────────────────────────────────────────────── */
interface WinnerResult {
  predicted_winner: string;
  team1: string;
  team2: string;
  team1_prob: number;
  team2_prob: number;
}

interface ScoreResult {
  predicted_score: number;
  score_low: number;
  score_high: number;
  batting_team: string;
  bowling_team: string;
}

interface PerfResult {
  label: string;
  thresholds: { poor_below: number; good_above: number };
  input_stats: Record<string, number>;
}

type TabId = "winner" | "score" | "player";

/* ── Styles ──────────────────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    padding: "2.5rem 2rem",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    textAlign: "center",
    marginBottom: "1.75rem",
    background: "linear-gradient(90deg, #f7971e, #ffd200)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px",
  },

  /* Tabs */
  tabRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "2rem",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "14px",
    padding: "0.35rem",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  tab: {
    padding: "0.65rem 1.4rem",
    borderRadius: "10px",
    border: "none",
    background: "transparent",
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "0.88rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontFamily: "'Inter', sans-serif",
    whiteSpace: "nowrap",
  },
  tabActive: {
    background: "linear-gradient(135deg, rgba(0,198,255,0.15), rgba(0,114,255,0.15))",
    color: "#ffffff",
    border: "1px solid rgba(0,198,255,0.25)",
    boxShadow: "0 0 16px rgba(0,114,255,0.1)",
  },

  /* Form card */
  formCard: {
    width: "100%",
    maxWidth: "560px",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "2rem 2rem 2.25rem",
  },
  formTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "1.5rem",
    textAlign: "center",
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  fieldGroupFull: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  select: {
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    fontSize: "0.92rem",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    appearance: "none",
    WebkitAppearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "2.5rem",
  },
  input: {
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    fontSize: "0.92rem",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    backdropFilter: "blur(8px)",
  },
  submitBtn: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "#fff",
    fontWeight: 700,
    fontSize: "1rem",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "opacity 0.2s, transform 0.15s",
    fontFamily: "'Inter', sans-serif",
  },
  validationMsg: {
    textAlign: "center",
    fontSize: "0.85rem",
    color: "#f87171",
    marginBottom: "0.75rem",
  },

  /* Result card */
  resultCard: {
    width: "100%",
    maxWidth: "560px",
    marginTop: "2rem",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(14px)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "2rem",
    textAlign: "center",
  },
  resultLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: "0.5rem",
  },
  resultWinner: {
    fontSize: "1.75rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #f7971e, #ffd200)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "1.5rem",
  },
  probRow: { marginBottom: "0.85rem" },
  probHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.3rem",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  probTrack: {
    height: "10px",
    borderRadius: "5px",
    background: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  probFill: {
    height: "100%",
    borderRadius: "5px",
    transition: "width 0.6s ease",
  },

  /* Score result */
  scoreValue: {
    fontSize: "3rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.25rem",
  },
  scoreRange: {
    fontSize: "0.95rem",
    color: "#94a3b8",
    marginBottom: "0.5rem",
  },
  scoreTeams: {
    fontSize: "0.85rem",
    color: "#64748b",
  },

  /* Performance badge */
  perfBadge: {
    display: "inline-block",
    padding: "0.6rem 2rem",
    borderRadius: "30px",
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    marginBottom: "1rem",
  },
  perfStatRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "0.75rem",
    marginTop: "1rem",
  },
  perfStatItem: { textAlign: "center" },
  perfStatVal: { fontSize: "1.2rem", fontWeight: 700, color: "#e2e8f0" },
  perfStatLbl: {
    fontSize: "0.68rem",
    fontWeight: 500,
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginTop: "0.15rem",
  },

  /* Error */
  errorMsg: {
    width: "100%",
    maxWidth: "560px",
    marginTop: "1.5rem",
    textAlign: "center",
    color: "#f87171",
    fontSize: "0.95rem",
  },
} as const;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const perfColors: Record<string, { bg: string; border: string; text: string }> = {
  Good: {
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.35)",
    text: "#34d399",
  },
  Average: {
    bg: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.35)",
    text: "#fbbf24",
  },
  Poor: {
    bg: "rgba(239,68,68,0.15)",
    border: "rgba(239,68,68,0.35)",
    text: "#f87171",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Predictions() {
  const [activeTab, setActiveTab] = useState<TabId>("winner");

  /* ── Tab 1 – Match Winner state ───────────────────────────────────────── */
  const [w_team1, w_setTeam1] = useState(TEAMS[5]);
  const [w_team2, w_setTeam2] = useState(TEAMS[0]);
  const [w_city, w_setCity] = useState(CITIES[0]);
  const [w_toss, w_setToss] = useState(TEAMS[5]);
  const [w_decision, w_setDecision] = useState("bat");
  const [w_loading, w_setLoading] = useState(false);
  const [w_result, w_setResult] = useState<WinnerResult | null>(null);
  const [w_error, w_setError] = useState<string | null>(null);
  const [w_validation, w_setValidation] = useState<string | null>(null);

  /* ── Tab 2 – Innings Score state ──────────────────────────────────────── */
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

  /* ── Tab 3 – Player Classifier state ──────────────────────────────────── */
  const [pl_name, pl_setName] = useState("");
  const [pl_loading, pl_setLoading] = useState(false);
  const [pl_result, pl_setResult] = useState<PerfResult | null>(null);
  const [pl_error, pl_setError] = useState<string | null>(null);

  /* ── Handlers ─────────────────────────────────────────────────────────── */
  const handleWinner = () => {
    if (w_team1 === w_team2) {
      w_setValidation("Team 1 and Team 2 must be different.");
      return;
    }
    if (w_toss !== w_team1 && w_toss !== w_team2) {
      w_setValidation("Toss Winner must be either Team 1 or Team 2.");
      return;
    }
    w_setValidation(null);
    w_setLoading(true);
    w_setError(null);
    w_setResult(null);
    predictMatchWinner({
      team1: w_team1,
      team2: w_team2,
      city: w_city,
      toss_winner: w_toss,
      toss_decision: w_decision,
    })
      .then((d: WinnerResult) => w_setResult(d))
      .catch(() => w_setError("Prediction failed. Please check the backend."))
      .finally(() => w_setLoading(false));
  };

  const handleScore = () => {
    if (sc_bat === sc_bowl) {
      sc_setValidation("Batting and Bowling teams must be different.");
      return;
    }
    if (sc_toss !== sc_bat && sc_toss !== sc_bowl) {
      sc_setValidation("Toss Winner must be either Batting or Bowling team.");
      return;
    }
    sc_setValidation(null);
    sc_setLoading(true);
    sc_setError(null);
    sc_setResult(null);
    predictInningsScore({
      batting_team: sc_bat,
      bowling_team: sc_bowl,
      city: sc_city,
      season: sc_season,
      toss_winner: sc_toss,
      toss_decision: sc_decision,
    })
      .then((d: ScoreResult) => sc_setResult(d))
      .catch(() => sc_setError("Score prediction failed. Please check the backend."))
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

      const innings = stats.total_innings ?? 0;
      const balls_faced = stats.total_balls_faced ?? 0;
      const fours = stats.total_fours ?? 0;
      const sixes = stats.total_sixes ?? 0;
      const strike_rate =
        balls_faced > 0
          ? parseFloat(((stats.total_runs / balls_faced) * 100).toFixed(2))
          : 0;
      const batting_avg =
        innings > 0
          ? parseFloat((stats.total_runs / innings).toFixed(2))
          : 0;

      const perf: PerfResult = await predictPlayerPerformance({
        innings,
        balls_faced,
        strike_rate,
        batting_avg,
        fours,
        sixes,
      });
      pl_setResult(perf);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        pl_setError(
          `Player "${name}" not found. Try names like "V Kohli", "RG Sharma", or "JJ Bumrah".`
        );
      } else {
        pl_setError("Classification failed. Please try again.");
      }
    } finally {
      pl_setLoading(false);
    }
  };

  /* ── Render helpers ───────────────────────────────────────────────────── */
  const renderSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: string[],
    full = false
  ) => (
    <div style={full ? s.fieldGroupFull : s.fieldGroup}>
      <label style={s.label}>{label}</label>
      <select style={s.select} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );

  const btnStyle = (loading: boolean): React.CSSProperties => ({
    ...s.submitBtn,
    opacity: loading ? 0.65 : 1,
    pointerEvents: loading ? "none" : "auto",
  });

  /* ── TAB 1 ────────────────────────────────────────────────────────────── */
  const renderWinnerTab = () => (
    <>
      <div style={s.formCard}>
        <h2 style={s.formTitle}>🏆 Match Winner Predictor</h2>
        <div style={s.fieldGrid}>
          {renderSelect("Team 1", w_team1, (v) => {
            w_setTeam1(v);
            if (w_toss !== v && w_toss !== w_team2) w_setToss(v);
          }, TEAMS)}
          {renderSelect("Team 2", w_team2, (v) => {
            w_setTeam2(v);
            if (w_toss !== w_team1 && w_toss !== v) w_setToss(v);
          }, TEAMS)}
          {renderSelect("Venue (City)", w_city, w_setCity, CITIES)}
          {renderSelect("Toss Winner", w_toss, w_setToss, [w_team1, w_team2])}
          {renderSelect("Toss Decision", w_decision, w_setDecision, ["bat", "field"], true)}
        </div>
        {w_validation && <p style={s.validationMsg}>⚠️ {w_validation}</p>}
        <button style={btnStyle(w_loading)} onClick={handleWinner}>
          {w_loading ? "⏳ Predicting…" : "🏆 Predict Winner"}
        </button>
      </div>

      {w_error && <p style={s.errorMsg}>❌ {w_error}</p>}

      {w_result && (
        <div style={s.resultCard}>
          <p style={s.resultLabel}>Predicted Winner</p>
          <h3 style={s.resultWinner}>🏆 {w_result.predicted_winner}</h3>
          <div style={s.probRow}>
            <div style={s.probHeader}>
              <span>{w_result.team1}</span>
              <span style={{ color: "#00c6ff", fontWeight: 700 }}>{w_result.team1_prob}%</span>
            </div>
            <div style={s.probTrack}>
              <div
                style={{
                  ...s.probFill,
                  width: `${w_result.team1_prob}%`,
                  background: "linear-gradient(90deg, #00c6ff, #0072ff)",
                }}
              />
            </div>
          </div>
          <div style={s.probRow}>
            <div style={s.probHeader}>
              <span>{w_result.team2}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{w_result.team2_prob}%</span>
            </div>
            <div style={s.probTrack}>
              <div
                style={{
                  ...s.probFill,
                  width: `${w_result.team2_prob}%`,
                  background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );

  /* ── TAB 2 ────────────────────────────────────────────────────────────── */
  const renderScoreTab = () => (
    <>
      <div style={s.formCard}>
        <h2 style={s.formTitle}>🏏 First Innings Score Predictor</h2>
        <div style={s.fieldGrid}>
          {renderSelect("Batting Team", sc_bat, (v) => {
            sc_setBat(v);
            if (sc_toss !== v && sc_toss !== sc_bowl) sc_setToss(v);
          }, TEAMS)}
          {renderSelect("Bowling Team", sc_bowl, (v) => {
            sc_setBowl(v);
            if (sc_toss !== sc_bat && sc_toss !== v) sc_setToss(v);
          }, TEAMS)}
          {renderSelect("Venue (City)", sc_city, sc_setCity, CITIES)}
          <div style={s.fieldGroup}>
            <label style={s.label}>Season</label>
            <select
              style={s.select}
              value={sc_season}
              onChange={(e) => sc_setSeason(Number(e.target.value))}
            >
              {Array.from({ length: 17 }, (_, i) => 2008 + i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          {renderSelect("Toss Winner", sc_toss, sc_setToss, [sc_bat, sc_bowl])}
          {renderSelect("Toss Decision", sc_decision, sc_setDecision, ["bat", "field"], true)}
        </div>
        {sc_validation && <p style={s.validationMsg}>⚠️ {sc_validation}</p>}
        <button style={btnStyle(sc_loading)} onClick={handleScore}>
          {sc_loading ? "⏳ Predicting…" : "🏏 Predict Score"}
        </button>
      </div>

      {sc_error && <p style={s.errorMsg}>❌ {sc_error}</p>}

      {sc_result && (
        <div style={s.resultCard}>
          <p style={s.resultLabel}>Predicted First Innings Score</p>
          <h3 style={s.scoreValue}>{sc_result.predicted_score}</h3>
          <p style={s.scoreRange}>
            Likely range: {sc_result.score_low} – {sc_result.score_high}
          </p>
          <p style={s.scoreTeams}>
            {sc_result.batting_team} batting vs {sc_result.bowling_team}
          </p>
        </div>
      )}
    </>
  );

  /* ── TAB 3 ────────────────────────────────────────────────────────────── */
  const renderPlayerTab = () => {
    const c = pl_result ? perfColors[pl_result.label] ?? perfColors.Average : null;

    return (
      <>
        <div style={s.formCard}>
          <h2 style={s.formTitle}>🧠 Player Performance Classifier</h2>
          <div style={{ ...s.fieldGrid, gridTemplateColumns: "1fr" }}>
            <div style={s.fieldGroupFull}>
              <label style={s.label}>Player Name</label>
              <input
                style={s.input}
                type="text"
                placeholder='e.g. "V Kohli", "MS Dhoni", "JJ Bumrah"'
                value={pl_name}
                onChange={(e) => pl_setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePlayer()}
              />
            </div>
          </div>
          <button style={btnStyle(pl_loading)} onClick={handlePlayer}>
            {pl_loading ? "⏳ Analysing…" : "🧠 Classify Performance"}
          </button>
        </div>

        {pl_error && <p style={s.errorMsg}>⚠️ {pl_error}</p>}

        {pl_result && c && (
          <div style={s.resultCard}>
            <p style={s.resultLabel}>Career Performance Rating</p>
            <div>
              <span
                style={{
                  ...s.perfBadge,
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  color: c.text,
                }}
              >
                {pl_result.label === "Good" && "🥇 "}
                {pl_result.label === "Average" && "🥈 "}
                {pl_result.label === "Poor" && "🥉 "}
                {pl_result.label}
              </span>
            </div>

            <div style={s.perfStatRow}>
              {Object.entries(pl_result.input_stats).map(([key, val]) => (
                <div key={key} style={s.perfStatItem}>
                  <div style={s.perfStatVal}>
                    {typeof val === "number" ? (Number.isInteger(val) ? val : val.toFixed(1)) : val}
                  </div>
                  <div style={s.perfStatLbl}>{key.replace(/_/g, " ")}</div>
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
    <div style={s.wrapper}>
      <h1 style={s.heading}>🤖 Predictions</h1>

      {/* Tab bar */}
      <div style={s.tabRow}>
        {tabs.map((t) => (
          <button
            key={t.id}
            style={{
              ...s.tab,
              ...(activeTab === t.id ? s.tabActive : {}),
            }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Active panel */}
      {activeTab === "winner" && renderWinnerTab()}
      {activeTab === "score" && renderScoreTab()}
      {activeTab === "player" && renderPlayerTab()}
    </div>
  );
}
