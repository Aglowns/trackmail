"""
Data Models (Future Use)

This module is reserved for ORM models if we decide to use SQLAlchemy
or another ORM in the future.

For now, we're using Supabase's client library and direct SQL queries,
which don't require ORM models.

Potential future use:
- SQLAlchemy models for type-safe database operations
- Alembic migrations instead of raw SQL
- Advanced query building with ORM

Current approach:
- Direct SQL in migrations (db/migrations/)
- Supabase client for CRUD operations
- Pydantic schemas for validation (schemas.py)
"""

# Placeholder for future ORM models

