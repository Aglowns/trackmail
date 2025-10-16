"""
Database Connection Management

This module provides utilities for connecting to Supabase and PostgreSQL.

Two connection methods:
1. Supabase Client - Uses Supabase SDK with automatic auth handling
2. Direct PostgreSQL - Uses psycopg for migrations and complex queries

Why both?
- Supabase Client: Easier for CRUD operations, respects RLS automatically
- Direct PostgreSQL: Needed for migrations, bulk operations, and bypassing RLS
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import psycopg
from supabase import Client, create_client

from app.config import settings


def get_supabase_client() -> Client:
    """
    Create a Supabase client instance.
    
    The Supabase client provides:
    - Automatic JWT handling
    - RLS-aware queries
    - Built-in authentication methods
    - Real-time subscriptions
    
    This uses the service role key to bypass RLS for backend operations.
    For user-specific operations, you'd typically use the anon key with a user JWT.
    
    Returns:
        Client: Configured Supabase client
        
    Example:
        >>> supabase = get_supabase_client()
        >>> response = supabase.table("applications").select("*").execute()
    """
    return create_client(
        supabase_url=settings.supabase_url,
        # Using service role key for backend operations
        # This bypasses Row-Level Security policies
        supabase_key=settings.supabase_service_role_key,
    )


@asynccontextmanager
async def get_db_connection() -> AsyncGenerator[psycopg.AsyncConnection, None]:
    """
    Context manager for direct PostgreSQL connections.
    
    This provides a raw psycopg connection for:
    - Running migrations
    - Bulk operations
    - Complex queries that need direct SQL
    
    The connection is automatically closed when the context exits.
    
    Yields:
        AsyncConnection: PostgreSQL connection
        
    Example:
        >>> async with get_db_connection() as conn:
        ...     async with conn.cursor() as cur:
        ...         await cur.execute("SELECT * FROM applications")
        ...         results = await cur.fetchall()
    """
    # Create async connection to PostgreSQL
    conn = await psycopg.AsyncConnection.connect(
        conninfo=settings.database_url,
        # Auto-commit mode for simple operations
        autocommit=False,
    )
    
    try:
        # Yield connection to caller
        yield conn
    finally:
        # Always close connection, even if an error occurred
        await conn.close()


def get_sync_db_connection() -> psycopg.Connection:
    """
    Create a synchronous PostgreSQL connection.
    
    Used primarily for migration scripts that don't need async.
    For API endpoints, prefer get_db_connection() (async version).
    
    Returns:
        Connection: Synchronous PostgreSQL connection
        
    Example:
        >>> conn = get_sync_db_connection()
        >>> try:
        ...     with conn.cursor() as cur:
        ...         cur.execute("SELECT * FROM applications")
        ...         results = cur.fetchall()
        ... finally:
        ...     conn.close()
    """
    return psycopg.connect(
        conninfo=settings.database_url,
        autocommit=False,
    )

