# backend/test_db.py
from sqlalchemy import text
from database import engine

def test_connection():
    try:
        # We use a context manager (with) to ensure the connection closes automatically
        with engine.connect() as connection:
            # Run a simple query to ensure the database responds
            result = connection.execute(text("SELECT version();"))
            db_version = result.fetchone()
            
            print("\n✅ SUCCESS: Connected to the database!")
            print(f"📦 PostgreSQL Version: {db_version[0]}\n")
            
    except Exception as e:
        print("\n❌ ERROR: Could not connect to the database.")
        print(f"Details: {e}\n")

if __name__ == "__main__":
    test_connection()