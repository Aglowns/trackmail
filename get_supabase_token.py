import requests
import getpass

SUPABASE_URL = "https://fvpggfqkmldgwjbanwyr.supabase.co"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2cGdnZnFrbWxkZ3dqYmFud3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNzY5MjIsImV4cCI6MjA3NTg1MjkyMn0.bqVIUz4t-s6Tc-tmglITDTm1KeY5panOfTKkFzzqTwQ"
EMAIL = "aglonoop@gmail.com"

password = getpass.getpass("Enter password for Supabase user aglonoop@gmail.com: ")

resp = requests.post(
    f"{SUPABASE_URL}/auth/v1/token",
    params={"grant_type": "password"},
    headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
    json={"email": EMAIL, "password": password},
)

print("Status:", resp.status_code)

try:
    data = resp.json()
except Exception:
    data = None

if resp.ok and data and "access_token" in data:
    print("\nJWT token:\n" + data["access_token"])
else:
    print("\nResponse body:\n", resp.text)
