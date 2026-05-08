import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { fetchTopBatsmen, fetchTopBowlers, fetchPlayerStats } from "../services/api";
import { getPlayerAvatar } from "../utils/teamLogos";
import type { ApexAxisChartSeries, ApexOptions } from "apexcharts";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Batsman {
  batter: string; career_runs: number; career_innings: number;
  career_balls: number; career_fours: number; career_sixes: number;
}
interface Bowler {
  bowler: string; career_wickets: number; career_matches: number;
  career_runs_conceded: number; career_balls: number;
}
interface PlayerStats {
  player: string; total_innings: number; total_runs: number;
  total_balls_faced: number; total_fours: number; total_sixes: number;
  total_wickets: number; total_matches: number;
  total_runs_conceded: number; total_balls_bowled: number;
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  .pa-wrapper {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a0e1a 0%, #111827 40%, #0f172a 100%);
    padding: 2.5rem 2rem;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
  }
  .pa-heading {
    font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .pa-subtitle { text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 2.5rem; }

  /* Charts row */
  .pa-charts-row {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    gap: 1.5rem; max-width: 1100px; margin: 0 auto 3rem;
  }
  .pa-chart-card {
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
    padding: 1.75rem; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }
  .pa-chart-title {
    font-size: 1rem; font-weight: 600; color: #94a3b8; margin-bottom: 0.75rem;
  }

  /* Search section */
  .pa-search-section { max-width: 600px; margin: 0 auto 2rem; }
  .pa-section-heading {
    font-size: 1.15rem; font-weight: 600; color: #94a3b8;
    text-align: center; margin-bottom: 1rem;
  }
  .pa-search-row { display: flex; gap: 0.75rem; }
  .pa-input {
    flex: 1; padding: 0.75rem 1rem; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04); color: #e2e8f0;
    font-size: 0.95rem; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s;
  }
  .pa-input:focus { border-color: rgba(0,198,255,0.3); }
  .pa-search-btn {
    padding: 0.75rem 1.5rem; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer;
    white-space: nowrap; font-family: 'Inter', sans-serif;
    transition: opacity 0.2s;
  }
  .pa-search-btn:disabled { opacity: 0.6; pointer-events: none; }

  /* Player card */
  .pa-player-card {
    max-width: 600px; margin: 1.5rem auto 0;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
    padding: 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    text-align: center;
  }
  .pa-player-avatar {
    width: 80px; height: 80px; border-radius: 50%;
    border: 3px solid rgba(0,198,255,0.3);
    margin: 0 auto 0.75rem; display: block;
    box-shadow: 0 0 20px rgba(0,198,255,0.15);
  }
  .pa-player-name {
    font-size: 1.4rem; font-weight: 800;
    background: linear-gradient(90deg, #00c6ff, #0072ff);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  .pa-badge {
    display: inline-block; padding: 0.3rem 0.9rem; border-radius: 20px;
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; margin-bottom: 1.25rem;
  }
  .pa-badge--allrounder {
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399;
  }
  .pa-badge--specialist {
    background: rgba(100,116,139,0.15); border: 1px solid rgba(100,116,139,0.2); color: #94a3b8;
  }
  .pa-stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;
  }
  .pa-stat-value { font-size: 1.4rem; font-weight: 800; color: #e2e8f0; }
  .pa-stat-label {
    font-size: 0.68rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1px; margin-top: 0.2rem;
  }

  /* States */
  .pa-center { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
  .pa-error-box { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 60vh; gap: 1rem; }
  .pa-retry-btn {
    padding: 0.65rem 1.8rem; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e1b4b; font-weight: 700; cursor: pointer; font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
  }
  .pa-inline-msg { text-align: center; margin-top: 1rem; font-size: 0.9rem; color: #64748b; font-style: italic; }
  .pa-inline-error { text-align: center; margin-top: 1rem; font-size: 0.9rem; color: #f87171; }
`;

/* ── Component ───────────────────────────────────────────────────────────── */
export default function PlayerAnalysis() {
  const [batsmen, setBatsmen] = useState<Batsman[]>([]);
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchedPlayer, setSearchedPlayer] = useState<PlayerStats | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadTopPerformers = () => {
    setLoading(true); setError(null);
    Promise.all([fetchTopBatsmen(), fetchTopBowlers()])
      .then(([b, w]) => { setBatsmen(b); setBowlers(w); })
      .catch(() => setError("Could not load player data. Is the backend running?"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadTopPerformers(); }, []);

  const handleSearch = () => {
    const name = searchInput.trim();
    if (!name) return;
    setSearchLoading(true); setSearchError(null); setSearchedPlayer(null);
    fetchPlayerStats(name)
      .then((data: PlayerStats) => setSearchedPlayer(data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setSearchError(`Player "${name}" not found. Try names like "V Kohli", "RG Sharma", or "JJ Bumrah".`);
        } else {
          setSearchError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setSearchLoading(false));
  };

  const batsmenChart = (): { options: ApexOptions; series: ApexAxisChartSeries } => {
    const top10 = batsmen.slice(0, 10);
    return {
      options: {
        chart: { type: "bar", background: "transparent", toolbar: { show: false } },
        theme: { mode: "dark" },
        plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: "65%" } },
        colors: ["#00c6ff", "#0072ff", "#7c3aed", "#f59e0b", "#10b981", "#ec4899", "#06b6d4", "#8b5cf6", "#f97316", "#14b8a6"],
        xaxis: { categories: top10.map((b) => b.batter), labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        grid: { borderColor: "rgba(255,255,255,0.04)" },
        legend: { show: false },
        dataLabels: { enabled: true, style: { fontSize: "11px" } },
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
        plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: "65%" } },
        colors: ["#f59e0b", "#ef4444", "#10b981", "#0072ff", "#7c3aed", "#ec4899", "#06b6d4", "#8b5cf6", "#f97316", "#14b8a6"],
        xaxis: { categories: top10.map((b) => b.bowler), labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        yaxis: { labels: { style: { colors: "#64748b", fontSize: "11px" } } },
        grid: { borderColor: "rgba(255,255,255,0.04)" },
        legend: { show: false },
        dataLabels: { enabled: true, style: { fontSize: "11px" } },
        tooltip: { theme: "dark" },
      },
      series: [{ name: "Career Wickets", data: top10.map((b) => b.career_wickets) }],
    };
  };

  const computeDerived = (p: PlayerStats) => {
    const strikeRate = p.total_balls_faced > 0 ? ((p.total_runs / p.total_balls_faced) * 100).toFixed(1) : "—";
    const battingAvg = p.total_innings > 0 ? (p.total_runs / p.total_innings).toFixed(1) : "—";
    const economy = p.total_balls_bowled > 0 ? (p.total_runs_conceded / (p.total_balls_bowled / 6)).toFixed(2) : "—";
    const isAllRounder = p.total_runs > 500 && p.total_wickets > 30;
    return { strikeRate, battingAvg, economy, isAllRounder };
  };

  if (loading) return (<><style>{css}</style><div className="pa-wrapper pa-center"><span style={{ opacity: 0.7 }}>⏳ Loading player data…</span></div></>);
  if (error) return (<><style>{css}</style><div className="pa-wrapper pa-error-box"><span style={{ color: "#f87171" }}>❌ {error}</span><button className="pa-retry-btn" onClick={loadTopPerformers}>Retry</button></div></>);

  const batChart = batsmenChart();
  const bowlChart = bowlersChart();

  return (
    <>
      <style>{css}</style>
      <div className="pa-wrapper">
        <h1 className="pa-heading">Player Analysis</h1>
        <p className="pa-subtitle">Top performers and searchable career statistics</p>

        {/* Charts */}
        <div className="pa-charts-row">
          <div className="pa-chart-card">
            <h3 className="pa-chart-title">🏅 Top 10 Run Scorers</h3>
            <Chart options={batChart.options} series={batChart.series} type="bar" height={380} />
          </div>
          <div className="pa-chart-card">
            <h3 className="pa-chart-title">🎯 Top 10 Wicket Takers</h3>
            <Chart options={bowlChart.options} series={bowlChart.series} type="bar" height={380} />
          </div>
        </div>

        {/* Search */}
        <div className="pa-search-section">
          <h2 className="pa-section-heading">🔍 Player Search</h2>
          <div className="pa-search-row">
            <input
              className="pa-input"
              type="text"
              placeholder='Enter player name (e.g. "V Kohli")'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="pa-search-btn" disabled={searchLoading} onClick={handleSearch}>
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>

          {searchLoading && <p className="pa-inline-msg">⏳ Searching…</p>}
          {searchError && <p className="pa-inline-error">⚠️ {searchError}</p>}

          {searchedPlayer && (() => {
            const d = computeDerived(searchedPlayer);
            return (
              <div className="pa-player-card">
                <img
                  className="pa-player-avatar"
                  src={getPlayerAvatar(searchedPlayer.player)}
                  alt={searchedPlayer.player}
                />
                <h3 className="pa-player-name">{searchedPlayer.player}</h3>
                <span className={`pa-badge ${d.isAllRounder ? "pa-badge--allrounder" : "pa-badge--specialist"}`}>
                  {d.isAllRounder ? "⭐ All-Rounder" : "Specialist"}
                </span>
                <div className="pa-stats-grid">
                  <div><div className="pa-stat-value">{searchedPlayer.total_runs.toLocaleString()}</div><div className="pa-stat-label">Total Runs</div></div>
                  <div><div className="pa-stat-value">{searchedPlayer.total_wickets}</div><div className="pa-stat-label">Wickets</div></div>
                  <div><div className="pa-stat-value">{searchedPlayer.total_innings}</div><div className="pa-stat-label">Innings</div></div>
                  <div><div className="pa-stat-value">{d.strikeRate}</div><div className="pa-stat-label">Strike Rate</div></div>
                  <div><div className="pa-stat-value">{d.battingAvg}</div><div className="pa-stat-label">Batting Avg</div></div>
                  <div><div className="pa-stat-value">{d.economy}</div><div className="pa-stat-label">Economy</div></div>
                  <div><div className="pa-stat-value">{searchedPlayer.total_fours}</div><div className="pa-stat-label">Fours</div></div>
                  <div><div className="pa-stat-value">{searchedPlayer.total_sixes}</div><div className="pa-stat-label">Sixes</div></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
