# backend/test_models.py
from database import SessionLocal
from models import Match, Delivery

def test_orm_mapping():
    # Open a database session
    db = SessionLocal()
    try:
        print("Testing Match model...")
        # Try to fetch exactly one match
        first_match = db.query(Match).first()
        if first_match:
            print(f"✅ Success! Found Match ID: {first_match.id} ({first_match.team1} vs {first_match.team2})")
        else:
            print("⚠️ Match table is empty, but ORM mapping is valid.")

        print("\nTesting Delivery model...")
        # Try to fetch exactly one delivery
        first_delivery = db.query(Delivery).first()
        if first_delivery:
            print(f"✅ Success! Found Delivery ID: {first_delivery.id} (Batter: {first_delivery.batter})")
        else:
            print("⚠️ Delivery table is empty, but ORM mapping is valid.")

        # Test the relationship (Can we get the match from the delivery?)
        if first_delivery and first_delivery.match:
            print(f"\n✅ Relationship Success! Delivery {first_delivery.id} belongs to Match {first_delivery.match.id}")

    except Exception as e:
        print("\n❌ ERROR: Model verification failed. The AI probably hallucinated a column.")
        print(f"Details: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_orm_mapping()