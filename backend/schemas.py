"""
schemas.py – Pydantic V2 schemas for CricInsight.

• Database-facing schemas for Match and Delivery (Base + Response).
• Request schemas for the three ML prediction endpoints.
"""

from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ═══════════════════════════════════════════════════════════════════════════
#  DATABASE SCHEMAS — Match
# ═══════════════════════════════════════════════════════════════════════════


class MatchBase(BaseModel):
    """Common match attributes (excludes id)."""

    season: int
    city: Optional[str] = None
    date: date
    match_type: Optional[str] = None
    player_of_match: Optional[str] = None
    venue: Optional[str] = None
    team1: str
    team2: str
    toss_winner: Optional[str] = None
    toss_decision: Optional[str] = None
    winner: Optional[str] = None
    result: Optional[str] = None
    result_margin: Optional[float] = None
    target_runs: Optional[float] = None
    target_overs: Optional[float] = None
    super_over: Optional[str] = None
    method: Optional[str] = None
    umpire1: Optional[str] = None
    umpire2: Optional[str] = None


class MatchResponse(MatchBase):
    """Match schema returned by the API (includes id)."""

    id: int

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════════════════
#  DATABASE SCHEMAS — Delivery
# ═══════════════════════════════════════════════════════════════════════════


class DeliveryBase(BaseModel):
    """Common delivery attributes (excludes id)."""

    match_id: int
    inning: Optional[int] = None
    batting_team: Optional[str] = None
    bowling_team: Optional[str] = None
    over: Optional[int] = None
    ball: Optional[int] = None
    batter: Optional[str] = None
    bowler: Optional[str] = None
    non_striker: Optional[str] = None
    batsman_runs: Optional[int] = None
    extra_runs: Optional[int] = None
    total_runs: Optional[int] = None
    extras_type: Optional[str] = None
    is_wicket: Optional[int] = None
    player_dismissed: Optional[str] = None
    dismissal_kind: Optional[str] = None
    fielder: Optional[str] = None


class DeliveryResponse(DeliveryBase):
    """Delivery schema returned by the API (includes id)."""

    id: int

    model_config = ConfigDict(from_attributes=True)


# ═══════════════════════════════════════════════════════════════════════════
#  ML REQUEST SCHEMAS
# ═══════════════════════════════════════════════════════════════════════════


class MatchWinnerRequest(BaseModel):
    """Input schema for ``predict_match_winner()``."""

    team1: str = Field(..., examples=["Mumbai Indians"])
    team2: str = Field(..., examples=["Chennai Super Kings"])
    city: str = Field(..., examples=["Mumbai"])
    toss_winner: str = Field(
        ...,
        description="Must be either team1 or team2.",
        examples=["Mumbai Indians"],
    )
    toss_decision: str = Field(
        ...,
        pattern=r"^(bat|field)$",
        description="'bat' or 'field'.",
        examples=["bat"],
    )
    h2h_win_ratio: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Head-to-head win ratio for team1 (0.0–1.0). Defaults to 0.5.",
    )


class MatchWinnerResponse(BaseModel):
    """Output schema for the match-winner prediction."""

    predicted_winner: str
    team1: str
    team2: str
    team1_prob: float
    team2_prob: float


class InningsScoreRequest(BaseModel):
    """Input schema for ``predict_innings_score()``."""

    batting_team: str = Field(..., examples=["Royal Challengers Bengaluru"])
    bowling_team: str = Field(..., examples=["Kolkata Knight Riders"])
    city: str = Field(..., examples=["Bengaluru"])
    season: int = Field(..., ge=2008, examples=[2024])
    toss_winner: str = Field(
        ...,
        description="Must be either batting_team or bowling_team.",
        examples=["Royal Challengers Bengaluru"],
    )
    toss_decision: str = Field(
        ...,
        pattern=r"^(bat|field)$",
        description="'bat' or 'field'.",
        examples=["bat"],
    )


class InningsScoreResponse(BaseModel):
    """Output schema for the innings-score prediction."""

    predicted_score: int
    score_low: int
    score_high: int
    batting_team: str
    bowling_team: str


class PlayerPerformanceRequest(BaseModel):
    """Input schema for ``evaluate_player_performance()``."""

    innings: int = Field(..., ge=1, examples=[14])
    balls_faced: int = Field(..., ge=1, examples=[390])
    strike_rate: float = Field(..., ge=0.0, examples=[135.5])
    batting_avg: float = Field(..., ge=0.0, examples=[42.8])
    fours: int = Field(..., ge=0, examples=[38])
    sixes: int = Field(..., ge=0, examples=[12])


class PlayerPerformanceResponse(BaseModel):
    """Output schema for the player-performance evaluation."""

    label: str
    thresholds: dict[str, float]
    input_stats: dict[str, float]
