import joblib
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# ── CHANGE THESE PATHS TO MATCH YOUR FOLDER ──────────────
MATCHES_CSV    = "backend/data/all_matches.csv"
DELIVERIES_CSV = "backend/data/all_deliveries.csv"
MODEL_FOLDER   = "backend/model/"
# ─────────────────────────────────────────────────────────

print("Loading models and data...")
m1 = joblib.load(MODEL_FOLDER + "match_winner.pkl")
m2 = joblib.load(MODEL_FOLDER + "innings_score.pkl")
m3 = joblib.load(MODEL_FOLDER + "player_performance.pkl")

matches    = pd.read_csv(MATCHES_CSV)
deliveries = pd.read_csv(DELIVERIES_CSV, low_memory=False)
print("✅ Ready!\n")

# ════════════════════════════════════════════════════════
#  MODEL 1 — PREDICT MATCH WINNER
# ════════════════════════════════════════════════════════
def predict_winner(team1, team2, city, toss_winner, toss_decision):
    """
    team1, team2    : team names (must be from VALID TEAMS list)
    city            : city name  (must be from VALID CITIES list)
    toss_winner     : must be team1 or team2
    toss_decision   : 'bat' or 'field'
    """
    le_t  = m1['le_team']; le_c = m1['le_city']
    model = m1['model'];   wr   = m1['win_rates']

    if team1 not in m1['team_list']:
        print(f"❌ Unknown team: '{team1}'"); return
    if team2 not in m1['team_list']:
        print(f"❌ Unknown team: '{team2}'"); return
    if city not in m1['city_list']:
        print(f"❌ Unknown city: '{city}'\n   Valid cities: {m1['city_list']}"); return
    if toss_winner not in [team1, team2]:
        print("❌ toss_winner must be team1 or team2"); return
    if toss_decision not in ['bat', 'field']:
        print("❌ toss_decision must be 'bat' or 'field'"); return

    t1_enc  = le_t.transform([team1])[0]
    t2_enc  = le_t.transform([team2])[0]
    c_enc   = le_c.transform([city])[0]
    toss_t1 = 1 if toss_winner == team1 else 0
    toss_b  = 1 if toss_decision == 'bat' else 0
    t1_wr   = wr.get(team1, 0.5)
    t2_wr   = wr.get(team2, 0.5)

    clean = matches[matches['winner'].notna() &
                    (matches['method'].isna() | (matches['method'] == ''))].copy()
    mask  = (((clean['team1']==team1)&(clean['team2']==team2))|
             ((clean['team1']==team2)&(clean['team2']==team1)))
    h2h   = clean[mask]
    t1w   = h2h[h2h['winner']==team1]
    h2h_r = round(len(t1w)/len(h2h), 4) if len(h2h) > 0 else 0.5

    X    = pd.DataFrame([[t1_enc, t2_enc, c_enc, toss_t1, toss_b, t1_wr, t2_wr, h2h_r]],
                         columns=m1['features'])
    prob = model.predict_proba(X)[0]
    t1_p = round(float(prob[1])*100, 1)
    t2_p = round(float(prob[0])*100, 1)
    win  = team1 if t1_p > t2_p else team2

    print(f"\n{'─'*50}")
    print(f"  MATCH WINNER PREDICTION")
    print(f"{'─'*50}")
    print(f"  {team1}  vs  {team2}")
    print(f"  Venue        : {city}")
    print(f"  Toss         : {toss_winner} chose to {toss_decision}")
    print(f"  H2H Win Rate : {team1} wins {round(h2h_r*100,1)}% of the time")
    print(f"{'─'*50}")
    print(f"  🏆 Predicted Winner : {win}")
    print(f"  {team1:<35} {t1_p}%")
    print(f"  {team2:<35} {t2_p}%")
    print(f"{'─'*50}\n")
    return win


# ════════════════════════════════════════════════════════
#  MODEL 2 — PREDICT INNINGS SCORE
# ════════════════════════════════════════════════════════
def predict_score(batting_team, bowling_team, city, season, toss_winner, toss_decision):
    """
    batting_team, bowling_team : team names
    city                       : city name
    season                     : year e.g. 2024
    toss_winner                : batting_team or bowling_team
    toss_decision              : 'bat' or 'field'
    """
    le_t  = m2['le_team']; le_c = m2['le_city']
    model = m2['model']

    if batting_team not in m2['team_list']:
        print(f"❌ Unknown team: '{batting_team}'"); return
    if bowling_team not in m2['team_list']:
        print(f"❌ Unknown team: '{bowling_team}'"); return
    if city not in m2['city_list']:
        print(f"❌ Unknown city: '{city}'"); return

    bat_enc  = le_t.transform([batting_team])[0]
    bowl_enc = le_t.transform([bowling_team])[0]
    c_enc    = le_c.transform([city])[0]
    toss_b   = 1 if toss_decision == 'bat' else 0
    bat_toss = 1 if toss_winner == batting_team else 0

    X     = pd.DataFrame([[bat_enc, bowl_enc, c_enc, season, toss_b, bat_toss]],
                          columns=m2['features'])
    score = int(model.predict(X)[0])

    print(f"\n{'─'*50}")
    print(f"  INNINGS SCORE PREDICTION")
    print(f"{'─'*50}")
    print(f"  Batting      : {batting_team}")
    print(f"  Bowling      : {bowling_team}")
    print(f"  Venue        : {city}  |  Season: {season}")
    print(f"  Toss         : {toss_winner} chose to {toss_decision}")
    print(f"{'─'*50}")
    print(f"  🏏 Predicted Score : {score}")
    print(f"  Likely Range       : {score-20} – {score+20}")
    print(f"{'─'*50}\n")
    return score


# ════════════════════════════════════════════════════════
#  MODEL 3 — PREDICT PLAYER PERFORMANCE
# ════════════════════════════════════════════════════════
def predict_player(player_name, season):
    """
    player_name : exact name as in dataset e.g. 'V Kohli'
    season      : year e.g. 2024
    """
    model = m3['model']; f = m3['features']
    t     = m3['thresholds']

    bat = deliveries.merge(matches[['id','season']], left_on='match_id', right_on='id')
    ps  = bat[(bat['batter'] == player_name) & (bat['season'] == season)]

    if len(ps) == 0:
        print(f"❌ No data found for '{player_name}' in {season}")
        print(f"   Tip: Check spelling. Names are like 'V Kohli', 'RG Sharma', 'MS Dhoni'")
        return

    innings     = ps['match_id'].nunique()
    total_runs  = int(ps['batsman_runs'].sum())
    balls_faced = len(ps)
    fours       = int((ps['batsman_runs'] == 4).sum())
    sixes       = int((ps['batsman_runs'] == 6).sum())
    sr          = round(total_runs / balls_faced * 100, 2)
    avg         = round(total_runs / innings, 2)

    X     = pd.DataFrame([[innings, balls_faced, sr, avg, fours, sixes]],
                          columns=f)
    label = model.predict(X)[0]
    emoji = {"Good": "🟢", "Average": "🟡", "Poor": "🔴"}.get(str(label), "⚪")

    print(f"\n{'─'*50}")
    print(f"  PLAYER PERFORMANCE PREDICTION")
    print(f"{'─'*50}")
    print(f"  Player       : {player_name}")
    print(f"  Season       : {season}")
    print(f"{'─'*50}")
    print(f"  Innings      : {innings}")
    print(f"  Total Runs   : {total_runs}")
    print(f"  Balls Faced  : {balls_faced}")
    print(f"  Strike Rate  : {sr}")
    print(f"  Avg/Inning   : {avg}  (Poor<{t['q33']} | Avg<{t['q67']} | Good>{t['q67']})")
    print(f"  Fours/Sixes  : {fours} / {sixes}")
    print(f"{'─'*50}")
    print(f"  {emoji} Performance Label : {label}")
    print(f"{'─'*50}\n")
    return label

# ════════════════════════════════════════════════════════
#  HELPER — PRINT VALID INPUTS
# ════════════════════════════════════════════════════════
def show_valid_inputs():
    print("\n📋 VALID TEAM NAMES:")
    for t in m1['team_list']:
        print(f"   {t}")
    print("\n📋 VALID CITIES:")
    print(f"   {m1['city_list']}")

# ════════════════════════════════════════════════════════
#  RUN THIS FILE → runs sample tests
# ════════════════════════════════════════════════════════
if __name__ == "__main__":
    show_valid_inputs()

    # You can change these inputs and re-run
    predict_winner(
        team1="Mumbai Indians",
        team2="Chennai Super Kings",
        city="Mumbai",
        toss_winner="Mumbai Indians",
        toss_decision="bat"
    )

    predict_score(
        batting_team="Royal Challengers Bengaluru",
        bowling_team="Kolkata Knight Riders",
        city="Bengaluru",
        season=2024,
        toss_winner="Royal Challengers Bengaluru",
        toss_decision="bat"
    )

    predict_player("V Kohli", 2024)
    predict_player("MS Dhoni", 2023)

def test_predict_winner_output():
    # Simple test to see if it returns something or runs without crashing
    # We use valid names from your training set
    try:
        predict_winner("Mumbai Indians", "Chennai Super Kings", "Mumbai", "Mumbai Indians", "bat")
        assert True
    except Exception as e:
        assert False, f"predict_winner crashed with error: {e}"

def test_predict_score_is_positive():
    # Check if the score is a reasonable number
    # (This assumes you modify predict_score to return the value)
    pass