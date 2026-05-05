import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { fetchMatches } from "../services/api";
import type { ApexOptions } from "apexcharts";

/* ── Match shape (mirrors backend MatchResponse) ────────────────────────── */
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

/* ── Styles ──────────────────────────────────────────────────────────────── */
const styles: Record<string, React.CSSProperties> = {
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
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.5px",
  },

  /* KPI grid */
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2.5rem",
    maxWidth: "1100px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  kpiCard: {
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "1.5rem 1.25rem",
    textAlign: "center" as const,
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
  },
  kpiValue: {
    fontSize: "2.25rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #00c6ff, #0072ff)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  kpiLabel: {
    marginTop: "0.4rem",
    fontSize: "0.85rem",
    fontWeight: 500,
    color: "#94a3b8",
    textTransform: "uppercase" as const,
    letterSpacing: "1.2px",
  },

  /* Chart card */
  chartCard: {
    maxWidth: "900px",
    marginLeft: "auto",
    marginRight: "auto",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "2rem",
  },
  chartTitle: {
    fontSize: "1.15rem",
    fontWeight: 600,
    marginBottom: "1rem",
    color: "#cbd5e1",
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
};

/* ── Component ───────────────────────────────────────────────────────────── */
export default function OverviewDashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  /* ── KPI calculations ─────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (matches.length === 0) return null;

    const totalMatches = matches.length;
    const seasons = new Set(matches.map((m) => m.season));
    const totalSeasons = seasons.size;

    // Unique venues
    const venues = new Set(matches.map((m) => m.venue).filter(Boolean));
    const totalVenues = venues.size;

    // Super-over matches
    const superOvers = matches.filter(
      (m) => m.super_over && m.super_over.trim().toUpperCase() === "Y"
    ).length;

    return { totalMatches, totalSeasons, totalVenues, superOvers };
  }, [matches]);

  /* ── Top-5 winning teams chart data ───────────────────────────────────── */
  const chartData = useMemo(() => {
    if (matches.length === 0) return null;

    const winCount: Record<string, number> = {};
    matches.forEach((m) => {
      if (m.winner) {
        winCount[m.winner] = (winCount[m.winner] || 0) + 1;
      }
    });

    const sorted = Object.entries(winCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const categories = sorted.map(([team]) => team);
    const values = sorted.map(([, count]) => count);

    const options: ApexOptions = {
      chart: {
        type: "bar",
        background: "transparent",
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 800,
        }as any,
      },
      theme: { mode: "dark" },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: "55%",
          distributed: true,
        },
      },
      colors: ["#00c6ff", "#0072ff", "#7c3aed", "#f59e0b", "#10b981"],
      dataLabels: { enabled: true, style: { fontSize: "13px", fontWeight: 700 } },
      xaxis: {
        categories,
        labels: { style: { colors: "#94a3b8", fontSize: "12px" } },
      },
      yaxis: {
        labels: { style: { colors: "#94a3b8" } },
      },
      grid: { borderColor: "rgba(255,255,255,0.06)" },
      legend: { show: false },
      tooltip: { theme: "dark" },
    };

    const series = [{ name: "Wins", data: values }];

    return { options, series };
  }, [matches]);

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ ...styles.wrapper, ...styles.center }}>
        <span style={{ opacity: 0.7 }}>⏳ Loading match data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...styles.wrapper, ...styles.errorBox }}>
        <span style={{ color: "#f87171" }}>❌ {error}</span>
        <button style={styles.retryBtn} onClick={loadData}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <h1 style={styles.heading}>📊 IPL Overview Dashboard</h1>

      {/* KPI Cards */}
      {kpis && (
        <div style={styles.kpiGrid}>
          <div style={styles.kpiCard}>
            <div style={styles.kpiValue}>{kpis.totalMatches}</div>
            <div style={styles.kpiLabel}>Total Matches</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiValue}>{kpis.totalSeasons}</div>
            <div style={styles.kpiLabel}>Seasons Covered</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={styles.kpiValue}>{kpis.totalVenues}</div>
            <div style={styles.kpiLabel}>Unique Venues</div>
          </div>
          <div style={styles.kpiCard}>
            <div style={{ ...styles.kpiValue, background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {kpis.superOvers}
            </div>
            <div style={styles.kpiLabel}>Super Overs</div>
          </div>
        </div>
      )}

      {/* Top-5 Teams Bar Chart */}
      {chartData && (
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>🏆 Top 5 Teams by Wins</h2>
          <Chart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={360}
          />
        </div>
      )}
    </div>
  );
}
