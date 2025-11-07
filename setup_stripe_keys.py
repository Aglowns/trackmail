"""
Quick script to help configure Stripe keys in .env file.
Run this to add your Stripe test keys to .env file.
"""

import os
from pathlib import Path

# Your Stripe test keys (replace with your actual keys from Stripe Dashboard)
STRIPE_SECRET_KEY = "sk_test_your_secret_key_here"
STRIPE_PUBLISHABLE_KEY = "pk_test_your_publishable_key_here"

env_file = Path(".env")

# Read existing .env file if it exists
env_vars = {}
if env_file.exists():
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                env_vars[key.strip()] = value.strip()

# Update Stripe keys
env_vars["STRIPE_SECRET_KEY"] = STRIPE_SECRET_KEY
env_vars["STRIPE_PUBLISHABLE_KEY"] = STRIPE_PUBLISHABLE_KEY

# Keep existing webhook secret if it exists
if "STRIPE_WEBHOOK_SECRET" not in env_vars:
    env_vars["STRIPE_WEBHOOK_SECRET"] = "whsec_..."  # Placeholder - you'll need to set this after webhook setup

# Write back to .env file
with open(env_file, "w") as f:
    # Write all environment variables
    for key, value in sorted(env_vars.items()):
        f.write(f"{key}={value}\n")

print("SUCCESS: Stripe keys added to .env file!")
print("\nNext steps:")
print("1. Set up webhook endpoint (see CONFIGURE_STRIPE_KEYS.md)")
print("2. Add STRIPE_WEBHOOK_SECRET to .env after webhook setup")
print("3. Restart your server")

