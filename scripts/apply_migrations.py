#!/usr/bin/env python3
"""
Database Migration Script

This script applies SQL migrations to your Supabase database.

Usage:
    python scripts/apply_migrations.py

The script:
1. Loads environment variables from .env
2. Connects to PostgreSQL using DATABASE_URL
3. Runs all SQL files in db/migrations/ in order
4. Prints success/error messages

Educational Notes:
- Migrations should be idempotent (safe to run multiple times)
- Use transactions to ensure all-or-nothing application
- Migrations run in alphabetical order (hence 0001_, 0002_, etc.)
"""

import os
import sys
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv


def ensure_migrations_table(conn: psycopg.Connection) -> None:
    with conn.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL UNIQUE,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        conn.commit()


def get_applied_migrations(conn: psycopg.Connection) -> set[str]:
    with conn.cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT filename FROM migration_history")
        rows = cursor.fetchall()
    return {row["filename"] for row in rows}


def record_migration(conn: psycopg.Connection, filename: str) -> None:
    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO migration_history (filename) VALUES (%s) ON CONFLICT DO NOTHING",
            (filename,),
        )
        conn.commit()


def get_migration_files(migrations_dir: Path) -> list[Path]:
    """
    Get all SQL migration files in order.
    
    Args:
        migrations_dir: Path to migrations directory
        
    Returns:
        Sorted list of migration file paths
    """
    # Find all .sql files
    sql_files = list(migrations_dir.glob("*.sql"))
    
    # Sort alphabetically (0001_init.sql, 0002_add_feature.sql, etc.)
    sql_files.sort()
    
    return sql_files


def run_migration(conn: psycopg.Connection, migration_file: Path) -> None:
    """
    Run a single migration file.
    
    Args:
        conn: PostgreSQL connection
        migration_file: Path to SQL file
        
    Raises:
        psycopg.Error: If migration fails
    """
    print(f"📄 Running migration: {migration_file.name}")
    
    # Read SQL file
    sql_content = migration_file.read_text(encoding="utf-8")
    
    # Execute SQL
    # The migration file includes BEGIN/COMMIT, so we don't need another transaction
    with conn.cursor() as cursor:
        cursor.execute(sql_content)
    
    print(f"✅ Migration {migration_file.name} completed successfully")


def main() -> int:
    """
    Main function to run all migrations.
    
    Returns:
        Exit code (0 for success, 1 for error)
    """
    print("🚀 TrackMail Database Migration Script")
    print("=" * 60)
    
    # Load environment variables from .env
    load_dotenv()
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ ERROR: DATABASE_URL not found in environment")
        print("   Make sure you have a .env file with DATABASE_URL set")
        print("   See SUPABASE_SETUP.md for instructions")
        return 1
    
    # Get migrations directory
    # This script is in scripts/, migrations are in db/migrations/
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    migrations_dir = project_root / "db" / "migrations"
    
    if not migrations_dir.exists():
        print(f"❌ ERROR: Migrations directory not found: {migrations_dir}")
        return 1
    
    # Get migration files
    migration_files = get_migration_files(migrations_dir)
    
    if not migration_files:
        print(f"⚠️  WARNING: No migration files found in {migrations_dir}")
        return 0
    
    print(f"\n📋 Found {len(migration_files)} migration(s):")
    for mig_file in migration_files:
        print(f"   - {mig_file.name}")
    print()
    
    # Connect to database
    try:
        print("🔌 Connecting to database...")
        conn = psycopg.connect(database_url)
        print("✅ Connected successfully")
        print()
        
    except psycopg.Error as e:
        print(f"❌ ERROR: Failed to connect to database")
        print(f"   Error: {e}")
        print("\n   Troubleshooting:")
        print("   1. Verify DATABASE_URL in .env is correct")
        print("   2. Check your database password")
        print("   3. Ensure your IP is allowed in Supabase")
        return 1
    
    # Run each migration
    try:
        ensure_migrations_table(conn)
        applied = get_applied_migrations(conn)

        for migration_file in migration_files:
            if migration_file.name in applied:
                print(f"⏭️  Skipping {migration_file.name} (already applied)")
                print()
                continue

            run_migration(conn, migration_file)
            record_migration(conn, migration_file.name)
            print()
        
        # Commit changes
        conn.commit()
        print("=" * 60)
        print("🎉 All migrations completed successfully!")
        print()
        print("Next steps:")
        print("  1. Verify tables in Supabase dashboard → Table Editor")
        print("  2. Check RLS policies → Table → RLS Policies")
        print("  3. Start the API server: uvicorn app.main:app --reload")
        print()
        
        return 0
        
    except psycopg.Error as e:
        print(f"❌ ERROR: Migration failed")
        print(f"   Error: {e}")
        print("\n   The migration has been rolled back.")
        conn.rollback()
        return 1
        
    finally:
        # Always close connection
        conn.close()


if __name__ == "__main__":
    sys.exit(main())

