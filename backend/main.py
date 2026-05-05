"""
main.py – FastAPI application entry-point for the CricInsight backend.

Run with:
    uvicorn main:app --reload
"""

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db
from models import Match
from schemas import (
    MatchResponse,
    MatchWinnerRequest,
    MatchWinnerResponse,
)
from ml_services import predict_match_winner

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
