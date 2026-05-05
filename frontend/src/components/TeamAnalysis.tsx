import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { fetchMatches } from "../services/api";
import type { ApexOptions } from "apexcharts";

/* ── Match shape ────────────────────────────────────────────────────────── */
interface Match {
  id: number;
  season: number;
  city: string | null;
  date: string;
  match_type: string | null;
  player_of_match: string | null;
  venue: string | null;
  team1: string;
  team2: string;
  toss_winner: string | null;
  toss_decision: string | null;
  winner: string | null;
  result: string | null;
  result_margin: number | null;
  target_runs: number | null;
  target_overs: number | null;
  super_over: string | null;
  method: string | null;
  umpire1: string | null;
  umpire2: string | null;
}

/* ── Inline styles ──────────────────────────────────────────────────────── */
const s: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    padding: "2.5rem 2rem",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "#e2e8f0",
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

  /* Selectors row */
  selectorRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "1.5rem",
    justifyContent: "center",
    marginBottom: "2.5rem",
  },
  selectGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.4rem",
    minWidth: "260px",
  },
  selectLabel: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "1.2px",
  },
  select: {
    padding: "0.7rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },

  /* KPI grid */
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1.25rem",
    marginBottom: "2.5rem",
    maxWidth: "1000px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  kpiCard: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "1.25rem 1rem",
    textAlign: "center" as const,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  kpiValue: {
    fontSize: "2rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  kpiLabel: {
    marginTop: "0.35rem",
    fontSize: "0.78rem",
    fontWeight: 500,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "1.2px",
  },

  /* Section */
  sectionTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "1rem",
    textAlign: "center" as const,
  },

  /* Chart card */
  chartCard: {
    maxWidth: "520px",
    marginLeft: "auto",
    marginRight: "auto",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "2rem",
  },

  /* H2H stats row */
  h2hRow: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    marginBottom: "1.5rem",
    flexWrap: "wrap" as const,
  },
  h2hStat: {
    textAlign: "center" as const,
  },
  h2hValue: {
    fontSize: "1.6rem",
    fontWeight: 700,
  },
  h2hLabel: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    marginTop: "0.2rem",
  },

  /* States */
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    fontSize: "1.1rem",
  },
  errorBox: {
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    gap: "1rem",
  },
  retryBtn: {
    padding: "0.6rem 1.6rem",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(135deg, #f7971e, #ffd200)",
    color: "#1e1b4b",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95rem",
  },
  prompt: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "30vh",
    color: "#64748b",
    fontSize: "1rem",
    fontStyle: "italic",
  },
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function TeamAnalysis() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [primaryTeam, setPrimaryTeam] = useState("");
  const [opponent, setOpponent] = useState("");

  const loadData = () => {
    setLoading(true);
    setError(null);
    fetchMatches()
      .then((data: Match[]) => setMatches(data))
      .catch(() => setError("Could not load match data. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ── Unique team list ─────────────────────────────────────────────────── */
  const teams = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => {
      set.add(m.team1);
      set.add(m.team2);
    });
    return Array.from(set).sort();
  }, [matches]);

  // Auto-select first two teams once data loads
  useEffect(() => {
    if (teams.length >= 2 && !primaryTeam) {
      setPrimaryTeam(teams[0]);
      setOpponent(teams[1]);
    }
  }, [teams, primaryTeam]);

  /* ── Primary team KPIs ────────────────────────────────────────────────── */
  const teamKpis = useMemo(() => {
    if (!primaryTeam) return null;

    const teamMatches = matches.filter(
      (m) => m.team1 === primaryTeam || m.team2 === primaryTeam
    );
    const totalMatches = teamMatches.length;
    const totalWins = teamMatches.filter((m) => m.winner === primaryTeam).length;
    const winPct = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : "0.0";

    // Toss-to-Win conversion: matches where team won toss AND won the match
    const tossWins = teamMatches.filter((m) => m.toss_winner === primaryTeam).length;
    const tossAndMatchWins = teamMatches.filter(
      (m) => m.toss_winner === primaryTeam && m.winner === primaryTeam
    ).length;
    const tossConversion =
      tossWins > 0 ? ((tossAndMatchWins / tossWins) * 100).toFixed(1) : "0.0";

    return { totalMatches, totalWins, winPct, tossConversion };
  }, [matches, primaryTeam]);

  /* ── Head-to-Head stats ───────────────────────────────────────────────── */
  const h2h = useMemo(() => {
    if (!primaryTeam || !opponent || primaryTeam === opponent) return null;

    const h2hMatches = matches.filter(
      (m) =>
        (m.team1 === primaryTeam && m.team2 === opponent) ||
        (m.team1 === opponent && m.team2 === primaryTeam)
    );
    const total = h2hMatches.length;
    const primaryWins = h2hMatches.filter((m) => m.winner === primaryTeam).length;
    const opponentWins = h2hMatches.filter((m) => m.winner === opponent).length;
    const noResult = total - primaryWins - opponentWins;

    return { total, primaryWins, opponentWins, noResult };
  }, [matches, primaryTeam, opponent]);

  /* ── Donut chart data ─────────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    if (!h2h || h2h.total === 0) return null;

    const labels: string[] = [primaryTeam, opponent];
    const series = [h2h.primaryWins, h2h.opponentWins];
    if (h2h.noResult > 0) {
      labels.push("No Result");
      series.push(h2h.noResult);
    }

    const options: ApexOptions = {
      chart: {
        type: "donut",
        background: "transparent",
        animations: { enabled: true, easing: "easeinout", speed: 600 } as any,
      },
      theme: { mode: "dark" },
      labels,
      colors: ["#00c6ff", "#f59e0b", "#64748b"],
      stroke: { width: 2, colors: ["#1e1b4b"] },
      legend: {
        position: "bottom",
        labels: { colors: "#94a3b8" },
        fontSize: "13px",
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: "14px", fontWeight: 700 },
        dropShadow: { enabled: false },
      },
      plotOptions: {
        pie: {
          donut: {
            size: "58%",
            labels: {
              show: true,
              name: { fontSize: "14px", color: "#cbd5e1" },
              value: { fontSize: "22px", fontWeight: 700, color: "#e2e8f0" },
              total: {
                show: true,
                label: "Total",
                fontSize: "13px",
                color: "#94a3b8",
              },
            },
          },
        },
      },
      tooltip: { theme: "dark" },
    };

    return { options, series };
  }, [h2h, primaryTeam, opponent]);

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ ...s.wrapper, ...s.center }}>
        <span style={{ opacity: 0.7 }}>⏳ Loading match data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...s.wrapper, ...s.errorBox }}>
        <span style={{ color: "#f87171" }}>❌ {error}</span>
        <button style={s.retryBtn} onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={s.wrapper}>
      <h1 style={s.heading}>🏟️ Team Analysis</h1>

      {/* ── Team Selectors ──────────────────────────────────────────────── */}
      <div style={s.selectorRow}>
        <div style={s.selectGroup}>
          <label style={s.selectLabel}>Primary Team</label>
          <select
            style={s.select}
            value={primaryTeam}
            onChange={(e) => setPrimaryTeam(e.target.value)}
          >
            {teams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div style={s.selectGroup}>
          <label style={s.selectLabel}>Opponent</label>
          <select
            style={s.select}
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
          >
            {teams
              .filter((t) => t !== primaryTeam)
              .map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* ── Primary Team KPIs ───────────────────────────────────────────── */}
      {teamKpis && (
        <>
          <h2 style={s.sectionTitle}>{primaryTeam} — Overall Stats</h2>
          <div style={s.kpiGrid}>
            <div style={s.kpiCard}>
              <div style={s.kpiValue}>{teamKpis.totalMatches}</div>
              <div style={s.kpiLabel}>Matches Played</div>
            </div>
            <div style={s.kpiCard}>
              <div style={s.kpiValue}>{teamKpis.totalWins}</div>
              <div style={s.kpiLabel}>Wins</div>
            </div>
            <div style={s.kpiCard}>
              <div style={s.kpiValue}>{teamKpis.winPct}%</div>
              <div style={s.kpiLabel}>Win Percentage</div>
            </div>
            <div style={s.kpiCard}>
              <div
                style={{
                  ...s.kpiValue,
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {teamKpis.tossConversion}%
              </div>
              <div style={s.kpiLabel}>Toss → Win Rate</div>
            </div>
          </div>
        </>
      )}

      {/* ── Head-to-Head Section ────────────────────────────────────────── */}
      {primaryTeam === opponent ? (
        <div style={s.prompt}>Select two different teams to see head-to-head stats.</div>
      ) : h2h && h2h.total > 0 ? (
        <>
          <h2 style={{ ...s.sectionTitle, marginTop: "1rem" }}>
            Head-to-Head: {primaryTeam} vs {opponent}
          </h2>

          {/* Quick stat numbers */}
          <div style={s.h2hRow}>
            <div style={s.h2hStat}>
              <div style={{ ...s.h2hValue, color: "#00c6ff" }}>{h2h.primaryWins}</div>
              <div style={s.h2hLabel}>{primaryTeam} Wins</div>
            </div>
            <div style={s.h2hStat}>
              <div style={{ ...s.h2hValue, color: "#64748b" }}>{h2h.total}</div>
              <div style={s.h2hLabel}>Matches</div>
            </div>
            <div style={s.h2hStat}>
              <div style={{ ...s.h2hValue, color: "#f59e0b" }}>{h2h.opponentWins}</div>
              <div style={s.h2hLabel}>{opponent} Wins</div>
            </div>
          </div>

          {/* Donut chart */}
          {chartData && (
            <div style={s.chartCard}>
              <Chart
                options={chartData.options}
                series={chartData.series}
                type="donut"
                height={340}
              />
            </div>
          )}
        </>
      ) : (
        <div style={s.prompt}>No head-to-head matches found between these two teams.</div>
      )}
    </div>
  );
}
