"""
main.py – FastAPI application entry-point for the CricInsight backend.

Run with:
    uvicorn main:app --reload
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

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
        result = evaluate_player_performance(
            innings=payload.innings,
            balls_faced=payload.balls_faced,
            strike_rate=payload.strike_rate,
            batting_avg=payload.batting_avg,
            fours=payload.fours,
            sixes=payload.sixes,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=422, detail=f"Prediction error: {exc}")

    return result
