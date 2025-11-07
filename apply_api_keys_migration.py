"""Simple script to apply the API keys migration."""
import os
import sys
from pathlib import Path
import psycopg
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL
database_url = os.getenv("DATABASE_URL")
if not database_url:
    print("ERROR: DATABASE_URL not found in .env file")
    sys.exit(1)

# Read migration file
migration_file = Path(__file__).parent / "db" / "migrations" / "0005_add_api_keys.sql"
if not migration_file.exists():
    print(f"ERROR: Migration file not found: {migration_file}")
    sys.exit(1)

sql_content = migration_file.read_text(encoding="utf-8")

# Connect and run migration
try:
    print("Connecting to database...")
    conn = psycopg.connect(database_url)
    print("Connected successfully!")
    
    print(f"\nRunning migration: {migration_file.name}")
    print("-" * 60)
    
    with conn.cursor() as cursor:
        cursor.execute(sql_content)
    
    conn.commit()
    print("\nSUCCESS! Migration applied successfully!")
    print("\nThe api_keys table has been created.")
    print("You can now generate API keys from the Settings page.")
    
except psycopg.Error as e:
    print(f"\nERROR: Migration failed")
    print(f"Error: {e}")
    if conn:
        conn.rollback()
    sys.exit(1)
    
finally:
    if conn:
        conn.close()






