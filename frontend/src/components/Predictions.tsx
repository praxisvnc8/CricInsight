import { useState } from "react";
import { predictMatchWinner } from "../services/api";

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
interface PredictionResult {
  predicted_winner: string;
  team1: string;
  team2: string;
  team1_prob: number;
  team2_prob: number;
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    padding: "2.5rem 2rem",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: "2rem",
    background: "linear-gradient(90deg, #f7971e, #ffd200)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px",
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
    fontSize: "1.15rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "1.5rem",
    textAlign: "center" as const,
  },
  fieldGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1.25rem",
    marginBottom: "1.5rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.35rem",
  },
  fieldGroupFull: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.35rem",
    gridColumn: "1 / -1",
  },
  label: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
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
    appearance: "none" as const,
    WebkitAppearance: "none" as const,
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    paddingRight: "2.5rem",
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
  },
  validationMsg: {
    textAlign: "center" as const,
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
    textAlign: "center" as const,
  },
  resultLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
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

  /* Probability bars */
  probRow: {
    marginBottom: "0.85rem",
  },
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

  /* Error */
  errorMsg: {
    width: "100%",
    maxWidth: "560px",
    marginTop: "1.5rem",
    textAlign: "center" as const,
    color: "#f87171",
    fontSize: "0.95rem",
  },
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function Predictions() {
  const [team1, setTeam1] = useState(TEAMS[5]);       // Mumbai Indians
  const [team2, setTeam2] = useState(TEAMS[0]);       // Chennai Super Kings
  const [city, setCity] = useState(CITIES[0]);         // Mumbai
  const [tossWinner, setTossWinner] = useState(TEAMS[5]);
  const [tossDecision, setTossDecision] = useState("bat");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<string | null>(null);

  const handleSubmit = () => {
    /* Client-side validation */
    if (team1 === team2) {
      setValidation("Team 1 and Team 2 must be different.");
      return;
    }
    if (tossWinner !== team1 && tossWinner !== team2) {
      setValidation("Toss Winner must be either Team 1 or Team 2.");
      return;
    }

    setValidation(null);
    setLoading(true);
    setError(null);
    setResult(null);

    predictMatchWinner({
      team1,
      team2,
      city,
      toss_winner: tossWinner,
      toss_decision: tossDecision,
    })
      .then((data: PredictionResult) => setResult(data))
      .catch(() => setError("Prediction failed. Please check the backend and try again."))
      .finally(() => setLoading(false));
  };

  return (
    <div style={s.wrapper}>
      <h1 style={s.heading}>🤖 Match Winner Predictor</h1>

      {/* ── Form Card ───────────────────────────────────────────────────── */}
      <div style={s.formCard}>
        <h2 style={s.formTitle}>Enter Match Details</h2>

        <div style={s.fieldGrid}>
          {/* Team 1 */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Team 1</label>
            <select
              style={s.select}
              value={team1}
              onChange={(e) => {
                setTeam1(e.target.value);
                if (tossWinner !== e.target.value && tossWinner !== team2)
                  setTossWinner(e.target.value);
              }}
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Team 2 */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Team 2</label>
            <select
              style={s.select}
              value={team2}
              onChange={(e) => {
                setTeam2(e.target.value);
                if (tossWinner !== team1 && tossWinner !== e.target.value)
                  setTossWinner(e.target.value);
              }}
            >
              {TEAMS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Venue (City) */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Venue (City)</label>
            <select style={s.select} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Toss Winner */}
          <div style={s.fieldGroup}>
            <label style={s.label}>Toss Winner</label>
            <select
              style={s.select}
              value={tossWinner}
              onChange={(e) => setTossWinner(e.target.value)}
            >
              <option value={team1}>{team1}</option>
              <option value={team2}>{team2}</option>
            </select>
          </div>

          {/* Toss Decision */}
          <div style={s.fieldGroupFull}>
            <label style={s.label}>Toss Decision</label>
            <select
              style={s.select}
              value={tossDecision}
              onChange={(e) => setTossDecision(e.target.value)}
            >
              <option value="bat">Bat First</option>
              <option value="field">Field First</option>
            </select>
          </div>
        </div>

        {/* Validation message */}
        {validation && <p style={s.validationMsg}>⚠️ {validation}</p>}

        {/* Submit */}
        <button
          style={{
            ...s.submitBtn,
            opacity: loading ? 0.65 : 1,
            pointerEvents: loading ? "none" : "auto",
          }}
          onClick={handleSubmit}
        >
          {loading ? "⏳ Predicting…" : "🏆 Predict Winner"}
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && <p style={s.errorMsg}>❌ {error}</p>}

      {/* ── Result Card ─────────────────────────────────────────────────── */}
      {result && (
        <div style={s.resultCard}>
          <p style={s.resultLabel}>Predicted Winner</p>
          <h3 style={s.resultWinner}>🏆 {result.predicted_winner}</h3>

          {/* Team 1 probability */}
          <div style={s.probRow}>
            <div style={s.probHeader}>
              <span>{result.team1}</span>
              <span style={{ color: "#00c6ff", fontWeight: 700 }}>{result.team1_prob}%</span>
            </div>
            <div style={s.probTrack}>
              <div
                style={{
                  ...s.probFill,
                  width: `${result.team1_prob}%`,
                  background: "linear-gradient(90deg, #00c6ff, #0072ff)",
                }}
              />
            </div>
          </div>

          {/* Team 2 probability */}
          <div style={s.probRow}>
            <div style={s.probHeader}>
              <span>{result.team2}</span>
              <span style={{ color: "#f59e0b", fontWeight: 700 }}>{result.team2_prob}%</span>
            </div>
            <div style={s.probTrack}>
              <div
                style={{
                  ...s.probFill,
                  width: `${result.team2_prob}%`,
                  background: "linear-gradient(90deg, #f59e0b, #ef4444)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
