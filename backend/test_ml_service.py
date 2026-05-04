"""
test_ml_service.py – Dummy data script to test all three ml_service.py
prediction functions without needing a live database or running server.

Usage:
    python test_ml_service.py

All test cases use real teams, cities, and seasons from your dataset.
"""

import sys
import traceback

# ── adjust this path if needed ───────────────────────────────────────────────
# If ml_service.py is in backend/, run from project root as:
#   python backend/test_ml_service.py
# OR add the backend directory to sys.path:
sys.path.insert(0, ".")          # current dir
# sys.path.insert(0, "backend") # uncomment if running from project root

from ml_services import (
    predict_match_winner,
    predict_innings_score,
    evaluate_player_performance,
    get_valid_teams,
    get_valid_cities,
)

# ── helpers ──────────────────────────────────────────────────────────────────
PASS = "\033[92m✓ PASS\033[0m"
FAIL = "\033[91m✗ FAIL\033[0m"
WARN = "\033[93m⚠ WARN\033[0m"
SEP  = "─" * 60


def section(title: str) -> None:
    print(f"\n{SEP}\n  {title}\n{SEP}")


def run_test(label: str, fn, *args, **kwargs):
    """Run fn(*args, **kwargs), print result or error."""
    print(f"\n▶ {label}")
    try:
        result = fn(*args, **kwargs)
        print(f"  {PASS}")
        for k, v in result.items():
            print(f"    {k:20s}: {v}")
        return result
    except Exception as exc:
        print(f"  {FAIL}")
        traceback.print_exc()
        return None


# ════════════════════════════════════════════════════════════════════════════
#  0. Validate helpers
# ════════════════════════════════════════════════════════════════════════════
section("0 · Valid Teams & Cities")
try:
    teams  = get_valid_teams()
    cities = get_valid_cities()
    print(f"  {PASS}  {len(teams)} teams, {len(cities)} cities loaded")
    print("  Teams :", teams[:5], "…")
    print("  Cities:", cities[:5], "…")
except Exception:
    print(f"  {WARN}  Could not load helpers – model not trained yet?")
    teams, cities = [], []


# ════════════════════════════════════════════════════════════════════════════
#  1. predict_match_winner  (5 cases)
# ════════════════════════════════════════════════════════════════════════════
section("1 · predict_match_winner")

# Each tuple: (team1, team2, city, toss_winner, toss_decision, h2h_ratio)
WINNER_CASES = [
    # Classic rivalry – Mumbai home ground
    ("Mumbai Indians", "Chennai Super Kings",
     "Mumbai", "Mumbai Indians", "bat", 0.55),

    # Away fixture – CSK in Kolkata
    ("Kolkata Knight Riders", "Chennai Super Kings",
     "Chennai", "Chennai Super Kings", "field", 0.48),

    # Newer teams matchup
    ("Gujarat Titans", "Lucknow Super Giants",
     "Ahmedabad", "Gujarat Titans", "bat", 0.5),

    # Neutral venue (UAE)
    ("Rajasthan Royals", "Royal Challengers Bengaluru",
     "Dubai", "Royal Challengers Bengaluru", "field", 0.45),

    # Toss winner fields – check if toss_bat=0 path works
    ("Punjab Kings", "Sunrisers Hyderabad",
     "Hyderabad", "Sunrisers Hyderabad", "field", 0.4),
]

for i, (t1, t2, city, toss_w, toss_d, h2h) in enumerate(WINNER_CASES, 1):
    run_test(
        f"Case {i}: {t1} vs {t2} @ {city}",
        predict_match_winner,
        team1=t1, team2=t2, city=city,
        toss_winner=toss_w, toss_decision=toss_d,
        h2h_win_ratio=h2h,
    )


# ════════════════════════════════════════════════════════════════════════════
#  2. predict_innings_score  (4 cases)
# ════════════════════════════════════════════════════════════════════════════
section("2 · predict_innings_score")

SCORE_CASES = [
    # Strong batting team at home
    ("Royal Challengers Bengaluru", "Mumbai Indians",
     "Bangalore", 2024, "Royal Challengers Bengaluru", "bat"),

    # Away batting team
    ("Chennai Super Kings", "Mumbai Indians",
     "Mumbai", 2023, "Mumbai Indians", "field"),

    # Neutral venue – team fields after winning toss
    ("Kolkata Knight Riders", "Delhi Capitals",
     "Delhi", 2022, "Delhi Capitals", "field"),

    # Season edge case – earliest season in data
    ("Rajasthan Royals", "Punjab Kings",
     "Jaipur", 2008, "Rajasthan Royals", "bat"),
]

for i, (bat, bowl, city, season, toss_w, toss_d) in enumerate(SCORE_CASES, 1):
    run_test(
        f"Case {i}: {bat} batting @ {city} ({season})",
        predict_innings_score,
        batting_team=bat, bowling_team=bowl, city=city,
        season=season, toss_winner=toss_w, toss_decision=toss_d,
    )


# ════════════════════════════════════════════════════════════════════════════
#  3. evaluate_player_performance  (6 cases)
# ════════════════════════════════════════════════════════════════════════════
section("3 · evaluate_player_performance")

# Each tuple: label, innings, balls, strike_rate, avg, fours, sixes
PLAYER_CASES = [
    # Elite season (Kohli 2016-like)
    ("Elite season",     16, 480, 152.3, 81.0, 45, 16),
    # Solid allrounder season
    ("Solid allrounder", 14, 350, 140.0, 42.5, 28, 12),
    # Average season
    ("Average season",   12, 260, 125.0, 28.0, 18,  6),
    # Poor season (low innings / low avg)
    ("Poor season",       6,  90,  90.0, 11.0,  5,  1),
    # Death-overs finisher (high SR, moderate avg)
    ("Finisher role",    14, 200, 175.0, 25.0, 10, 20),
    # High innings but inconsistent
    ("Inconsistent",     16, 400, 118.0, 19.0, 22,  4),
]

for label, inn, balls, sr, avg, fours, sixes in PLAYER_CASES:
    run_test(
        label,
        evaluate_player_performance,
        innings=inn, balls_faced=balls, strike_rate=sr,
        batting_avg=avg, fours=fours, sixes=sixes,
    )


# ════════════════════════════════════════════════════════════════════════════
#  4. Edge / boundary cases
# ════════════════════════════════════════════════════════════════════════════
section("4 · Edge Cases")

# h2h_win_ratio extremes
run_test(
    "Winner · h2h_ratio=0.0 (team1 historically weak)",
    predict_match_winner,
    team1="Gujarat Titans", team2="Mumbai Indians",
    city="Mumbai", toss_winner="Mumbai Indians",
    toss_decision="bat", h2h_win_ratio=0.0,
)

run_test(
    "Winner · h2h_ratio=1.0 (team1 dominates h2h)",
    predict_match_winner,
    team1="Gujarat Titans", team2="Mumbai Indians",
    city="Mumbai", toss_winner="Mumbai Indians",
    toss_decision="bat", h2h_win_ratio=1.0,
)

# Zero-stat player (injured / 1 game)
run_test(
    "Player · single match, minimal stats",
    evaluate_player_performance,
    innings=1, balls_faced=6, strike_rate=100.0,
    batting_avg=4.0, fours=0, sixes=0,
)

print(f"\n{SEP}")
print("  All tests completed. Fix any FAIL rows before wiring to FastAPI.")
print(SEP)
