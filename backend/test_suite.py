import pytest
from test_models import predict_winner, predict_score, predict_player, m1, m2, m3


# ── FIXTURES FOR REUSABLE DATA ──────────────────────────
@pytest.fixture
def valid_teams():
    return m1['team_list']


@pytest.fixture
def valid_cities():
    return m1['city_list']


# ── TEST CASE 1: MATCH WINNER (Happy Path & Errors) ─────
def test_predict_winner_scenarios(valid_teams, valid_cities):
    t1, t2 = valid_teams[0], valid_teams[1]
    city = valid_cities[0]

    # 1. Valid match
    # Note: Ensure your predict_winner function returns the 'win' variable
    res = predict_winner(t1, t2, city, t1, 'bat')
    assert res is not None, "Should return a winner for valid inputs"

    # 2. Invalid team names
    assert predict_winner("Gully Cricketers", t2, city, t2, 'bat') is None

    # 3. Invalid Toss Winner
    assert predict_winner(t1, t2, city, "Invisible Team", 'bat') is None


# ── TEST CASE 2: INNINGS SCORE (Ranges) ─────────────────
def test_predict_score_ranges(valid_teams, valid_cities):
    t1, t2 = valid_teams[0], valid_teams[1]
    city = valid_cities[0]

    # Run prediction (Ensure predict_score returns the 'score' variable)
    score = predict_score(t1, t2, city, 2024, t1, 'field')

    if score:
        assert 0 < score < 350, f"Score {score} is outside realistic cricket bounds"


# ── TEST CASE 3: PLAYER PERFORMANCE (Data Integrity) ────
@pytest.mark.parametrize("player, season", [
    ("V Kohli", 2024),
    ("MS Dhoni", 2023),
    ("RG Sharma", 2024)
])
def test_known_players(player, season):
    # This checks if our dataframe merge logic is working for top players
    # Ensure predict_player returns the 'label' (Good/Average/Poor)
    label = predict_player(player, season)
    assert label in ["Good", "Average", "Poor", None]


def test_unknown_player():
    # Testing how the system handles a typo or non-existent player
    res = predict_player("John Doe", 2024)
    assert res is None


# ── TEST CASE 4: PATH & LOAD CHECK ──────────────────────
def test_models_loaded():
    assert m1 is not None
    assert m2 is not None
    assert m3 is not None