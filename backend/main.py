"""
main.py – FastAPI application entry-point for the CricInsight backend.

Run with:
    uvicorn main:app --reload
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from models import Match, BatsmanSeasonStat, BowlerSeasonStat, PlayerSeasonStat
from schemas import (
    MatchResponse,
    MatchWinnerRequest,
    MatchWinnerResponse,
    InningsScoreRequest,
    InningsScoreResponse,
    PlayerPerformanceRequest,
    PlayerPerformanceResponse,
)
from ml_services import predict_match_winner, predict_innings_score, evaluate_player_performance

# ── FastAPI app ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="CricInsight API",
    description="IPL analytics and ML prediction service.",
    version="0.1.0",
)

# ── CORS configuration ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # React (CRA / Next.js)
        "http://localhost:5173",   # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════════════════════════════
#  ROUTES
# ═══════════════════════════════════════════════════════════════════════════


@app.get("/")
def root():
    """Health-check endpoint."""
    return {"message": "CricInsight API is running"}


@app.get("/api/matches", response_model=list[MatchResponse])
def list_matches(db: Session = Depends(get_db)):
    """Return all the matches from the db"""
    matches = (
        db.query(Match)
        .order_by(Match.date.desc())
        # .limit(limit)
        .all()
    )
    return matches


@app.post("/api/predict/match-winner", response_model=MatchWinnerResponse)
def predict_winner(payload: MatchWinnerRequest):
    """Predict the winner of an IPL match."""
    try:
        result = predict_match_winner(
            team1=payload.team1,
            team2=payload.team2,
            city=payload.city,
            toss_winner=payload.toss_winner,
            toss_decision=payload.toss_decision,
            h2h_win_ratio=payload.h2h_win_ratio,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Prediction error: {exc}")

    return result


# ═══════════════════════════════════════════════════════════════════════════
#  PLAYER STATS ROUTES
# ═══════════════════════════════════════════════════════════════════════════


@app.get("/api/players/top-batsmen")
def top_batsmen(limit: int = 20, db: Session = Depends(get_db)):
    """Top batsmen by career total runs (aggregated across all seasons)."""
    rows = (
        db.query(
            BatsmanSeasonStat.batter,
            func.sum(BatsmanSeasonStat.total_runs).label("career_runs"),
            func.sum(BatsmanSeasonStat.innings).label("career_innings"),
            func.sum(BatsmanSeasonStat.balls_faced).label("career_balls"),
            func.sum(BatsmanSeasonStat.fours).label("career_fours"),
            func.sum(BatsmanSeasonStat.sixes).label("career_sixes"),
        )
        .group_by(BatsmanSeasonStat.batter)
        .order_by(func.sum(BatsmanSeasonStat.total_runs).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "batter": r.batter,
            "career_runs": int(r.career_runs or 0),
            "career_innings": int(r.career_innings or 0),
            "career_balls": int(r.career_balls or 0),
            "career_fours": int(r.career_fours or 0),
            "career_sixes": int(r.career_sixes or 0),
        }
        for r in rows
    ]


@app.get("/api/players/top-bowlers")
def top_bowlers(limit: int = 20, db: Session = Depends(get_db)):
    """Top bowlers by career total wickets (aggregated across all seasons)."""
    rows = (
        db.query(
            BowlerSeasonStat.bowler,
            func.sum(BowlerSeasonStat.wickets).label("career_wickets"),
            func.sum(BowlerSeasonStat.matches_played).label("career_matches"),
            func.sum(BowlerSeasonStat.runs_conceded).label("career_runs_conceded"),
            func.sum(BowlerSeasonStat.balls_bowled).label("career_balls"),
        )
        .group_by(BowlerSeasonStat.bowler)
        .order_by(func.sum(BowlerSeasonStat.wickets).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "bowler": r.bowler,
            "career_wickets": int(r.career_wickets or 0),
            "career_matches": int(r.career_matches or 0),
            "career_runs_conceded": int(r.career_runs_conceded or 0),
            "career_balls": int(r.career_balls or 0),
        }
        for r in rows
    ]


@app.get("/api/players/stats/{player_name}")
def player_stats(player_name: str, db: Session = Depends(get_db)):
    """Aggregated career stats for a specific player across all seasons."""
    row = (
        db.query(
            PlayerSeasonStat.player,
            func.sum(PlayerSeasonStat.innings).label("total_innings"),
            func.sum(PlayerSeasonStat.total_runs).label("total_runs"),
            func.sum(PlayerSeasonStat.balls_faced).label("total_balls_faced"),
            func.sum(PlayerSeasonStat.fours).label("total_fours"),
            func.sum(PlayerSeasonStat.sixes).label("total_sixes"),
            func.sum(PlayerSeasonStat.wickets).label("total_wickets"),
            func.sum(PlayerSeasonStat.matches_played).label("total_matches"),
            func.sum(PlayerSeasonStat.runs_conceded).label("total_runs_conceded"),
            func.sum(PlayerSeasonStat.balls_bowled).label("total_balls_bowled"),
        )
        .filter(PlayerSeasonStat.player == player_name)
        .group_by(PlayerSeasonStat.player)
        .first()
    )

    if not row:
        raise HTTPException(status_code=404, detail=f"Player '{player_name}' not found.")

    return {
        "player": row.player,
        "total_innings": int(row.total_innings or 0),
        "total_runs": int(row.total_runs or 0),
        "total_balls_faced": int(row.total_balls_faced or 0),
        "total_fours": int(row.total_fours or 0),
        "total_sixes": int(row.total_sixes or 0),
        "total_wickets": int(row.total_wickets or 0),
        "total_matches": int(row.total_matches or 0),
        "total_runs_conceded": int(row.total_runs_conceded or 0),
        "total_balls_bowled": int(row.total_balls_bowled or 0),
    }


@app.get("/api/players/names")
def player_names(db: Session = Depends(get_db)):
    """Return a sorted list of all distinct player names for autocomplete."""
    rows = (
        db.query(PlayerSeasonStat.player)
        .distinct()
        .order_by(PlayerSeasonStat.player)
        .all()
    )
    return [r.player for r in rows]


@app.post("/api/predict/innings-score", response_model=InningsScoreResponse)
def predict_score(payload: InningsScoreRequest):
    """Predict the first-innings total for the batting team."""
    try:
        result = predict_innings_score(
            batting_team=payload.batting_team,
            bowling_team=payload.bowling_team,
            city=payload.city,
            season=payload.season,
            toss_winner=payload.toss_winner,
            toss_decision=payload.toss_decision,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Prediction error: {exc}")

    return result

@app.post("/api/predict/player-performance", response_model=PlayerPerformanceResponse)
def predict_player(payload: PlayerPerformanceRequest):
    """Classify a player's seasonal performance as Good / Average / Poor."""
    try:
        # Pass the NEW features to the ML service
        result = evaluate_player_performance(
            total_runs=payload.total_runs,
            strike_rate=payload.strike_rate,
            batting_avg=payload.batting_avg,
            wickets=payload.wickets,
            economy=payload.economy,
            bowling_avg=payload.bowling_avg,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Prediction error: {exc}")

    return result


# ═══════════════════════════════════════════════════════════════════════════
#  DASHBOARD ANALYTICS ROUTES
# ═══════════════════════════════════════════════════════════════════════════


@app.get("/api/stats/toss-impact")
def toss_impact(db: Session = Depends(get_db)):
    """Toss decision impact: win rates when choosing bat vs field."""
    all_matches = db.query(Match).filter(Match.toss_decision.isnot(None)).all()

    bat_total = bat_wins = field_total = field_wins = 0
    for m in all_matches:
        if m.toss_decision == "bat":
            bat_total += 1
            if m.toss_winner == m.winner:
                bat_wins += 1
        elif m.toss_decision == "field":
            field_total += 1
            if m.toss_winner == m.winner:
                field_wins += 1

    return {
        "bat_total": bat_total,
        "bat_wins": bat_wins,
        "field_total": field_total,
        "field_wins": field_wins,
    }


@app.get("/api/stats/score-evolution")
def score_evolution(db: Session = Depends(get_db)):
    """Average 1st innings score per season."""
    rows = (
        db.query(
            Match.season,
            func.avg(Match.target_runs).label("avg_target"),
            func.count(Match.id).label("match_count"),
        )
        .filter(Match.target_runs.isnot(None), Match.target_runs > 0)
        .group_by(Match.season)
        .order_by(Match.season)
        .all()
    )
    return [
        {
            "season": r.season,
            "avg_score": round(float(r.avg_target) - 1, 1),
            "match_count": int(r.match_count),
        }
        for r in rows
    ]

# ══════════════════════════════════════════════════════════════════════════
# DASHBOARD ANALYTICS ROUTES
# ═══════════════════════════════════════════════════════════════════════════
@app.get("/api/teams/h2h")
def get_head_to_head_stats(team1: str, team2: str, db: Session = Depends(get_db)):
    """Fetches complex Head-to-Head analytics between two teams."""
    
    # 1. Query the matches table for wins, tosses, and decisions
    matches_query = text("""
        SELECT 
            COUNT(id) as played,
            SUM(CASE WHEN winner = :t1 THEN 1 ELSE 0 END) as t1_wins,
            SUM(CASE WHEN winner = :t2 THEN 1 ELSE 0 END) as t2_wins,
            SUM(CASE WHEN toss_winner = :t1 THEN 1 ELSE 0 END) as t1_toss_won,
            SUM(CASE WHEN toss_winner = :t2 THEN 1 ELSE 0 END) as t2_toss_won,
            SUM(CASE WHEN toss_winner = :t1 AND toss_decision = 'bat' THEN 1 ELSE 0 END) as t1_toss_bat,
            SUM(CASE WHEN toss_winner = :t2 AND toss_decision = 'bat' THEN 1 ELSE 0 END) as t2_toss_bat,
            SUM(CASE WHEN toss_winner = :t1 AND toss_decision = 'field' THEN 1 ELSE 0 END) as t1_toss_field,
            SUM(CASE WHEN toss_winner = :t2 AND toss_decision = 'field' THEN 1 ELSE 0 END) as t2_toss_field,
            SUM(CASE WHEN toss_winner = :t1 AND winner = :t1 THEN 1 ELSE 0 END) as t1_toss_win_match_win,
            SUM(CASE WHEN toss_winner = :t2 AND winner = :t2 THEN 1 ELSE 0 END) as t2_toss_win_match_win
        FROM matches
        WHERE (team1 = :t1 AND team2 = :t2) OR (team1 = :t2 AND team2 = :t1)
    """)
    
    match_stats = db.execute(matches_query, {"t1": team1, "t2": team2}).mappings().fetchone()
    
    if not match_stats or match_stats['played'] == 0:
        raise HTTPException(status_code=404, detail="No matches found between these teams.")

    # 2. Query the deliveries table for runs and wickets in these specific matches
    innings_query = text("""
        SELECT 
            batting_team,
            match_id,
            SUM(total_runs) as runs,
            SUM(CASE WHEN player_dismissed IS NOT NULL THEN 1 ELSE 0 END) as wickets
        FROM deliveries
        WHERE match_id IN (
            SELECT id FROM matches 
            WHERE (team1 = :t1 AND team2 = :t2) OR (team1 = :t2 AND team2 = :t1)
        )
        GROUP BY batting_team, match_id
    """)
    
    innings_stats = db.execute(innings_query, {"t1": team1, "t2": team2}).mappings().fetchall()
    
    # 3. Calculate Highs, Lows, and Averages in Python
    t1_scores = [row['runs'] for row in innings_stats if row['batting_team'] == team1]
    t2_scores = [row['runs'] for row in innings_stats if row['batting_team'] == team2]
    
    t1_wickets = [row['wickets'] for row in innings_stats if row['batting_team'] == team1]
    t2_wickets = [row['wickets'] for row in innings_stats if row['batting_team'] == team2]

    def safe_calc(arr, func, default=0):
        return round(func(arr), 2) if arr else default

    return {
        "played": match_stats['played'],
        "team1": {
            "name": team1,
            "won": match_stats['t1_wins'],
            "highest_total": safe_calc(t1_scores, max),
            "lowest_total": safe_calc(t1_scores, min),
            "tosses_won": match_stats['t1_toss_won'],
            "elected_bat": match_stats['t1_toss_bat'],
            "elected_field": match_stats['t1_toss_field'],
            "toss_and_match_won": match_stats['t1_toss_win_match_win'],
            "avg_runs": safe_calc(t1_scores, lambda x: sum(x)/len(x)),
            "avg_wickets": safe_calc(t1_wickets, lambda x: sum(x)/len(x))
        },
        "team2": {
            "name": team2,
            "won": match_stats['t2_wins'],
            "highest_total": safe_calc(t2_scores, max),
            "lowest_total": safe_calc(t2_scores, min),
            "tosses_won": match_stats['t2_toss_won'],
            "elected_bat": match_stats['t2_toss_bat'],
            "elected_field": match_stats['t2_toss_field'],
            "toss_and_match_won": match_stats['t2_toss_win_match_win'],
            "avg_runs": safe_calc(t2_scores, lambda x: sum(x)/len(x)),
            "avg_wickets": safe_calc(t2_wickets, lambda x: sum(x)/len(x))
        }
    }