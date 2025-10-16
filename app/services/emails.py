"""
Email Service

Service for storing and managing email messages linked to applications.

This service handles:
- Storing incoming emails
- Deduplication logic
- Linking emails to applications
- Email retrieval and search
"""

import hashlib
import json
from datetime import datetime
from typing import Optional

from app.db import get_supabase_client
from app.schemas import EmailIngest


def generate_email_hash(email_data: EmailIngest) -> str:
    """
    Generate a unique hash for email deduplication.
    
    Uses a combination of sender, subject, and received_at to create
    a stable hash that identifies duplicate emails.
    
    Args:
        email_data: Email data to hash
        
    Returns:
        SHA256 hash as hex string
        
    Example:
        hash1 = generate_email_hash(email1)
        hash2 = generate_email_hash(email2)
        if hash1 == hash2:
            print("Duplicate email!")
    """
    # Create a canonical representation
    canonical = {
        "sender": email_data.sender.lower().strip(),
        "subject": email_data.subject.strip(),
        # Use date if provided, otherwise use current time
        "received_at": email_data.received_at.isoformat() if email_data.received_at else "",
    }
    
    # Sort keys for consistency
    canonical_str = json.dumps(canonical, sort_keys=True)
    
    # Generate SHA256 hash
    return hashlib.sha256(canonical_str.encode()).hexdigest()


async def check_duplicate_email(email_hash: str) -> Optional[dict]:
    """
    Check if an email with this hash already exists.
    
    Args:
        email_hash: SHA256 hash of the email
        
    Returns:
        Existing email record or None if not a duplicate
    """
    supabase = get_supabase_client()
    
    # Note: We're using service role key which bypasses RLS
    # In production, you might want to scope this by user
    result = (
        supabase.table("email_messages")
        .select("*")
        .eq("parsed_data->>email_hash", email_hash)
        .execute()
    )
    
    if not result.data:
        return None
    
    return result.data[0]


async def store_email_message(
    email_data: EmailIngest,
    application_id: Optional[str] = None,
) -> dict:
    """
    Store an email message in the database.
    
    This function:
    1. Generates a hash for deduplication
    2. Stores the email with all metadata
    3. Links to application if provided
    
    Args:
        email_data: Email content and metadata
        application_id: Optional application to link to
        
    Returns:
        Stored email record
        
    Raises:
        Exception: If database operation fails
    """
    supabase = get_supabase_client()
    
    # Generate hash for deduplication
    email_hash = generate_email_hash(email_data)
    
    # Prepare email record
    email_record = {
        "application_id": application_id,
        "sender": email_data.sender,
        "subject": email_data.subject,
        "text_body": email_data.text_body,
        "html_body": email_data.html_body,
        "received_at": email_data.received_at or datetime.utcnow(),
        "parsed_data": {
            "email_hash": email_hash,
            # Store pre-parsed fields if available
            "parsed_company": email_data.parsed_company,
            "parsed_position": email_data.parsed_position,
            "parsed_status": email_data.parsed_status,
        }
    }
    
    # Insert into database
    result = supabase.table("email_messages").insert(email_record).execute()
    
    if not result.data:
        raise Exception("Failed to store email message")
    
    return result.data[0]


async def get_application_emails(application_id: str) -> list[dict]:
    """
    Get all emails associated with an application.
    
    Returns emails in reverse chronological order (newest first).
    
    Args:
        application_id: UUID of the application
        
    Returns:
        List of email messages
    """
    supabase = get_supabase_client()
    
    result = (
        supabase.table("email_messages")
        .select("*")
        .eq("application_id", application_id)
        .order("received_at", desc=True)
        .execute()
    )
    
    return result.data


async def link_email_to_application(
    email_id: str,
    application_id: str
) -> Optional[dict]:
    """
    Link an existing email to an application.
    
    Useful when emails are ingested before applications are created,
    or when re-associating emails with different applications.
    
    Args:
        email_id: UUID of the email message
        application_id: UUID of the application
        
    Returns:
        Updated email record or None if not found
    """
    supabase = get_supabase_client()
    
    result = (
        supabase.table("email_messages")
        .update({"application_id": application_id})
        .eq("id", email_id)
        .execute()
    )
    
    if not result.data:
        return None
    
    return result.data[0]

