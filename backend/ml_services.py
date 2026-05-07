"""
ml_services.py – Singleton model loader and prediction functions for the
three CricInsight ML pipelines.

Models are loaded once at module import time and reused across all requests.
"""

import os
import logging
from typing import Any

import joblib
import pandas as pd

logger = logging.getLogger(__name__)

# ── Resolve model directory relative to this file ───────────────────────────
_MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")

_MATCH_WINNER_PATH = os.path.join(_MODEL_DIR, "match_winner.pkl")
_INNINGS_SCORE_PATH = os.path.join(_MODEL_DIR, "innings_score.pkl")
_PLAYER_PERF_PATH = os.path.join(_MODEL_DIR, "player_performance.pkl")


# ── Singleton model cache ───────────────────────────────────────────────────
_model_cache: dict[str, Any] = {}


def _load_model(name: str, path: str) -> dict[str, Any]:
    """Load a pickled model bundle from *path*, caching it by *name*."""
    if name in _model_cache:
        return _model_cache[name]

    if not os.path.isfile(path):
        raise FileNotFoundError(
            f"Model file not found: {path}. "
            "Ensure the .pkl file exists in the backend/model/ directory."
        )

    logger.info("Loading model '%s' from %s …", name, path)
    bundle = joblib.load(path)
    _model_cache[name] = bundle
    return bundle


def _get_match_winner_bundle() -> dict[str, Any]:
    return _load_model("match_winner", _MATCH_WINNER_PATH)


def _get_innings_score_bundle() -> dict[str, Any]:
    return _load_model("innings_score", _INNINGS_SCORE_PATH)


def _get_player_perf_bundle() -> dict[str, Any]:
    return _load_model("player_performance", _PLAYER_PERF_PATH)


# ── Eagerly load all models at import time ──────────────────────────────────
try:
    _get_match_winner_bundle()
    _get_innings_score_bundle()
    _get_player_perf_bundle()
    logger.info("All ML models loaded successfully.")
except FileNotFoundError as exc:
    logger.warning("Could not pre-load models: %s", exc)


# ═══════════════════════════════════════════════════════════════════════════
#  PREDICTION FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════


def predict_match_winner(
    team1: str,
    team2: str,
    city: str,
    toss_winner: str,
    toss_decision: str,
    h2h_win_ratio: float = 0.5,
) -> dict[str, Any]:
    """Predict the winner of a match and return win probabilities.

    Parameters
    ----------
    team1, team2 : str
        Team names (must exist in the model's label encoder).
    city : str
        Venue city.
    toss_winner : str
        Must be either *team1* or *team2*.
    toss_decision : str
        ``"bat"`` or ``"field"``.
    h2h_win_ratio : float
        Historical head-to-head win ratio for *team1* (0.0 – 1.0).
        Defaults to 0.5 when unavailable.

    Returns
    -------
    dict with keys: predicted_winner, team1, team2, team1_prob, team2_prob
    """
    bundle = _get_match_winner_bundle()
    le_team = bundle["le_team"]
    le_city = bundle["le_city"]
    model = bundle["model"]
    win_rates = bundle["win_rates"]
    features = bundle["features"]

    # Encode categorical inputs
    team1_enc = le_team.transform([team1])[0]
    team2_enc = le_team.transform([team2])[0]
    city_enc = le_city.transform([city])[0]
    toss_team1 = 1 if toss_winner == team1 else 0
    toss_bat = 1 if toss_decision == "bat" else 0
    team1_wr = win_rates.get(team1, 0.5)
    team2_wr = win_rates.get(team2, 0.5)

    X = pd.DataFrame(
        [[team1_enc, team2_enc, city_enc, toss_team1, toss_bat,
          team1_wr, team2_wr, h2h_win_ratio]],
        columns=features,
    )

    probabilities = model.predict_proba(X)[0]
    team1_prob = round(float(probabilities[1]) * 100, 1)
    team2_prob = round(float(probabilities[0]) * 100, 1)
    predicted_winner = team1 if team1_prob > team2_prob else team2

    return {
        "predicted_winner": predicted_winner,
        "team1": team1,
        "team2": team2,
        "team1_prob": team1_prob,
        "team2_prob": team2_prob,
    }


def predict_innings_score(
    batting_team: str,
    bowling_team: str,
    city: str,
    season: int,
    toss_winner: str,
    toss_decision: str,
) -> dict[str, Any]:
    """Predict the first-innings total for the batting team.

    Returns
    -------
    dict with keys: predicted_score, score_low, score_high,
                    batting_team, bowling_team
    """
    bundle = _get_innings_score_bundle()
    le_team = bundle["le_team"]
    le_city = bundle["le_city"]
    model = bundle["model"]
    features = bundle["features"]

    bat_enc = le_team.transform([batting_team])[0]
    bowl_enc = le_team.transform([bowling_team])[0]
    city_enc = le_city.transform([city])[0]
    toss_bat = 1 if toss_decision == "bat" else 0
    bat_toss = 1 if toss_winner == batting_team else 0

    X = pd.DataFrame(
        [[bat_enc, bowl_enc, city_enc, season, toss_bat, bat_toss]],
        columns=features,
    )

    predicted_score = int(model.predict(X)[0])

    return {
        "predicted_score": predicted_score,
        "score_low": predicted_score - 20,
        "score_high": predicted_score + 20,
        "batting_team": batting_team,
        "bowling_team": bowling_team,
    }


def evaluate_player_performance(
    total_runs: int,
    strike_rate: float,
    batting_avg: float,
    wickets: int,
    economy: float,
    bowling_avg: float,
) -> dict[str, Any]:
    """Classify a player's seasonal performance as Good / Average / Poor.

    Parameters
    ----------
    total_runs : int
        Total runs scored in the season/career.
    strike_rate : float
        Batting strike rate.
    batting_avg : float
        Batting average (runs per innings).
    wickets : int
        Total wickets taken.
    economy : float
        Bowling economy rate (runs conceded per over).
    bowling_avg : float
        Bowling average (runs conceded per wicket).

    Returns
    -------
    dict with keys: label, thresholds, input_stats
    """
    bundle = _get_player_perf_bundle()
    model = bundle["model"]
    features = bundle["features"]
    thresholds = bundle["thresholds"]

    # Must match the exact order of features used during training
    X = pd.DataFrame(
        [[total_runs, strike_rate, batting_avg, wickets, economy, bowling_avg]],
        columns=features,
    )

    label = str(model.predict(X)[0])

    return {
        "label": label,
        "thresholds": {
            "poor_below": thresholds["q33"],
            "good_above": thresholds["q67"],
        },
        "input_stats": {
            "total_runs": total_runs,
            "strike_rate": strike_rate,
            "batting_avg": batting_avg,
            "wickets": wickets,
            "economy": economy,
            "bowling_avg": bowling_avg,
        },
    }
# ── Convenience helpers for route-layer validation ──────────────────────────

def get_valid_teams() -> list[str]:
    """Return the list of team names the match-winner model accepts."""
    return _get_match_winner_bundle()["team_list"]


def get_valid_cities() -> list[str]:
    """Return the list of city names the match-winner model accepts."""
    return _get_match_winner_bundle()["city_list"]
