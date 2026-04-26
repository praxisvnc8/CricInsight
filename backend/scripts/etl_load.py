import pandas as pd
from sqlalchemy import create_engine, text

# ── CONFIG ──────────────────────────────────────────────
DB_URL = "postgresql://leviackerman:tsatmacomf@localhost:5432/ipl_dashboard"
engine = create_engine(DB_URL)

# ── EXTRACT ─────────────────────────────────────────────
print("Reading CSVs...")
matches = pd.read_csv('../data/all_matches.csv')
deliveries = pd.read_csv('../data/all_deliveries.csv', low_memory=False)

# ── TRANSFORM: MATCHES ──────────────────────────────────
print("Transforming matches...")

# Fix date column to proper datetime
matches['date'] = pd.to_datetime(matches['date'])

# Fix result_margin — mixed type, cast to float
matches['result_margin'] = pd.to_numeric(matches['result_margin'], errors='coerce')

# Normalize NaN → None for SQL NULL
matches['city'] = matches['city'].where(matches['city'].notna(), None)
matches['winner'] = matches['winner'].where(matches['winner'].notna(), None)
matches['method'] = matches['method'].where(matches['method'].notna(), None)
matches['player_of_match'] = matches['player_of_match'].where(matches['player_of_match'].notna(), None)
matches['toss_winner'] = matches['toss_winner'].where(matches['toss_winner'].notna(), None)
matches['umpire1'] = matches['umpire1'].where(matches['umpire1'].notna(), None)
matches['umpire2'] = matches['umpire2'].where(matches['umpire2'].notna(), None)

# ── TRANSFORM: DELIVERIES ───────────────────────────────
print("Transforming deliveries...")

# Shift over to be 1-indexed for display (0→19 becomes 1→20)
deliveries['over'] = deliveries['over'] + 1

# Normalize nullable string columns
for col in ['extras_type', 'player_dismissed', 'dismissal_kind', 'fielder', 'non_striker']:
    deliveries[col] = deliveries[col].where(deliveries[col].notna(), None)

# with engine.connect() as conn:
#     conn.execute(text("TRUNCATE TABLE matches CASCADE;"))
#     conn.execute(text("TRUNCATE TABLE deliveries CASCADE;"))
#     conn.commit()
#
# ── LOAD ────────────────────────────────────────────────
print("Loading matches into PostgreSQL...")
matches.to_sql(
    'matches',
    engine,
    if_exists='replace',   # use 'replace' to re-run fresh
    index=False,
    chunksize=500
)

print("Loading deliveries into PostgreSQL...")
deliveries.to_sql(
    'deliveries',
    engine,
    if_exists='replace', # keeping it to replace for now for testing safety
    index=False,
    chunksize=1000
)

print("✅ ETL Complete!")
print(f"   Matches loaded : {len(matches)}")
print(f"   Deliveries loaded: {len(deliveries)}")