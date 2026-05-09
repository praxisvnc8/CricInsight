import { useState, useMemo } from "react";
import { getTeamLogo } from "../utils/teamLogos";

/* ── IPL Champions Data (2008–2024) ─────────────────────────────────────── */
interface Champion {
  year: number;
  winner: string;
  runnerUp: string;
  venue: string;
}

const IPL_CHAMPIONS: Champion[] = [
  { year: 2008, winner: "Rajasthan Royals", runnerUp: "Chennai Super Kings", venue: "DY Patil Stadium, Mumbai" },
  { year: 2009, winner: "Deccan Chargers", runnerUp: "Royal Challengers Bangalore", venue: "Wanderers Stadium, Johannesburg" },
  { year: 2010, winner: "Chennai Super Kings", runnerUp: "Mumbai Indians", venue: "DY Patil Stadium, Mumbai" },
  { year: 2011, winner: "Chennai Super Kings", runnerUp: "Royal Challengers Bangalore", venue: "MA Chidambaram Stadium, Chennai" },
  { year: 2012, winner: "Kolkata Knight Riders", runnerUp: "Chennai Super Kings", venue: "MA Chidambaram Stadium, Chennai" },
  { year: 2013, winner: "Mumbai Indians", runnerUp: "Chennai Super Kings", venue: "Eden Gardens, Kolkata" },
  { year: 2014, winner: "Kolkata Knight Riders", runnerUp: "Kings XI Punjab", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { year: 2015, winner: "Mumbai Indians", runnerUp: "Chennai Super Kings", venue: "Eden Gardens, Kolkata" },
  { year: 2016, winner: "Sunrisers Hyderabad", runnerUp: "Royal Challengers Bangalore", venue: "M. Chinnaswamy Stadium, Bengaluru" },
  { year: 2017, winner: "Mumbai Indians", runnerUp: "Rising Pune Supergiant", venue: "Rajiv Gandhi Intl Stadium, Hyderabad" },
  { year: 2018, winner: "Chennai Super Kings", runnerUp: "Sunrisers Hyderabad", venue: "Wankhede Stadium, Mumbai" },
  { year: 2019, winner: "Mumbai Indians", runnerUp: "Chennai Super Kings", venue: "Rajiv Gandhi Intl Stadium, Hyderabad" },
  { year: 2020, winner: "Mumbai Indians", runnerUp: "Delhi Capitals", venue: "Dubai International Cricket Stadium" },
  { year: 2021, winner: "Chennai Super Kings", runnerUp: "Kolkata Knight Riders", venue: "Dubai International Cricket Stadium" },
  { year: 2022, winner: "Gujarat Titans", runnerUp: "Rajasthan Royals", venue: "Narendra Modi Stadium, Ahmedabad" },
  { year: 2023, winner: "Chennai Super Kings", runnerUp: "Gujarat Titans", venue: "Narendra Modi Stadium, Ahmedabad" },
  { year: 2024, winner: "Kolkata Knight Riders", runnerUp: "Sunrisers Hyderabad", venue: "MA Chidambaram Stadium, Chennai" },
];

/* ── All Teams ──────────────────────────────────────────────────────────── */
const ALL_TEAMS = [
  "Chennai Super Kings",
  "Mumbai Indians",
  "Kolkata Knight Riders",
  "Royal Challengers Bengaluru",
  "Rajasthan Royals",
  "Sunrisers Hyderabad",
  "Delhi Capitals",
  "Punjab Kings",
  "Gujarat Titans",
  "Lucknow Super Giants",
  "Deccan Chargers",
];

/* ── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  .tr-wrapper {
    min-height: 100vh;
    background: linear-gradient(160deg, #0a0e1a 0%, #111827 40%, #0f172a 100%);
    padding: 2.5rem 2rem;
    font-family: 'Inter', 'Segoe UI', sans-serif;
    color: #e2e8f0;
  }
  .tr-heading {
    font-size: 2.2rem; font-weight: 800; text-align: center; margin-bottom: 0.4rem;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .tr-subtitle {
    text-align: center; color: #64748b; font-size: 0.9rem; margin-bottom: 2rem;
  }

  /* ── Team Selector Grid ─────────────────────────────────────────────────── */
  .tr-team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  .tr-team-card {
    position: relative;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 0.75rem;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    border: 1px solid rgba(255,255,255,0.06);
    padding: 2rem 1.25rem 1.5rem;
    text-align: center;
    transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    overflow: hidden;
  }
  .tr-team-card--clickable { cursor: pointer; }
  .tr-team-card--dimmed { opacity: 0.45; cursor: default; }
  .tr-team-card:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 48px rgba(245,158,11,0.12);
    border-color: rgba(245,158,11,0.25);
  }
  .tr-team-card--dimmed:hover {
    transform: none;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    border-color: rgba(255,255,255,0.06);
  }
  .tr-team-logo {
    width: 80px; height: 80px; object-fit: contain;
    filter: drop-shadow(0 4px 12px rgba(245,158,11,0.15));
    transition: transform 0.3s;
  }
  .tr-team-card:hover .tr-team-logo { transform: scale(1.1); }
  .tr-team-card--dimmed:hover .tr-team-logo { transform: none; }
  .tr-team-name {
    font-size: 0.92rem; font-weight: 600; color: #cbd5e1;
  }
  .tr-team-trophies {
    font-size: 0.8rem; font-weight: 700; letter-spacing: 0.5px;
    padding: 0.3rem 0.85rem; border-radius: 20px;
    opacity: 0; transform: translateY(6px);
    transition: opacity 0.3s, transform 0.3s;
  }
  .tr-team-card:hover .tr-team-trophies {
    opacity: 1; transform: translateY(0);
  }
  .tr-team-trophies--has {
    background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3);
    color: #fbbf24; text-shadow: 0 0 12px rgba(245,158,11,0.4);
  }
  .tr-team-trophies--none {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #475569;
  }

  /* ── Back Button ────────────────────────────────────────────────────────── */
  .tr-back-btn {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.55rem 1.2rem; border-radius: 10px; border: none;
    background: rgba(255,255,255,0.05); color: #94a3b8;
    font-weight: 600; font-size: 0.85rem; cursor: pointer;
    font-family: 'Inter', sans-serif;
    border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.2s;
    margin-bottom: 1.5rem;
  }
  .tr-back-btn:hover {
    background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2);
    color: #fbbf24;
  }

  /* ── Detail Header ──────────────────────────────────────────────────────── */
  .tr-detail-header {
    display: flex; align-items: center; justify-content: center;
    gap: 1rem; margin-bottom: 2rem;
  }
  .tr-detail-logo {
    width: 64px; height: 64px; object-fit: contain;
    filter: drop-shadow(0 4px 16px rgba(245,158,11,0.25));
  }
  .tr-detail-name {
    font-size: 1.6rem; font-weight: 800;
    background: linear-gradient(135deg, #f59e0b, #fbbf24);
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .tr-detail-count {
    font-size: 0.85rem; color: #64748b; text-align: center; margin-top: -1rem; margin-bottom: 2rem;
  }

  /* ── Year Card Grid (same grid as before) ───────────────────────────────── */
  .tr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* Card */
  .tr-card {
    position: relative;
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(16px);
    border-radius: 20px;
    border: 1px solid rgba(245,158,11,0.15);
    padding: 1.75rem 1.5rem 1.5rem;
    text-align: center;
    transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    overflow: hidden;
  }
  .tr-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, #f59e0b, #fbbf24, #f7971e);
    opacity: 0.6;
    transition: opacity 0.3s;
  }
  .tr-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 48px rgba(245,158,11,0.15), 0 0 30px rgba(245,158,11,0.05);
    border-color: rgba(245,158,11,0.35);
  }
  .tr-card:hover::before { opacity: 1; }

  /* Year badge */
  .tr-year-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);
    border-radius: 20px; padding: 0.3rem 0.9rem;
    font-size: 0.82rem; font-weight: 700; color: #fbbf24;
    letter-spacing: 0.5px; margin-bottom: 1rem;
  }

  /* Logo */
  .tr-logo {
    width: 80px; height: 80px; object-fit: contain;
    margin: 0 auto 0.75rem; display: block;
    filter: drop-shadow(0 4px 12px rgba(245,158,11,0.2));
    transition: transform 0.3s;
  }
  .tr-card:hover .tr-logo { transform: scale(1.08); }

  /* Winner name */
  .tr-winner-name {
    font-size: 1rem; font-weight: 700; color: #e2e8f0;
    margin-bottom: 0.6rem;
  }

  /* Details */
  .tr-detail {
    font-size: 0.78rem; color: #64748b; margin-bottom: 0.25rem;
    line-height: 1.4;
  }
  .tr-detail-label { color: #94a3b8; font-weight: 600; }

  /* Runner-up row */
  .tr-runner-row {
    display: flex; align-items: center; justify-content: center;
    gap: 0.5rem; margin-top: 0.5rem;
  }
  .tr-runner-logo { width: 20px; height: 20px; object-fit: contain; opacity: 0.6; }
  .tr-runner-text { font-size: 0.75rem; color: #475569; }

  /* No results */
  .tr-no-results {
    grid-column: 1 / -1; text-align: center;
    padding: 3rem 1rem; color: #475569; font-style: italic;
  }
`;

/* ── Component ───────────────────────────────────────────────────────────── */
export default function TrophyRoom() {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  /* Trophy count per team */
  const trophyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    IPL_CHAMPIONS.forEach((c) => {
      counts[c.winner] = (counts[c.winner] || 0) + 1;
    });
    return counts;
  }, []);

  /* Filtered champions for detail view */
  const teamChampions = useMemo(() => {
    if (!selectedTeam) return [];
    return IPL_CHAMPIONS.filter((c) => c.winner === selectedTeam);
  }, [selectedTeam]);

  return (
    <>
      <style>{css}</style>
      <div className="tr-wrapper">
        <h1 className="tr-heading">Trophy Room</h1>
        <p className="tr-subtitle">Every IPL champion from 2008 to 2024</p>

        {selectedTeam === null ? (
          /* ═══ Layout 1: Team Grid ═══ */
          <div className="tr-team-grid">
            {ALL_TEAMS.map((team) => {
              const count = trophyCounts[team] || 0;
              const hasWon = count > 0;
              return (
                <div
                  key={team}
                  className={`tr-team-card ${hasWon ? "tr-team-card--clickable" : "tr-team-card--dimmed"}`}
                  onClick={() => hasWon && setSelectedTeam(team)}
                >
                  <img className="tr-team-logo" src={getTeamLogo(team)} alt={team} />
                  <div className="tr-team-name">{team}</div>
                  <div className={`tr-team-trophies ${hasWon ? "tr-team-trophies--has" : "tr-team-trophies--none"}`}>
                    {hasWon ? `🏆 ${count} ${count === 1 ? "Trophy" : "Trophies"}` : "0 Trophies"}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ═══ Layout 2: Detail View ═══ */
          <>
            <button className="tr-back-btn" onClick={() => setSelectedTeam(null)}>
              ← Back to All Teams
            </button>

            <div className="tr-detail-header">
              <img className="tr-detail-logo" src={getTeamLogo(selectedTeam)} alt={selectedTeam} />
              <div className="tr-detail-name">{selectedTeam}</div>
            </div>
            <p className="tr-detail-count">
              🏆 {teamChampions.length} {teamChampions.length === 1 ? "Title" : "Titles"} Won
            </p>

            <div className="tr-grid">
              {teamChampions.length === 0 ? (
                <div className="tr-no-results">No trophies found for this team.</div>
              ) : (
                teamChampions.map((c) => (
                  <div className="tr-card" key={c.year}>
                    <div className="tr-year-badge">🏆 {c.year}</div>
                    <img className="tr-logo" src={getTeamLogo(c.winner)} alt={c.winner} />
                    <div className="tr-winner-name">{c.winner}</div>
                    <div className="tr-detail">
                      <span className="tr-detail-label">Venue: </span>
                      {c.venue}
                    </div>
                    <div className="tr-runner-row">
                      <img className="tr-runner-logo" src={getTeamLogo(c.runnerUp)} alt="" />
                      <span className="tr-runner-text">Runner-up: {c.runnerUp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
