# backend/test_schemas.py
from pydantic import ValidationError
import sys

# Add current dir to path just in case you run this from outside the backend folder
sys.path.insert(0, ".") 

try:
    from schemas import MatchWinnerRequest
except ImportError:
    print("⚠️  Check your import names! Could not find 'MatchWinnerRequest' in schemas.py.")
    sys.exit(1)

def test_pydantic_validation():
    print("🛡️  Testing Pydantic Schemas...\n")

    # --- Test 1: Valid Data ---
    try:
        print("Test 1: Sending VALID data to the ML Request Schema...")
        
        # FIXED: Changed 'venue' to 'city' and added 'toss_decision'
        valid_data = {
            "team1": "Mumbai Indians",
            "team2": "Chennai Super Kings",
            "city": "Mumbai",
            "toss_winner": "Mumbai Indians",
            "toss_decision": "bat"
            # Note: if your schema requires h2h_win_ratio from the user, add it here!
        }
        
        request_obj = MatchWinnerRequest(**valid_data)
        print("✅ SUCCESS: Pydantic accepted the data!")
        print(f"   Parsed Object: {request_obj}\n")
        
    except ValidationError as ve:
        print(f"❌ ERROR: Pydantic rejected valid data.\nDetails:")
        for error in ve.errors():
            print(f"   -> Field '{error['loc'][0]}': {error['msg']}")
        print("\n")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}\n")

    # --- Test 2: Invalid Data (Catching errors) ---
    try:
        print("Test 2: Sending INVALID data (missing required fields)...")
        
        # Intentionally leaving out 'team2', 'city', 'toss_winner', and 'toss_decision'
        invalid_data = {
            "team1": "Mumbai Indians"
        }
        
        MatchWinnerRequest(**invalid_data)
        print("❌ ERROR: Pydantic allowed bad data through! Your schema might be too loose.\n")
        
    except ValidationError as ve:
        print("✅ SUCCESS: Pydantic successfully blocked the bad data as expected!")
        for error in ve.errors():
            print(f"   -> Blocked Field '{error['loc'][0]}': {error['msg']}")
        print("\n")
    except Exception as e:
        print(f"❌ UNEXPECTED ERROR: {e}\n")

if __name__ == "__main__":
    test_pydantic_validation()