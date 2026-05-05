"""
models.py – SQLAlchemy 2.0 ORM models for the matches and deliveries tables,
and read-only mappings for the SQL views in the ipl_dashboard database.
"""

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    Numeric,
    String,
    Date,
    Float,
    CHAR,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from database import Base


class Match(Base):
    """ORM model for the `matches` table."""

    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, nullable=False)
    season = Column(Integer, nullable=False)
    city = Column(String(100))
    date = Column(Date, nullable=False)
    match_type = Column(String(50))
    player_of_match = Column(String(100))
    venue = Column(String(150))
    team1 = Column(String(100), nullable=False)
    team2 = Column(String(100), nullable=False)
    toss_winner = Column(String(100))
    toss_decision = Column(String(10))
    winner = Column(String(100))
    result = Column(String(50))
    result_margin = Column(Float)
    target_runs = Column(Float)
    target_overs = Column(Float)
    super_over = Column(CHAR(1))
    method = Column(String(20))
    umpire1 = Column(String(100))
    umpire2 = Column(String(100))

    # one-to-many: a match has many deliveries
    deliveries = relationship("Delivery", back_populates="match", lazy="select")

    def __repr__(self) -> str:
        return (
            f"<Match(id={self.id}, season={self.season}, "
            f"team1='{self.team1}', team2='{self.team2}')>"
        )


class Delivery(Base):
    """ORM model for the `deliveries` table."""

    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    inning = Column(Integer)
    batting_team = Column(String(100))
    bowling_team = Column(String(100))
    over = Column(Integer)
    ball = Column(Integer)
    batter = Column(String(100))
    bowler = Column(String(100))
    non_striker = Column(String(100))
    batsman_runs = Column(Integer)
    extra_runs = Column(Integer)
    total_runs = Column(Integer)
    extras_type = Column(String(50))
    is_wicket = Column(Integer)
    player_dismissed = Column(String(100))
    dismissal_kind = Column(String(50))
    fielder = Column(String(100))

    # many-to-one: each delivery belongs to a match
    match = relationship("Match", back_populates="deliveries", lazy="select")

    def __repr__(self) -> str:
        return (
            f"<Delivery(id={self.id}, match_id={self.match_id}, "
            f"over={self.over}, ball={self.ball})>"
        )


# ═══════════════════════════════════════════════════════════════════════════
#  READ-ONLY VIEW MODELS
# ═══════════════════════════════════════════════════════════════════════════


class BatsmanSeasonStat(Base):
    """ORM mapping for the `batsman_season_stats` SQL view."""

    __tablename__ = "batsman_season_stats"
    __table_args__ = {"info": {"is_view": True}}

    batter = Column(String(100), primary_key=True)
    season = Column(Integer, primary_key=True)
    innings = Column(Integer)
    total_runs = Column(Integer)
    balls_faced = Column(Integer)
    fours = Column(Integer)
    sixes = Column(Integer)
    strike_rate = Column(Numeric(10, 2))
    batting_avg = Column(Numeric(10, 2))

    def __repr__(self) -> str:
        return f"<BatsmanSeasonStat(batter='{self.batter}', season={self.season})>"


class BowlerSeasonStat(Base):
    """ORM mapping for the `bowler_season_stats` SQL view."""

    __tablename__ = "bowler_season_stats"
    __table_args__ = {"info": {"is_view": True}}

    bowler = Column(String(100), primary_key=True)
    season = Column(Integer, primary_key=True)
    matches_played = Column(Integer)
    wickets = Column(Integer)
    runs_conceded = Column(Integer)
    balls_bowled = Column(Integer)
    economy = Column(Numeric(10, 2))
    bowling_avg = Column(Numeric(10, 2))

    def __repr__(self) -> str:
        return f"<BowlerSeasonStat(bowler='{self.bowler}', season={self.season})>"


class PlayerSeasonStat(Base):
    """ORM mapping for the `player_season_stats` SQL view."""

    __tablename__ = "player_season_stats"
    __table_args__ = {"info": {"is_view": True}}

    player = Column(String(100), primary_key=True)
    season = Column(Integer, primary_key=True)
    innings = Column(Integer)
    total_runs = Column(Integer)
    balls_faced = Column(Integer)
    fours = Column(Integer)
    sixes = Column(Integer)
    strike_rate = Column(Numeric(10, 2))
    batting_avg = Column(Numeric(10, 2))
    matches_played = Column(Integer)
    wickets = Column(Integer)
    runs_conceded = Column(Integer)
    balls_bowled = Column(Integer)
    economy = Column(Numeric(10, 2))
    bowling_avg = Column(Numeric(10, 2))
    is_allrounder = Column(Boolean)

    def __repr__(self) -> str:
        return f"<PlayerSeasonStat(player='{self.player}', season={self.season})>"

