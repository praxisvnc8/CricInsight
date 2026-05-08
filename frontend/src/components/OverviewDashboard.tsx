import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { fetchMatches } from "../services/api";
import { getTeamLogo } from "../utils/teamLogos";
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

/* ── CSS-in-JS (Premium Dark Theme) ─────────────────────────────────────── */
const css = `
  .ov-wrapper {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a0e1a 0%, #111827 40%, #0f172a 100%);
    padding: 2.5rem 2rem;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
  }
  .ov-heading {
    font-size: 2.2rem;
    font-weight: 800;
    text-align: center;
    margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: 0.5px;
  }
  .ov-subtitle {
    text-align: center;
    color: #64748b;
    font-size: 0.9rem;
    margin-bottom: 2.5rem;
  }

  /* KPI grid */
  .ov-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1.5rem;
    max-width: 1100px;
    margin: 0 auto 3rem;
  }
  .ov-kpi-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.06);
    padding: 1.75rem 1.5rem;
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .ov-kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 40px rgba(0,114,255,0.15);
    border-color: rgba(0,198,255,0.15);
  }
  .ov-kpi-icon { font-size: 1.6rem; margin-bottom: 0.5rem; }
  .ov-kpi-value {
    font-size: 2.5rem;
    font-weight: 800;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.1;
  }
  .ov-kpi-value--warm {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .ov-kpi-label {
    margin-top: 0.45rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  /* Chart card */
  .ov-chart-card {
    max-width: 920px;
    margin: 0 auto 2.5rem;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.06);
    padding: 2rem;
    box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .ov-chart-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 1rem;
  }

  /* Recent match card */
  .ov-recent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
    max-width: 1100px;
    margin: 0 auto;
  }
  .ov-match-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    background: rgba(255,255,255,0.03);
    border-radius: 14px;
    border: 1px solid rgba(255,255,255,0.05);
    padding: 1rem 1.25rem;
    transition: border-color 0.2s;
  }
  .ov-match-card:hover { border-color: rgba(0,198,255,0.2); }
  .ov-match-logos {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-shrink: 0;
  }
  .ov-match-logo { width: 36px; height: 36px; object-fit: contain; }
  .ov-match-vs {
    font-size: 0.7rem;
    color: #475569;
    font-weight: 700;
  }
  .ov-match-info { flex: 1; min-width: 0; }
  .ov-match-teams {
    font-size: 0.85rem;
    font-weight: 600;
    color: #cbd5e1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ov-match-detail {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 0.15rem;
  }
  .ov-match-winner {
    font-size: 0.72rem;
    font-weight: 600;
    color: #34d399;
    white-space: nowrap;
  }

  /* States */
  .ov-center {
    display: flex; justify-content: center; align-items: center;
    min-height: 60vh; font-size: 1.1rem;
  }
  .ov-error-box {
    display: flex; flex-direction: column; justify-content: center;
    align-items: center; min-height: 60vh; gap: 1rem;
  }
  .ov-retry-btn {
    padding: 0.65rem 1.8rem; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e1b4b; font-weight: 700; cursor: pointer; font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
  }

  .ov-section-title {
    font-size: 1.1rem; font-weight: 600; color: #94a3b8;
    margin-bottom: 1.25rem; text-align: center;
  }
`;

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

  useEffect(() => { loadData(); }, []);

  /* ── KPI calculations ─────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (matches.length === 0) return null;
    const totalMatches = matches.length;
    const totalSeasons = new Set(matches.map((m) => m.season)).size;
    const totalVenues = new Set(matches.map((m) => m.venue).filter(Boolean)).size;
    const superOvers = matches.filter(
      (m) => m.super_over && m.super_over.trim().toUpperCase() === "Y"
    ).length;

    // total runs scored (from target_runs or result_margin approximation — we show matches-based KPIs)
    const totalSixes = 0; // would need deliveries — skip for now
    return { totalMatches, totalSeasons, totalVenues, superOvers, totalSixes };
  }, [matches]);

  /* ── Top-5 winning teams ──────────────────────────────────────────────── */
  const chartData = useMemo(() => {
    if (matches.length === 0) return null;
    const winCount: Record<string, number> = {};
    matches.forEach((m) => { if (m.winner) winCount[m.winner] = (winCount[m.winner] || 0) + 1; });

    const sorted = Object.entries(winCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const categories = sorted.map(([team]) => team);
    const values = sorted.map(([, count]) => count);

    const options: ApexOptions = {
      chart: { type: "bar", background: "transparent", toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 800 } as any },
      theme: { mode: "dark" },
      plotOptions: { bar: { borderRadius: 8, columnWidth: "52%", distributed: true } },
      colors: ["#00c6ff", "#0072ff", "#7c3aed", "#f59e0b", "#10b981"],
      dataLabels: { enabled: true, style: { fontSize: "13px", fontWeight: 700 } },
      xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "11px" } } },
      yaxis: { labels: { style: { colors: "#64748b" } } },
      grid: { borderColor: "rgba(255,255,255,0.04)" },
      legend: { show: false },
      tooltip: { theme: "dark" },
    };
    return { options, series: [{ name: "Wins", data: values }] };
  }, [matches]);

  /* ── Recent 6 matches ─────────────────────────────────────────────────── */
  const recentMatches = useMemo(() => matches.slice(0, 6), [matches]);

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (loading) {
    return (<><style>{css}</style><div className="ov-wrapper ov-center"><span style={{ opacity: 0.7 }}>⏳ Loading match data…</span></div></>);
  }
  if (error) {
    return (<><style>{css}</style><div className="ov-wrapper ov-error-box"><span style={{ color: "#f87171" }}>❌ {error}</span><button className="ov-retry-btn" onClick={loadData}>Retry</button></div></>);
  }

  return (
    <>
      <style>{css}</style>
      <div className="ov-wrapper">
        <h1 className="ov-heading">IPL Overview Dashboard</h1>
        <p className="ov-subtitle">Comprehensive analytics across all IPL seasons (2008–2024)</p>

        {/* KPI Cards */}
        {kpis && (
          <div className="ov-kpi-grid">
            <div className="ov-kpi-card">
              <div className="ov-kpi-icon">🏏</div>
              <div className="ov-kpi-value">{kpis.totalMatches.toLocaleString()}</div>
              <div className="ov-kpi-label">Total Matches</div>
            </div>
            <div className="ov-kpi-card">
              <div className="ov-kpi-icon">📅</div>
              <div className="ov-kpi-value">{kpis.totalSeasons}</div>
              <div className="ov-kpi-label">Seasons</div>
            </div>
            <div className="ov-kpi-card">
              <div className="ov-kpi-icon">🏟️</div>
              <div className="ov-kpi-value">{kpis.totalVenues}</div>
              <div className="ov-kpi-label">Venues</div>
            </div>
            <div className="ov-kpi-card">
              <div className="ov-kpi-icon">⚡</div>
              <div className="ov-kpi-value ov-kpi-value--warm">{kpis.superOvers}</div>
              <div className="ov-kpi-label">Super Overs</div>
            </div>
          </div>
        )}

        {/* Bar Chart */}
        {chartData && (
          <div className="ov-chart-card">
            <h2 className="ov-chart-title">🏆 Most Successful Teams</h2>
            <Chart options={chartData.options} series={chartData.series} type="bar" height={360} />
          </div>
        )}

        {/* Recent Matches */}
        <h2 className="ov-section-title">Recent Matches</h2>
        <div className="ov-recent-grid">
          {recentMatches.map((m) => (
            <div className="ov-match-card" key={m.id}>
              <div className="ov-match-logos">
                <img className="ov-match-logo" src={getTeamLogo(m.team1)} alt="" />
                <span className="ov-match-vs">VS</span>
                <img className="ov-match-logo" src={getTeamLogo(m.team2)} alt="" />
              </div>
              <div className="ov-match-info">
                <div className="ov-match-teams">{m.team1} vs {m.team2}</div>
                <div className="ov-match-detail">{m.venue} • {m.date}</div>
              </div>
              {m.winner && <div className="ov-match-winner">🏆 {m.winner.split(" ").pop()}</div>}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
