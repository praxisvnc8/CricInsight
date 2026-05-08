import { useEffect, useMemo, useState } from "react";
import Chart from "react-apexcharts";
import { fetchMatches } from "../services/api";
import { getTeamLogo } from "../utils/teamLogos";
import type { ApexOptions } from "apexcharts";

/* ── Match shape ────────────────────────────────────────────────────────── */
interface Match {
  id: number; season: number; city: string | null; date: string;
  match_type: string | null; player_of_match: string | null; venue: string | null;
  team1: string; team2: string; toss_winner: string | null; toss_decision: string | null;
  winner: string | null; result: string | null; result_margin: number | null;
  target_runs: number | null; target_overs: number | null;
  super_over: string | null; method: string | null;
  umpire1: string | null; umpire2: string | null;
}

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  .ta-wrapper {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a0e1a 0%, #111827 40%, #0f172a 100%);
    padding: 2.5rem 2rem;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
  }
  .ta-heading {
    font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ta-subtitle { text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 2.5rem; }

  /* Team selector row */
  .ta-selector-row {
    display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; margin-bottom: 2.5rem;
  }
  .ta-select-group {
    display: flex; flex-direction: column; gap: 0.4rem; min-width: 280px;
  }
  .ta-select-label {
    font-size: 0.75rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.5px;
  }
  .ta-select-wrapper {
    display: flex; align-items: center; gap: 0.75rem;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 0.5rem 0.75rem;
    transition: border-color 0.2s;
  }
  .ta-select-wrapper:focus-within { border-color: rgba(0,198,255,0.3); }
  .ta-team-logo-sm { width: 32px; height: 32px; object-fit: contain; flex-shrink: 0; }
  .ta-select {
    flex: 1; background: transparent; border: none; color: #e2e8f0;
    font-size: 0.92rem; font-family: 'Inter', sans-serif; outline: none; cursor: pointer;
  }
  .ta-select option { background: #1e293b; color: #e2e8f0; }

  /* KPI grid */
  .ta-kpi-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem; max-width: 1000px; margin: 0 auto 2.5rem;
  }
  .ta-kpi-card {
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 18px; border: 1px solid rgba(255,255,255,0.06);
    padding: 1.5rem 1.25rem; text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .ta-kpi-card:hover {
    transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,114,255,0.12);
  }
  .ta-kpi-value {
    font-size: 2.2rem; font-weight: 800;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ta-kpi-value--warm {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .ta-kpi-label {
    margin-top: 0.4rem; font-size: 0.75rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.5px;
  }

  /* Section title */
  .ta-section { font-size: 1.1rem; font-weight: 600; color: #94a3b8; margin-bottom: 1rem; text-align: center; }

  /* H2H banner */
  .ta-h2h-banner {
    display: flex; align-items: center; justify-content: center;
    gap: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap;
  }
  .ta-h2h-team {
    display: flex; flex-direction: column; align-items: center; gap: 0.5rem;
  }
  .ta-h2h-logo { width: 64px; height: 64px; object-fit: contain; }
  .ta-h2h-name { font-size: 0.85rem; font-weight: 600; color: #cbd5e1; text-align: center; max-width: 120px; }
  .ta-h2h-wins { font-size: 2rem; font-weight: 800; }
  .ta-h2h-vs {
    font-size: 0.9rem; font-weight: 700; color: #475569;
    padding: 0.4rem 0.8rem; border-radius: 8px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
  }
  .ta-h2h-total { font-size: 0.78rem; color: #64748b; text-align: center; margin-bottom: 1.5rem; }

  /* Chart card */
  .ta-chart-card {
    max-width: 520px; margin: 0 auto;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 20px; border: 1px solid rgba(255,255,255,0.06);
    padding: 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
  }

  /* States */
  .ta-center { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
  .ta-error-box { display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 60vh; gap: 1rem; }
  .ta-retry-btn {
    padding: 0.65rem 1.8rem; border-radius: 10px; border: none;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    color: #1e1b4b; font-weight: 700; cursor: pointer; font-size: 0.9rem;
    font-family: 'Inter', sans-serif;
  }
  .ta-prompt { display: flex; justify-content: center; align-items: center; min-height: 20vh; color: #475569; font-style: italic; }
`;

/* ── Component ───────────────────────────────────────────────────────────── */
export default function TeamAnalysis() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [primaryTeam, setPrimaryTeam] = useState("");
  const [opponent, setOpponent] = useState("");

  const loadData = () => {
    setLoading(true); setError(null);
    fetchMatches()
      .then((data: Match[]) => setMatches(data))
      .catch(() => setError("Could not load match data. Is the backend running?"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const teams = useMemo(() => {
    const set = new Set<string>();
    matches.forEach((m) => { set.add(m.team1); set.add(m.team2); });
    return Array.from(set).sort();
  }, [matches]);

  useEffect(() => {
    if (teams.length >= 2 && !primaryTeam) { setPrimaryTeam(teams[0]); setOpponent(teams[1]); }
  }, [teams, primaryTeam]);

  const teamKpis = useMemo(() => {
    if (!primaryTeam) return null;
    const teamMatches = matches.filter((m) => m.team1 === primaryTeam || m.team2 === primaryTeam);
    const totalMatches = teamMatches.length;
    const totalWins = teamMatches.filter((m) => m.winner === primaryTeam).length;
    const winPct = totalMatches > 0 ? ((totalWins / totalMatches) * 100).toFixed(1) : "0.0";
    const tossWins = teamMatches.filter((m) => m.toss_winner === primaryTeam).length;
    const tossAndMatchWins = teamMatches.filter((m) => m.toss_winner === primaryTeam && m.winner === primaryTeam).length;
    const tossConversion = tossWins > 0 ? ((tossAndMatchWins / tossWins) * 100).toFixed(1) : "0.0";
    return { totalMatches, totalWins, winPct, tossConversion };
  }, [matches, primaryTeam]);

  const h2h = useMemo(() => {
    if (!primaryTeam || !opponent || primaryTeam === opponent) return null;
    const h2hMatches = matches.filter((m) =>
      (m.team1 === primaryTeam && m.team2 === opponent) || (m.team1 === opponent && m.team2 === primaryTeam)
    );
    const total = h2hMatches.length;
    const primaryWins = h2hMatches.filter((m) => m.winner === primaryTeam).length;
    const opponentWins = h2hMatches.filter((m) => m.winner === opponent).length;
    const noResult = total - primaryWins - opponentWins;
    return { total, primaryWins, opponentWins, noResult };
  }, [matches, primaryTeam, opponent]);

  const chartData = useMemo(() => {
    if (!h2h || h2h.total === 0) return null;
    const labels: string[] = [primaryTeam, opponent];
    const series = [h2h.primaryWins, h2h.opponentWins];
    if (h2h.noResult > 0) { labels.push("No Result"); series.push(h2h.noResult); }
    const options: ApexOptions = {
      chart: { type: "donut", background: "transparent", animations: { enabled: true, easing: "easeinout", speed: 600 } as any },
      theme: { mode: "dark" }, labels,
      colors: ["#00c6ff", "#f59e0b", "#475569"],
      stroke: { width: 3, colors: ["#0f172a"] },
      legend: { position: "bottom", labels: { colors: "#94a3b8" }, fontSize: "13px" },
      dataLabels: { enabled: true, style: { fontSize: "14px", fontWeight: 700 }, dropShadow: { enabled: false } },
      plotOptions: { pie: { donut: { size: "60%", labels: { show: true, name: { fontSize: "14px", color: "#cbd5e1" }, value: { fontSize: "24px", fontWeight: 800, color: "#e2e8f0" }, total: { show: true, label: "Total", fontSize: "13px", color: "#64748b" } } } } },
      tooltip: { theme: "dark" },
    };
    return { options, series };
  }, [h2h, primaryTeam, opponent]);

  if (loading) return (<><style>{css}</style><div className="ta-wrapper ta-center"><span style={{ opacity: 0.7 }}>⏳ Loading…</span></div></>);
  if (error) return (<><style>{css}</style><div className="ta-wrapper ta-error-box"><span style={{ color: "#f87171" }}>❌ {error}</span><button className="ta-retry-btn" onClick={loadData}>Retry</button></div></>);

  return (
    <>
      <style>{css}</style>
      <div className="ta-wrapper">
        <h1 className="ta-heading">Team Analysis</h1>
        <p className="ta-subtitle">Compare team performance and head-to-head records</p>

        {/* Selectors */}
        <div className="ta-selector-row">
          <div className="ta-select-group">
            <label className="ta-select-label">Primary Team</label>
            <div className="ta-select-wrapper">
              <img className="ta-team-logo-sm" src={getTeamLogo(primaryTeam)} alt="" />
              <select className="ta-select" value={primaryTeam} onChange={(e) => setPrimaryTeam(e.target.value)}>
                {teams.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="ta-select-group">
            <label className="ta-select-label">Opponent</label>
            <div className="ta-select-wrapper">
              <img className="ta-team-logo-sm" src={getTeamLogo(opponent)} alt="" />
              <select className="ta-select" value={opponent} onChange={(e) => setOpponent(e.target.value)}>
                {teams.filter((t) => t !== primaryTeam).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* KPIs */}
        {teamKpis && (
          <>
            <h2 className="ta-section" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
              <img src={getTeamLogo(primaryTeam)} alt="" style={{ width: 28, height: 28, objectFit: "contain" }} />
              {primaryTeam} — Overall Stats
            </h2>
            <div className="ta-kpi-grid">
              <div className="ta-kpi-card"><div className="ta-kpi-value">{teamKpis.totalMatches}</div><div className="ta-kpi-label">Matches Played</div></div>
              <div className="ta-kpi-card"><div className="ta-kpi-value">{teamKpis.totalWins}</div><div className="ta-kpi-label">Wins</div></div>
              <div className="ta-kpi-card"><div className="ta-kpi-value">{teamKpis.winPct}%</div><div className="ta-kpi-label">Win Percentage</div></div>
              <div className="ta-kpi-card"><div className="ta-kpi-value ta-kpi-value--warm">{teamKpis.tossConversion}%</div><div className="ta-kpi-label">Toss → Win Rate</div></div>
            </div>
          </>
        )}

        {/* H2H Section */}
        {primaryTeam === opponent ? (
          <div className="ta-prompt">Select two different teams to see head-to-head stats.</div>
        ) : h2h && h2h.total > 0 ? (
          <>
            <h2 className="ta-section" style={{ marginTop: "1rem" }}>Head-to-Head</h2>
            <div className="ta-h2h-banner">
              <div className="ta-h2h-team">
                <img className="ta-h2h-logo" src={getTeamLogo(primaryTeam)} alt="" />
                <div className="ta-h2h-name">{primaryTeam}</div>
                <div className="ta-h2h-wins" style={{ color: "#00c6ff" }}>{h2h.primaryWins}</div>
              </div>
              <div className="ta-h2h-vs">{h2h.total} matches</div>
              <div className="ta-h2h-team">
                <img className="ta-h2h-logo" src={getTeamLogo(opponent)} alt="" />
                <div className="ta-h2h-name">{opponent}</div>
                <div className="ta-h2h-wins" style={{ color: "#f59e0b" }}>{h2h.opponentWins}</div>
              </div>
            </div>
            {chartData && (
              <div className="ta-chart-card">
                <Chart options={chartData.options} series={chartData.series} type="donut" height={340} />
              </div>
            )}
          </>
        ) : (
          <div className="ta-prompt">No head-to-head matches found between these teams.</div>
        )}
      </div>
    </>
  );
}
