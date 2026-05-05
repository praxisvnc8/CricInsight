import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import {
  fetchTopBatsmen,
  fetchTopBowlers,
  fetchPlayerStats,
} from "../services/api";
import type { ApexOptions, ApexAxisChartSeries } from "apexcharts";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Batsman {
  batter: string;
  career_runs: number;
  career_innings: number;
  career_balls: number;
  career_fours: number;
  career_sixes: number;
}

interface Bowler {
  bowler: string;
  career_wickets: number;
  career_matches: number;
  career_runs_conceded: number;
  career_balls: number;
}

interface PlayerStats {
  player: string;
  total_innings: number;
  total_runs: number;
  total_balls_faced: number;
  total_fours: number;
  total_sixes: number;
  total_wickets: number;
  total_matches: number;
  total_runs_conceded: number;
  total_balls_bowled: number;
}

/* ── Styles ──────────────────────────────────────────────────────────────── */
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

  /* Charts row */
  chartsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
    gap: "1.5rem",
    maxWidth: "1100px",
    margin: "0 auto 3rem",
  },
  chartCard: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "1.5rem",
  },
  chartTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#cbd5e1",
    marginBottom: "0.75rem",
  },

  /* Search */
  searchSection: {
    maxWidth: "600px",
    margin: "0 auto 2rem",
  },
  sectionHeading: {
    fontSize: "1.25rem",
    fontWeight: 600,
    color: "#cbd5e1",
    textAlign: "center" as const,
    marginBottom: "1rem",
  },
  searchRow: {
    display: "flex",
    gap: "0.75rem",
  },
  input: {
    flex: 1,
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    backdropFilter: "blur(8px)",
  },
  searchBtn: {
    padding: "0.75rem 1.5rem",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    color: "#fff",
    fontWeight: 600,
    fontSize: "0.95rem",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
    transition: "opacity 0.2s",
  },

  /* Player card */
  playerCard: {
    maxWidth: "600px",
    margin: "1.5rem auto 0",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "2rem",
  },
  playerName: {
    fontSize: "1.4rem",
    fontWeight: 700,
    textAlign: "center" as const,
    marginBottom: "1.25rem",
    background: "linear-gradient(90deg, #00c6ff, #0072ff)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  badge: {
    display: "inline-block",
    margin: "0 auto 1.25rem",
    padding: "0.3rem 0.9rem",
    borderRadius: "20px",
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.8px",
    textTransform: "uppercase" as const,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "1rem",
  },
  statItem: {
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  statLabel: {
    fontSize: "0.72rem",
    fontWeight: 500,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
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
  inlineMsg: {
    textAlign: "center" as const,
    marginTop: "1rem",
    fontSize: "0.95rem",
    color: "#94a3b8",
    fontStyle: "italic",
  },
  inlineError: {
    textAlign: "center" as const,
    marginTop: "1rem",
    fontSize: "0.95rem",
    color: "#f87171",
  },
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function PlayerAnalysis() {
  /* Top performers */
  const [batsmen, setBatsmen] = useState<Batsman[]>([]);
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Player search */
  const [searchInput, setSearchInput] = useState("");
  const [searchedPlayer, setSearchedPlayer] = useState<PlayerStats | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadTopPerformers = () => {
    setLoading(true);
    setError(null);
    Promise.all([fetchTopBatsmen(), fetchTopBowlers()])
      .then(([b, w]) => {
        setBatsmen(b);
        setBowlers(w);
      })
      .catch(() => setError("Could not load player data. Is the backend running?"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTopPerformers();
  }, []);

  /* ── Search handler ───────────────────────────────────────────────────── */
  const handleSearch = () => {
    const name = searchInput.trim();
    if (!name) return;

    setSearchLoading(true);
    setSearchError(null);
    setSearchedPlayer(null);

    fetchPlayerStats(name)
      .then((data: PlayerStats) => setSearchedPlayer(data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setSearchError(
            `Player "${name}" not found. Try names like "V Kohli", "RG Sharma", or "JJ Bumrah".`
          );
        } else {
          setSearchError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setSearchLoading(false));
  };

  /* ── Chart configs ────────────────────────────────────────────────────── */
  const batsmenChart = (): { options: ApexOptions; series: ApexAxisChartSeries } => {
    const top10 = batsmen.slice(0, 10);
    return {
      options: {
        chart: { type: "bar", background: "transparent", toolbar: { show: false } },
        theme: { mode: "dark" },
        plotOptions: {
          bar: { borderRadius: 5, horizontal: true, distributed: true, barHeight: "65%" },
        },
        colors: [
          "#00c6ff", "#0072ff", "#7c3aed", "#f59e0b", "#10b981",
          "#ec4899", "#06b6d4", "#8b5cf6", "#f97316", "#14b8a6",
        ],
        xaxis: {
          categories: top10.map((b) => b.batter),
          labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
        },
        yaxis: { labels: { style: { colors: "#94a3b8", fontSize: "12px" } } },
        grid: { borderColor: "rgba(255,255,255,0.06)" },
        legend: { show: false },
        dataLabels: { enabled: true, style: { fontSize: "12px" } },
        tooltip: { theme: "dark" },
      },
      series: [{ name: "Career Runs", data: top10.map((b) => b.career_runs) }],
    };
  };

  const bowlersChart = (): { options: ApexOptions; series: ApexAxisChartSeries } => {
    const top10 = bowlers.slice(0, 10);
    return {
      options: {
        chart: { type: "bar", background: "transparent", toolbar: { show: false } },
        theme: { mode: "dark" },
        plotOptions: {
          bar: { borderRadius: 5, horizontal: true, distributed: true, barHeight: "65%" },
        },
        colors: [
          "#f59e0b", "#ef4444", "#10b981", "#0072ff", "#7c3aed",
          "#ec4899", "#06b6d4", "#8b5cf6", "#f97316", "#14b8a6",
        ],
        xaxis: {
          categories: top10.map((b) => b.bowler),
          labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
        },
        yaxis: { labels: { style: { colors: "#94a3b8", fontSize: "12px" } } },
        grid: { borderColor: "rgba(255,255,255,0.06)" },
        legend: { show: false },
        dataLabels: { enabled: true, style: { fontSize: "12px" } },
        tooltip: { theme: "dark" },
      },
      series: [{ name: "Career Wickets", data: top10.map((b) => b.career_wickets) }],
    };
  };

  /* ── Derived stats for player card ────────────────────────────────────── */
  const computeDerived = (p: PlayerStats) => {
    const strikeRate =
      p.total_balls_faced > 0
        ? ((p.total_runs / p.total_balls_faced) * 100).toFixed(1)
        : "—";
    const battingAvg =
      p.total_innings > 0
        ? (p.total_runs / p.total_innings).toFixed(1)
        : "—";
    const economy =
      p.total_balls_bowled > 0
        ? ((p.total_runs_conceded / (p.total_balls_bowled / 6))).toFixed(2)
        : "—";
    const bowlingAvg =
      p.total_wickets > 0
        ? (p.total_runs_conceded / p.total_wickets).toFixed(1)
        : "—";
    const isAllRounder = p.total_runs > 500 && p.total_wickets > 30;

    return { strikeRate, battingAvg, economy, bowlingAvg, isAllRounder };
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ ...s.wrapper, ...s.center }}>
        <span style={{ opacity: 0.7 }}>⏳ Loading player data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...s.wrapper, ...s.errorBox }}>
        <span style={{ color: "#f87171" }}>❌ {error}</span>
        <button style={s.retryBtn} onClick={loadTopPerformers}>
          Retry
        </button>
      </div>
    );
  }

  const batChart = batsmenChart();
  const bowlChart = bowlersChart();

  return (
    <div style={s.wrapper}>
      <h1 style={s.heading}>🏏 Player Analysis</h1>

      {/* ── Top Performers Charts ───────────────────────────────────────── */}
      <div style={s.chartsRow}>
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>🏅 Top 10 Run Scorers (Career)</h3>
          <Chart
            options={batChart.options}
            series={batChart.series}
            type="bar"
            height={380}
          />
        </div>
        <div style={s.chartCard}>
          <h3 style={s.chartTitle}>🎯 Top 10 Wicket Takers (Career)</h3>
          <Chart
            options={bowlChart.options}
            series={bowlChart.series}
            type="bar"
            height={380}
          />
        </div>
      </div>

      {/* ── Player Search ───────────────────────────────────────────────── */}
      <div style={s.searchSection}>
        <h2 style={s.sectionHeading}>🔍 Player Search</h2>
        <div style={s.searchRow}>
          <input
            style={s.input}
            type="text"
            placeholder='Enter player name (e.g. "V Kohli")'
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button
            style={{
              ...s.searchBtn,
              opacity: searchLoading ? 0.6 : 1,
              pointerEvents: searchLoading ? "none" : "auto",
            }}
            onClick={handleSearch}
          >
            {searchLoading ? "Searching…" : "Search"}
          </button>
        </div>

        {/* Search loading */}
        {searchLoading && (
          <p style={s.inlineMsg}>⏳ Searching…</p>
        )}

        {/* Search error */}
        {searchError && (
          <p style={s.inlineError}>⚠️ {searchError}</p>
        )}

        {/* Player Career Card */}
        {searchedPlayer && (() => {
          const d = computeDerived(searchedPlayer);
          return (
            <div style={s.playerCard}>
              <h3 style={s.playerName}>{searchedPlayer.player}</h3>

              {/* All-rounder badge */}
              <div style={{ textAlign: "center" }}>
                <span
                  style={{
                    ...s.badge,
                    background: d.isAllRounder
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(100, 116, 139, 0.15)",
                    color: d.isAllRounder ? "#34d399" : "#94a3b8",
                    border: `1px solid ${d.isAllRounder ? "rgba(16,185,129,0.3)" : "rgba(100,116,139,0.2)"}`,
                  }}
                >
                  {d.isAllRounder ? "⭐ All-Rounder" : "Specialist"}
                </span>
              </div>

              <div style={s.statsGrid}>
                <div style={s.statItem}>
                  <div style={s.statValue}>{searchedPlayer.total_runs.toLocaleString()}</div>
                  <div style={s.statLabel}>Total Runs</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{searchedPlayer.total_wickets}</div>
                  <div style={s.statLabel}>Wickets</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{searchedPlayer.total_innings}</div>
                  <div style={s.statLabel}>Innings</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{d.strikeRate}</div>
                  <div style={s.statLabel}>Strike Rate</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{d.battingAvg}</div>
                  <div style={s.statLabel}>Batting Avg</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{d.economy}</div>
                  <div style={s.statLabel}>Economy</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{searchedPlayer.total_fours}</div>
                  <div style={s.statLabel}>Fours</div>
                </div>
                <div style={s.statItem}>
                  <div style={s.statValue}>{searchedPlayer.total_sixes}</div>
                  <div style={s.statLabel}>Sixes</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
