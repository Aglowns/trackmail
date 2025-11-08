"""
Script to add SUPABASE_JWT_SECRET to .env file
Run this and paste your JWT secret when prompted
"""

import os
from pathlib import Path

env_file = Path(".env")

print("Please paste your Supabase JWT secret (from Supabase Dashboard > Settings > API > JWT Secret):")
jwt_secret = input().strip()

if not jwt_secret:
    print("Error: No JWT secret provided")
    exit(1)

# Read existing .env
env_vars = {}
if env_file.exists():
    with open(env_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env_vars[key.strip()] = value.strip()

# Add or update JWT secret
env_vars["SUPABASE_JWT_SECRET"] = jwt_secret

# Write back to .env
with open(env_file, "w", encoding="utf-8") as f:
    for key, value in env_vars.items():
        f.write(f"{key}={value}\n")

print("\nSUCCESS: SUPABASE_JWT_SECRET added to .env file")
print("\nNow restart your backend server:")
print("  python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")

