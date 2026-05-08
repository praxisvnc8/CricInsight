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

  /* Filter */
  .tr-filter-row {
    display: flex; justify-content: center; margin-bottom: 2.5rem;
  }
  .tr-filter-input {
    width: 100%; max-width: 400px;
    padding: 0.75rem 1.25rem; border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04); color: #e2e8f0;
    font-size: 0.95rem; font-family: 'Inter', sans-serif;
    outline: none; transition: border-color 0.2s;
    backdrop-filter: blur(12px);
  }
  .tr-filter-input:focus { border-color: rgba(245,158,11,0.4); }
  .tr-filter-input::placeholder { color: #475569; }

  /* Grid */
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

  /* Trophy count summary */
  .tr-summary {
    display: flex; flex-wrap: wrap; justify-content: center;
    gap: 1rem; max-width: 1100px; margin: 0 auto 2.5rem;
  }
  .tr-summary-item {
    display: flex; align-items: center; gap: 0.6rem;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 12px; padding: 0.6rem 1rem;
    transition: border-color 0.2s;
  }
  .tr-summary-item:hover { border-color: rgba(245,158,11,0.2); }
  .tr-summary-logo { width: 28px; height: 28px; object-fit: contain; }
  .tr-summary-name { font-size: 0.82rem; color: #94a3b8; font-weight: 500; }
  .tr-summary-count {
    font-size: 1rem; font-weight: 800; color: #fbbf24;
    min-width: 1.5rem; text-align: center;
  }

  /* No results */
  .tr-no-results {
    grid-column: 1 / -1; text-align: center;
    padding: 3rem 1rem; color: #475569; font-style: italic;
  }
`;

/* ── Component ───────────────────────────────────────────────────────────── */
export default function TrophyRoom() {
  const [filter, setFilter] = useState("");

  /* Trophy count per team */
  const trophyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    IPL_CHAMPIONS.forEach((c) => {
      counts[c.winner] = (counts[c.winner] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([team, count]) => ({ team, count }));
  }, []);

  /* Filtered champions */
  const filteredChampions = useMemo(() => {
    if (!filter.trim()) return IPL_CHAMPIONS;
    const q = filter.trim().toLowerCase();
    return IPL_CHAMPIONS.filter(
      (c) =>
        c.winner.toLowerCase().includes(q) ||
        c.runnerUp.toLowerCase().includes(q) ||
        c.year.toString().includes(q)
    );
  }, [filter]);

  return (
    <>
      <style>{css}</style>
      <div className="tr-wrapper">
        <h1 className="tr-heading">Trophy Room</h1>
        <p className="tr-subtitle">Every IPL champion from 2008 to 2024</p>

        {/* Trophy count summary */}
        <div className="tr-summary">
          {trophyCounts.map(({ team, count }) => (
            <div className="tr-summary-item" key={team}>
              <img className="tr-summary-logo" src={getTeamLogo(team)} alt="" />
              <span className="tr-summary-name">{team}</span>
              <span className="tr-summary-count">{count}</span>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="tr-filter-row">
          <input
            className="tr-filter-input"
            type="text"
            placeholder='Filter by team or year (e.g. "MI", "CSK", "2023")'
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Cards grid */}
        <div className="tr-grid">
          {filteredChampions.length === 0 ? (
            <div className="tr-no-results">No trophies match your search.</div>
          ) : (
            filteredChampions.map((c) => (
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
      </div>
    </>
  );
}
