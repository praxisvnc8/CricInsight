import { useEffect, useMemo, useRef, useState } from "react";
import { fetchTopBatsmen, fetchTopBowlers, fetchPlayerStats, fetchPlayerList } from "../services/api";
import { getPlayerAvatar } from "../utils/teamLogos";

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

  /* ── Hall of Fame columns ──────────────────────────────────────────────── */
  .pa-hof-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 2rem; max-width: 1100px; margin: 0 auto 3rem;
  }
  @media (max-width: 768px) { .pa-hof-grid { grid-template-columns: 1fr; } }

  .pa-column { display: flex; flex-direction: column; gap: 0; }
  .pa-col-header {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.8rem 1.25rem; border-radius: 14px 14px 0 0;
    font-size: 0.95rem; font-weight: 700; letter-spacing: 0.5px;
  }
  .pa-col-header--orange {
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08));
    border: 1px solid rgba(245,158,11,0.2); border-bottom: none; color: #fbbf24;
  }
  .pa-col-header--purple {
    background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(139,92,246,0.08));
    border: 1px solid rgba(124,58,237,0.2); border-bottom: none; color: #a78bfa;
  }
  .pa-col-header-icon { font-size: 1.3rem; }

  /* ── Marquee (No.1) card ───────────────────────────────────────────────── */
  .pa-marquee {
    display: flex; align-items: center; gap: 1.25rem;
    padding: 1.5rem; position: relative;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .pa-marquee:hover {
    transform: translateY(-3px);
  }
  .pa-marquee--orange {
    border: 1px solid rgba(245,158,11,0.2); border-top: none;
    box-shadow: inset 0 0 30px rgba(245,158,11,0.04);
  }
  .pa-marquee--orange:hover { box-shadow: 0 8px 32px rgba(245,158,11,0.1); }
  .pa-marquee--purple {
    border: 1px solid rgba(124,58,237,0.2); border-top: none;
    box-shadow: inset 0 0 30px rgba(124,58,237,0.04);
  }
  .pa-marquee--purple:hover { box-shadow: 0 8px 32px rgba(124,58,237,0.1); }

  .pa-marquee-rank {
    font-size: 2.5rem; font-weight: 900; line-height: 1;
    opacity: 0.15; position: absolute; top: 0.5rem; right: 1rem;
  }
  .pa-marquee-avatar {
    width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
    box-shadow: 0 0 20px rgba(0,0,0,0.3);
  }
  .pa-marquee-avatar--orange { border: 3px solid rgba(245,158,11,0.4); }
  .pa-marquee-avatar--purple { border: 3px solid rgba(124,58,237,0.4); }

  .pa-marquee-info { flex: 1; }
  .pa-marquee-name { font-size: 1.15rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.2rem; }
  .pa-marquee-stat { font-size: 1.8rem; font-weight: 800; line-height: 1; }
  .pa-marquee-stat--orange {
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .pa-marquee-stat--purple {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .pa-marquee-stat-label {
    font-size: 0.7rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1.2px; margin-top: 0.25rem;
  }
  .pa-marquee-extras {
    display: flex; gap: 1rem; margin-top: 0.5rem;
  }
  .pa-marquee-extra {
    font-size: 0.75rem; color: #94a3b8;
  }
  .pa-marquee-extra strong { color: #cbd5e1; font-weight: 700; }

  /* ── Leaderboard list ──────────────────────────────────────────────────── */
  .pa-list {
    border-radius: 0 0 14px 14px; overflow: hidden;
  }
  .pa-list--orange { border: 1px solid rgba(245,158,11,0.12); border-top: none; }
  .pa-list--purple { border: 1px solid rgba(124,58,237,0.12); border-top: none; }

  .pa-list-row {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.65rem 1.25rem;
    background: rgba(255,255,255,0.02);
    border-bottom: 1px solid rgba(255,255,255,0.03);
    transition: background 0.2s;
  }
  .pa-list-row:last-child { border-bottom: none; }
  .pa-list-row:hover { background: rgba(255,255,255,0.05); }

  .pa-list-rank {
    width: 1.5rem; font-size: 0.8rem; font-weight: 700; color: #475569; text-align: center;
  }
  .pa-list-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.06);
  }
  .pa-list-name {
    flex: 1; font-size: 0.85rem; font-weight: 500; color: #cbd5e1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pa-list-stat { font-size: 0.9rem; font-weight: 700; min-width: 3.5rem; text-align: right; }
  .pa-list-stat--orange { color: #fbbf24; }
  .pa-list-stat--purple { color: #a78bfa; }
  .pa-list-stat-unit { font-size: 0.65rem; color: #64748b; font-weight: 500; margin-left: 0.2rem; }

  /* ── Divider ───────────────────────────────────────────────────────────── */
  .pa-divider {
    max-width: 1100px; margin: 0 auto 2.5rem;
    border: none; border-top: 1px solid rgba(255,255,255,0.06);
  }

  /* ── Search section ────────────────────────────────────────────────────── */
  .pa-search-section { max-width: 640px; margin: 0 auto 2rem; }
  .pa-section-heading {
    font-size: 1.15rem; font-weight: 600; color: #94a3b8;
    text-align: center; margin-bottom: 1rem;
  }
  .pa-search-row { display: flex; gap: 0.75rem; position: relative; }
  .pa-ac-wrap { flex: 1; position: relative; }
  .pa-input {
    width: 100%; padding: 0.75rem 1.25rem; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04); color: #e2e8f0;
    font-size: 0.95rem; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s; box-sizing: border-box;
  }
  .pa-input:focus { border-color: rgba(0,198,255,0.3); }
  .pa-ac-dropdown {
    position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50;
    background: rgba(15,23,42,0.96); backdrop-filter: blur(20px);
    border: 1px solid rgba(0,198,255,0.15); border-radius: 12px;
    max-height: 320px; overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .pa-ac-item {
    padding: 0.65rem 1rem; cursor: pointer; font-size: 0.88rem; color: #cbd5e1;
    display: flex; align-items: center; gap: 0.6rem;
    transition: background 0.15s;
  }
  .pa-ac-item:first-child { border-radius: 12px 12px 0 0; }
  .pa-ac-item:last-child { border-radius: 0 0 12px 12px; }
  .pa-ac-item:hover { background: rgba(0,198,255,0.08); color: #fff; }
  .pa-ac-item img { width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.08); }
  .pa-search-btn {
    padding: 0.75rem 1.5rem; border-radius: 12px; border: none;
    background: linear-gradient(135deg, #00c6ff, #0072ff);
    color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer;
    white-space: nowrap; font-family: 'Inter', sans-serif;
    transition: opacity 0.2s;
  }
  .pa-search-btn:disabled { opacity: 0.6; pointer-events: none; }

  /* ── Player career card ────────────────────────────────────────────────── */
  .pa-career-card {
    max-width: 640px; margin: 1.5rem auto 0;
    background: rgba(255,255,255,0.04); backdrop-filter: blur(16px);
    border-radius: 20px; border: 1px solid rgba(0,198,255,0.12);
    padding: 2rem; box-shadow: 0 4px 24px rgba(0,0,0,0.2);
    text-align: center;
  }
  .pa-career-avatar {
    width: 88px; height: 88px; border-radius: 50%;
    border: 3px solid rgba(0,198,255,0.3); margin: 0 auto 0.75rem; display: block;
    box-shadow: 0 0 24px rgba(0,198,255,0.12);
  }
  .pa-career-name {
    font-size: 1.5rem; font-weight: 800;
    background: linear-gradient(90deg, #00c6ff, #0072ff);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
  }
  .pa-career-badge {
    display: inline-block; padding: 0.3rem 0.9rem; border-radius: 20px;
    font-size: 0.75rem; font-weight: 700; letter-spacing: 0.8px;
    text-transform: uppercase; margin-bottom: 1.5rem;
  }
  .pa-career-badge--allrounder {
    background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #34d399;
  }
  .pa-career-badge--specialist {
    background: rgba(100,116,139,0.15); border: 1px solid rgba(100,116,139,0.2); color: #94a3b8;
  }
  .pa-career-stats {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 1rem;
  }
  .pa-career-stat-val { font-size: 1.5rem; font-weight: 800; color: #e2e8f0; }
  .pa-career-stat-lbl {
    font-size: 0.68rem; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 1px; margin-top: 0.2rem;
  }

  /* ── States ────────────────────────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function PlayerAnalysis() {
  const [batsmen, setBatsmen] = useState<Batsman[]>([]);
  const [bowlers, setBowlers] = useState<Bowler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [searchedPlayer, setSearchedPlayer] = useState<PlayerStats | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [playerList, setPlayerList] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const acRef = useRef<HTMLDivElement>(null);

  const loadTopPerformers = () => {
    setLoading(true); setError(null);
    Promise.all([fetchTopBatsmen(), fetchTopBowlers()])
      .then(([b, w]) => { setBatsmen(b); setBowlers(w); })
      .catch(() => setError("Could not load player data. Is the backend running?"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadTopPerformers(); }, []);

  useEffect(() => {
    fetchPlayerList().then(setPlayerList).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const suggestions = useMemo(() => {
    const term = searchInput.trim().toLowerCase();
    if (!term || term.length < 1) return [];
    return playerList.filter(p => p.toLowerCase().includes(term)).slice(0, 10);
  }, [searchInput, playerList]);

  const handleSearch = (nameOverride?: string) => {
    const name = (nameOverride ?? searchInput).trim();
    if (!name) return;
    setShowSuggestions(false);
    setSearchLoading(true); setSearchError(null); setSearchedPlayer(null);
    fetchPlayerStats(name)
      .then((data: PlayerStats) => setSearchedPlayer(data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setSearchError(`Player "${name}" not found. Try "V Kohli", "RG Sharma", or "JJ Bumrah".`);
        } else {
          setSearchError("Something went wrong. Please try again.");
        }
      })
      .finally(() => setSearchLoading(false));
  };

  const handleSelectSuggestion = (name: string) => {
    setSearchInput(name);
    setShowSuggestions(false);
    handleSearch(name);
  };

  const computeDerived = (p: PlayerStats) => {
    const strikeRate = p.total_balls_faced > 0 ? ((p.total_runs / p.total_balls_faced) * 100).toFixed(1) : "—";
    const battingAvg = p.total_innings > 0 ? (p.total_runs / p.total_innings).toFixed(1) : "—";
    const economy = p.total_balls_bowled > 0 ? (p.total_runs_conceded / (p.total_balls_bowled / 6)).toFixed(2) : "—";
    const isAllRounder = p.total_runs > 500 && p.total_wickets > 30;
    return { strikeRate, battingAvg, economy, isAllRounder };
  };

  /* ── Loading / Error ──────────────────────────────────────────────────── */
  if (loading) return (<><style>{css}</style><div className="pa-wrapper pa-center"><span style={{ opacity: 0.7 }}>⏳ Loading player data…</span></div></>);
  if (error) return (<><style>{css}</style><div className="pa-wrapper pa-error-box"><span style={{ color: "#f87171" }}>❌ {error}</span><button className="pa-retry-btn" onClick={loadTopPerformers}>Retry</button></div></>);

  const topBat = batsmen.slice(0, 10);
  const topBowl = bowlers.slice(0, 10);
  const bat1 = topBat[0];
  const bowl1 = topBowl[0];
  const batRest = topBat.slice(1);
  const bowlRest = topBowl.slice(1);

  return (
    <>
      <style>{css}</style>
      <div className="pa-wrapper">
        <h1 className="pa-heading">Player Analysis</h1>
        <p className="pa-subtitle">Hall of Fame leaderboards and career statistics</p>

        {/* ═══ Hall of Fame ═══ */}
        <div className="pa-hof-grid">

          {/* ── Orange Cap (Batting) ────────────────────────────────────── */}
          <div className="pa-column">
            <div className="pa-col-header pa-col-header--orange">
              <span className="pa-col-header-icon">🧡</span>
              Orange Cap Race — Most Career Runs
            </div>

            {/* Marquee #1 */}
            {bat1 && (
              <div className="pa-marquee pa-marquee--orange">
                <span className="pa-marquee-rank">#1</span>
                <img className="pa-marquee-avatar pa-marquee-avatar--orange" src={getPlayerAvatar(bat1.batter)} alt={bat1.batter} />
                <div className="pa-marquee-info">
                  <div className="pa-marquee-name">{bat1.batter}</div>
                  <div className="pa-marquee-stat pa-marquee-stat--orange">{bat1.career_runs.toLocaleString()}</div>
                  <div className="pa-marquee-stat-label">Career Runs</div>
                  <div className="pa-marquee-extras">
                    <span className="pa-marquee-extra"><strong>{bat1.career_innings}</strong> Inn</span>
                    <span className="pa-marquee-extra"><strong>{bat1.career_fours}</strong> 4s</span>
                    <span className="pa-marquee-extra"><strong>{bat1.career_sixes}</strong> 6s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of top 10 */}
            <div className="pa-list pa-list--orange">
              {batRest.map((b, i) => (
                <div className="pa-list-row" key={b.batter}>
                  <span className="pa-list-rank">{i + 2}</span>
                  <img className="pa-list-avatar" src={getPlayerAvatar(b.batter, 64)} alt="" />
                  <span className="pa-list-name">{b.batter}</span>
                  <span className="pa-list-stat pa-list-stat--orange">
                    {b.career_runs.toLocaleString()}
                    <span className="pa-list-stat-unit">runs</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Purple Cap (Bowling) ────────────────────────────────────── */}
          <div className="pa-column">
            <div className="pa-col-header pa-col-header--purple">
              <span className="pa-col-header-icon">💜</span>
              Purple Cap Race — Most Career Wickets
            </div>

            {/* Marquee #1 */}
            {bowl1 && (
              <div className="pa-marquee pa-marquee--purple">
                <span className="pa-marquee-rank">#1</span>
                <img className="pa-marquee-avatar pa-marquee-avatar--purple" src={getPlayerAvatar(bowl1.bowler)} alt={bowl1.bowler} />
                <div className="pa-marquee-info">
                  <div className="pa-marquee-name">{bowl1.bowler}</div>
                  <div className="pa-marquee-stat pa-marquee-stat--purple">{bowl1.career_wickets}</div>
                  <div className="pa-marquee-stat-label">Career Wickets</div>
                  <div className="pa-marquee-extras">
                    <span className="pa-marquee-extra"><strong>{bowl1.career_matches}</strong> Mat</span>
                    <span className="pa-marquee-extra"><strong>{bowl1.career_runs_conceded.toLocaleString()}</strong> Conc</span>
                    <span className="pa-marquee-extra"><strong>{bowl1.career_balls.toLocaleString()}</strong> Balls</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rest of top 10 */}
            <div className="pa-list pa-list--purple">
              {bowlRest.map((b, i) => (
                <div className="pa-list-row" key={b.bowler}>
                  <span className="pa-list-rank">{i + 2}</span>
                  <img className="pa-list-avatar" src={getPlayerAvatar(b.bowler, 64)} alt="" />
                  <span className="pa-list-name">{b.bowler}</span>
                  <span className="pa-list-stat pa-list-stat--purple">
                    {b.career_wickets}
                    <span className="pa-list-stat-unit">wkts</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ Divider ═══ */}
        <hr className="pa-divider" />

        {/* ═══ Player Career Search ═══ */}
        <div className="pa-search-section">
          <h2 className="pa-section-heading">🔍 Player Career Search</h2>
          <div className="pa-search-row">
            <div className="pa-ac-wrap" ref={acRef}>
              <input
                className="pa-input"
                type="text"
                placeholder='Search player (e.g. "Bumrah", "Kohli")'
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                onFocus={() => { if (searchInput.trim()) setShowSuggestions(true); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="pa-ac-dropdown">
                  {suggestions.map(name => (
                    <div className="pa-ac-item" key={name} onMouseDown={() => handleSelectSuggestion(name)}>
                      <img src={getPlayerAvatar(name, 56)} alt="" />
                      {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="pa-search-btn" disabled={searchLoading} onClick={() => handleSearch()}>
              {searchLoading ? "Searching…" : "Search"}
            </button>
          </div>

          {searchLoading && <p className="pa-inline-msg">⏳ Searching…</p>}
          {searchError && <p className="pa-inline-error">⚠️ {searchError}</p>}

          {searchedPlayer && (() => {
            const d = computeDerived(searchedPlayer);
            return (
              <div className="pa-career-card">
                <img className="pa-career-avatar" src={getPlayerAvatar(searchedPlayer.player)} alt={searchedPlayer.player} />
                <h3 className="pa-career-name">{searchedPlayer.player}</h3>
                <span className={`pa-career-badge ${d.isAllRounder ? "pa-career-badge--allrounder" : "pa-career-badge--specialist"}`}>
                  {d.isAllRounder ? "⭐ All-Rounder" : "Specialist"}
                </span>
                <div className="pa-career-stats">
                  <div><div className="pa-career-stat-val">{searchedPlayer.total_runs.toLocaleString()}</div><div className="pa-career-stat-lbl">Total Runs</div></div>
                  <div><div className="pa-career-stat-val">{searchedPlayer.total_wickets}</div><div className="pa-career-stat-lbl">Wickets</div></div>
                  <div><div className="pa-career-stat-val">{searchedPlayer.total_innings}</div><div className="pa-career-stat-lbl">Innings</div></div>
                  <div><div className="pa-career-stat-val">{d.strikeRate}</div><div className="pa-career-stat-lbl">Strike Rate</div></div>
                  <div><div className="pa-career-stat-val">{d.battingAvg}</div><div className="pa-career-stat-lbl">Batting Avg</div></div>
                  <div><div className="pa-career-stat-val">{d.economy}</div><div className="pa-career-stat-lbl">Economy</div></div>
                  <div><div className="pa-career-stat-val">{searchedPlayer.total_fours}</div><div className="pa-career-stat-lbl">Fours</div></div>
                  <div><div className="pa-career-stat-val">{searchedPlayer.total_sixes}</div><div className="pa-career-stat-lbl">Sixes</div></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
