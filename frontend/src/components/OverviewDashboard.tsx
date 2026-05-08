import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { fetchMatches, fetchTossImpact, fetchScoreEvolution } from "../services/api";
import { getTeamLogo } from "../utils/teamLogos";
import type { ApexAxisChartSeries, ApexOptions } from "apexcharts";

/* ── Types ───────────────────────────────────────────────────────────────── */
interface Match {
  id: number; season: number; city: string | null; date: string;
  match_type: string | null; player_of_match: string | null; venue: string | null;
  team1: string; team2: string; toss_winner: string | null; toss_decision: string | null;
  winner: string | null; result: string | null; result_margin: number | null;
  target_runs: number | null; target_overs: number | null;
  super_over: string | null; method: string | null;
  umpire1: string | null; umpire2: string | null;
}
interface TossImpact { bat_total: number; bat_wins: number; field_total: number; field_wins: number; }
interface SeasonScore { season: number; avg_score: number; match_count: number; }

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  .ov-wrapper {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a0e1a 0%, #111827 40%, #0f172a 100%);
    padding: 2.5rem 2rem;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
  }
  .ov-heading {
    font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ov-subtitle { text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 2.5rem; }

  /* ── KPI grid ──────────────────────────────────────────────────────────── */
  .ov-kpi-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem; max-width: 1100px; margin: 0 auto 2.5rem;
  }
  .ov-kpi-card {
    background: rgba(255,255,255,0.04); backdrop-filter: blur(18px);
    border-radius: 18px; border: 1px solid rgba(255,255,255,0.06);
    padding: 1.5rem 1.25rem; text-align: center;
    transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    position: relative; overflow: hidden;
  }
  .ov-kpi-card::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(0,198,255,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .ov-kpi-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 36px rgba(0,114,255,0.12);
    border-color: rgba(0,198,255,0.15);
  }
  .ov-kpi-icon { font-size: 1.5rem; margin-bottom: 0.4rem; }
  .ov-kpi-value {
    font-size: 2.4rem; font-weight: 800; line-height: 1.1;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ov-kpi-value--warm {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ov-kpi-value--green {
    background: linear-gradient(135deg, #10b981, #34d399);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ov-kpi-label {
    margin-top: 0.4rem; font-size: 0.72rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.5px;
  }

  /* ── Glass card (shared) ───────────────────────────────────────────────── */
  .ov-glass {
    background: rgba(255,255,255,0.03); backdrop-filter: blur(18px);
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
    padding: 1.75rem; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  .ov-glass:hover {
    border-color: rgba(0,198,255,0.1);
    box-shadow: 0 6px 32px rgba(0,0,0,0.25);
  }

  /* ── Charts layout ─────────────────────────────────────────────────────── */
  .ov-charts-row {
    display: grid; grid-template-columns: 3fr 2fr;
    gap: 1.5rem; max-width: 1100px; margin: 0 auto 2rem;
  }
  @media (max-width: 860px) { .ov-charts-row { grid-template-columns: 1fr; } }
  .ov-area-row { max-width: 1100px; margin: 0 auto 2.5rem; }

  .ov-chart-title {
    font-size: 0.95rem; font-weight: 600; color: #94a3b8;
    margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;
  }
  .ov-chart-title-icon { font-size: 1.1rem; }

  /* ── Section title ─────────────────────────────────────────────────────── */
  .ov-section-title {
    font-size: 1.05rem; font-weight: 600; color: #94a3b8;
    margin-bottom: 1.25rem; max-width: 1100px; margin-left: auto; margin-right: auto;
    display: flex; align-items: center; gap: 0.5rem;
  }

  /* ── Recent match cards ────────────────────────────────────────────────── */
  .ov-recent-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1rem; max-width: 1100px; margin: 0 auto;
  }
  .ov-match-card {
    background: rgba(255,255,255,0.03); backdrop-filter: blur(14px);
    border-radius: 16px; border: 1px solid rgba(255,255,255,0.05);
    padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.75rem;
    transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
  }
  .ov-match-card:hover {
    transform: translateY(-3px); border-color: rgba(0,198,255,0.15);
    box-shadow: 0 6px 24px rgba(0,0,0,0.2);
  }
  .ov-match-top {
    display: flex; align-items: center; justify-content: space-between;
  }
  .ov-match-team {
    display: flex; align-items: center; gap: 0.6rem; flex: 1;
  }
  .ov-match-logo { width: 40px; height: 40px; object-fit: contain; }
  .ov-match-tname {
    font-size: 0.82rem; font-weight: 600; color: #cbd5e1;
    line-height: 1.2; max-width: 110px;
  }
  .ov-match-vs {
    font-size: 0.7rem; font-weight: 700; color: #475569;
    padding: 0.2rem 0.5rem; border-radius: 6px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.05);
    flex-shrink: 0;
  }
  .ov-match-bottom {
    display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  }
  .ov-match-venue {
    font-size: 0.72rem; color: #64748b; flex: 1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ov-match-result-badge {
    font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.65rem;
    border-radius: 8px; white-space: nowrap;
  }
  .ov-match-result-badge--win {
    background: rgba(16,185,129,0.12); border: 1px solid rgba(16,185,129,0.2); color: #34d399;
  }
  .ov-match-result-badge--no {
    background: rgba(100,116,139,0.12); border: 1px solid rgba(100,116,139,0.2); color: #94a3b8;
  }

  /* ── States ────────────────────────────────────────────────────────────── */
  .ov-center { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
  .ov-error-box { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 60vh; gap: 1rem; }
  .ov-retry-btn {
    padding: 0.65rem 1.8rem; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e1b4b; font-weight: 700; cursor: pointer; font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
  }
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function formatResult(m: Match): string {
  if (!m.winner) return "No Result";
  if (m.result === "runs") return `Won by ${m.result_margin} runs`;
  if (m.result === "wickets") return `Won by ${m.result_margin} wkts`;
  if (m.super_over?.trim().toUpperCase() === "Y") return "Won (Super Over)";
  return `Won by ${m.winner.split(" ").pop()}`;
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function OverviewDashboard() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [tossData, setTossData] = useState<TossImpact | null>(null);
  const [scoreData, setScoreData] = useState<SeasonScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true); setError(null);
    Promise.all([fetchMatches(), fetchTossImpact(), fetchScoreEvolution()])
      .then(([m, t, s]) => { setMatches(m); setTossData(t); setScoreData(s); })
      .catch(() => setError("Could not load dashboard data. Is the backend running?"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  /* ── KPIs ──────────────────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    if (matches.length === 0) return null;
    const totalMatches = matches.length;
    const totalSeasons = new Set(matches.map((m) => m.season)).size;
    const totalVenues = new Set(matches.map((m) => m.venue).filter(Boolean)).size;
    const superOvers = matches.filter((m) => m.super_over?.trim().toUpperCase() === "Y").length;
    const uniqueTeams = new Set<string>();
    matches.forEach((m) => { uniqueTeams.add(m.team1); uniqueTeams.add(m.team2); });
    return { totalMatches, totalSeasons, totalVenues, superOvers, totalTeams: uniqueTeams.size };
  }, [matches]);

  /* ── Top-5 Teams Bar Chart (gradient bars) ─────────────────────────────── */
  const barChart = useMemo(() => {
    if (matches.length === 0) return null;
    const winCount: Record<string, number> = {};
    matches.forEach((m) => { if (m.winner) winCount[m.winner] = (winCount[m.winner] || 0) + 1; });
    const sorted = Object.entries(winCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const categories = sorted.map(([team]) => team);
    const values = sorted.map(([, count]) => count);

    const options: ApexOptions = {
      chart: { type: "bar", background: "transparent", toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 700 } as any },
      theme: { mode: "dark" },
      plotOptions: { bar: { borderRadius: 8, columnWidth: "55%", distributed: true } },
      fill: {
        type: "gradient",
        gradient: { shade: "dark", type: "vertical", shadeIntensity: 0.3, gradientToColors: ["#0072ff", "#7c3aed", "#34d399", "#fbbf24", "#f87171", "#06b6d4"], inverseColors: false, opacityFrom: 0.95, opacityTo: 0.6, stops: [0, 100] },
      },
      colors: ["#00c6ff", "#a78bfa", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"],
      dataLabels: { enabled: true, style: { fontSize: "12px", fontWeight: 700 }, formatter: (v: number) => v.toString() },
      xaxis: { categories, labels: { style: { colors: "#64748b", fontSize: "10px" }, rotate: -20 } },
      yaxis: { labels: { style: { colors: "#475569" } } },
      grid: { show: false },
      legend: { show: false },
      tooltip: {
        theme: "dark",
        custom: ({ series, seriesIndex, dataPointIndex }: any) => {
          const team = categories[dataPointIndex];
          const wins = series[seriesIndex][dataPointIndex];
          return `<div style="padding:8px 12px;background:#1e293b;border-radius:8px;border:1px solid rgba(255,255,255,0.1)">
            <div style="font-weight:700;color:#e2e8f0;margin-bottom:2px">${team}</div>
            <div style="color:#94a3b8;font-size:0.8rem">${wins} victories</div></div>`;
        },
      },
    };
    return { options, series: [{ name: "Wins", data: values }] };
  }, [matches]);

  /* ── Toss Decision Donut Chart ─────────────────────────────────────────── */
  const tossChart = useMemo((): { options: ApexOptions; series: number[] } | null => {
    if (!tossData) return null;
    const batWinPct = tossData.bat_total > 0 ? Math.round((tossData.bat_wins / tossData.bat_total) * 100) : 0;
    const fieldWinPct = tossData.field_total > 0 ? Math.round((tossData.field_wins / tossData.field_total) * 100) : 0;
    return {
      series: [batWinPct, fieldWinPct],
      options: {
        chart: { type: "donut", background: "transparent" },
        theme: { mode: "dark" },
        labels: [`Bat First (${batWinPct}%)`, `Field First (${fieldWinPct}%)`],
        colors: ["#f59e0b", "#7c3aed"],
        stroke: { width: 3, colors: ["#0f172a"] },
        legend: { position: "bottom", labels: { colors: "#94a3b8" }, fontSize: "12px" },
        dataLabels: { enabled: true, style: { fontSize: "14px", fontWeight: 700 }, dropShadow: { enabled: false },
          formatter: (v: number) => `${v.toFixed(0)}%` },
        plotOptions: { pie: { donut: { size: "62%", labels: { show: true,
          name: { fontSize: "13px", color: "#cbd5e1" },
          value: { fontSize: "22px", fontWeight: 800, color: "#e2e8f0", formatter: (v: string) => `${v}%` },
          total: { show: true, label: "Win Rate", fontSize: "12px", color: "#64748b",
            formatter: () => `${Math.round((batWinPct + fieldWinPct) / 2)}%` } } } } },
        tooltip: { theme: "dark" },
      },
    };
  }, [tossData]);

  /* ── Score Evolution Area Chart ─────────────────────────────────────────── */
  const areaChart = useMemo((): { options: ApexOptions; series: ApexAxisChartSeries } | null => {
    if (scoreData.length === 0) return null;
    return {
      series: [{ name: "Avg 1st Innings Score", data: scoreData.map((s) => s.avg_score) }],
      options: {
        chart: { type: "area", background: "transparent", toolbar: { show: false }, zoom: { enabled: false },
          animations: { enabled: true, easing: "easeinout", speed: 600 } as any },
        theme: { mode: "dark" },
        colors: ["#00c6ff"],
        fill: { type: "gradient", gradient: { shadeIntensity: 0.4, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 95] } },
        stroke: { curve: "smooth", width: 3 },
        dataLabels: { enabled: false },
        xaxis: { categories: scoreData.map((s) => s.season.toString()),
          labels: { style: { colors: "#64748b", fontSize: "11px" }, rotate: -45 },
          axisBorder: { show: false }, axisTicks: { show: false } },
        yaxis: { labels: { style: { colors: "#475569" }, formatter: (v: number) => Math.round(v).toString() },
          min: (min: number) => Math.floor(min - 5) },
        grid: { borderColor: "rgba(255,255,255,0.04)", strokeDashArray: 3 },
        tooltip: { theme: "dark", x: { show: true }, y: { formatter: (v: number) => `${v} runs` } },
        markers: { size: 4, colors: ["#00c6ff"], strokeWidth: 0, hover: { size: 7 } },
      },
    };
  }, [scoreData]);

  /* ── Recent 8 matches ──────────────────────────────────────────────────── */
  const recentMatches = useMemo(() => matches.slice(0, 8), [matches]);

  /* ── Render ────────────────────────────────────────────────────────────── */
  if (loading) return (<><style>{css}</style><div className="ov-wrapper ov-center"><span style={{ opacity: 0.7 }}>⏳ Loading dashboard…</span></div></>);
  if (error) return (<><style>{css}</style><div className="ov-wrapper ov-error-box"><span style={{ color: "#f87171" }}>❌ {error}</span><button className="ov-retry-btn" onClick={loadData}>Retry</button></div></>);

  return (
    <>
      <style>{css}</style>
      <div className="ov-wrapper">
        <h1 className="ov-heading">IPL Overview Dashboard</h1>
        <p className="ov-subtitle">Comprehensive analytics across all IPL seasons (2008–2024)</p>

        {/* ═══ KPI Cards ═══ */}
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
              <div className="ov-kpi-icon">🏷️</div>
              <div className="ov-kpi-value ov-kpi-value--green">{kpis.totalTeams}</div>
              <div className="ov-kpi-label">Teams</div>
            </div>
            <div className="ov-kpi-card">
              <div className="ov-kpi-icon">⚡</div>
              <div className="ov-kpi-value ov-kpi-value--warm">{kpis.superOvers}</div>
              <div className="ov-kpi-label">Super Overs</div>
            </div>
          </div>
        )}

        {/* ═══ Charts Row: Bar + Donut ═══ */}
        <div className="ov-charts-row">
          {barChart && (
            <div className="ov-glass">
              <div className="ov-chart-title"><span className="ov-chart-title-icon">🏆</span> Most Successful Teams</div>
              <Chart options={barChart.options} series={barChart.series} type="bar" height={340} />
            </div>
          )}
          {tossChart && (
            <div className="ov-glass">
              <div className="ov-chart-title"><span className="ov-chart-title-icon">🪙</span> Toss Decision Impact</div>
              <Chart options={tossChart.options} series={tossChart.series} type="donut" height={340} />
            </div>
          )}
        </div>

        {/* ═══ Score Evolution Area Chart ═══ */}
        {areaChart && (
          <div className="ov-area-row ov-glass">
            <div className="ov-chart-title"><span className="ov-chart-title-icon">📈</span> Evolution of 1st Innings Score</div>
            <Chart options={areaChart.options} series={areaChart.series} type="area" height={300} />
          </div>
        )}

        {/* ═══ Recent Matches ═══ */}
        <div className="ov-section-title">🏏 Recent Matches</div>
        <div className="ov-recent-grid">
          {recentMatches.map((m) => (
            <div className="ov-match-card" key={m.id}>
              <div className="ov-match-top">
                <div className="ov-match-team">
                  <img className="ov-match-logo" src={getTeamLogo(m.team1)} alt="" />
                  <span className="ov-match-tname">{m.team1}</span>
                </div>
                <span className="ov-match-vs">VS</span>
                <div className="ov-match-team" style={{ justifyContent: "flex-end", textAlign: "right" }}>
                  <span className="ov-match-tname">{m.team2}</span>
                  <img className="ov-match-logo" src={getTeamLogo(m.team2)} alt="" />
                </div>
              </div>
              <div className="ov-match-bottom">
                <span className="ov-match-venue">{m.venue} • {m.date}</span>
                <span className={`ov-match-result-badge ${m.winner ? "ov-match-result-badge--win" : "ov-match-result-badge--no"}`}>
                  {formatResult(m)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
