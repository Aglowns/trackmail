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
from typing import Optional, List, Dict, Any

from supabase import Client
from app.schemas import EmailIngest


class EmailService:
    """Service class for managing email messages"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def store_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """Store an email message"""
        try:
            # Generate hash for deduplication
            email_hash = self._generate_email_hash(email_data)
            
            # Check for duplicates
            existing = await self._check_duplicate_email(email_hash)
            if existing:
                print(f"Duplicate email detected: {email_hash}")
                # Update existing record with latest parsed fields (status, confidence, etc.)
                updated_parsed_data = existing.get("parsed_data", {})
                updated_parsed_data.update({
                    "parsed_company": email_data.get('parsed_company', updated_parsed_data.get('parsed_company')),
                    "parsed_position": email_data.get('parsed_position', updated_parsed_data.get('parsed_position')),
                    "parsed_status": email_data.get('parsed_status', updated_parsed_data.get('parsed_status')),
                    "normalized_status": email_data.get('normalized_status', updated_parsed_data.get('normalized_status')),
                    "confidence": email_data.get('confidence', updated_parsed_data.get('confidence', 0.0)),
                    "status_confidence": email_data.get('status_confidence', updated_parsed_data.get('status_confidence')),
                    "status_indicators": email_data.get('status_indicators', updated_parsed_data.get('status_indicators')),
                    "status_reasoning": email_data.get('status_reasoning', updated_parsed_data.get('status_reasoning')),
                })

                updates = {
                    "parsed_data": updated_parsed_data,
                    "text_body": email_data.get('text_body', existing.get('text_body')),
                    "html_body": email_data.get('html_body', existing.get('html_body')),
                    "received_at": email_data.get('received_at', existing.get('received_at')),
                }

                result = (
                    self.supabase
                    .table("email_messages")
                    .update(updates)
                    .eq("id", existing["id"])
                    .execute()
                )

                return result.data[0] if result.data else existing
            
            # Prepare email record
            received_at = email_data.get('received_at')
            email_record = {
                "sender": email_data.get('sender', ''),
                "subject": email_data.get('subject', ''),
                "text_body": email_data.get('text_body', ''),
                "html_body": email_data.get('html_body', ''),
                "received_at": received_at or datetime.utcnow().isoformat(),
        "received_at": email_data.get('received_at', datetime.utcnow().isoformat()),
                "parsed_data": {
                    "email_hash": email_hash,
                    "parsed_company": email_data.get('parsed_company'),
                    "parsed_position": email_data.get('parsed_position'),
                    "parsed_status": email_data.get('parsed_status'),
                    "normalized_status": email_data.get('normalized_status'),
                    "is_job_application": email_data.get('is_job_application', False),
                    "confidence": email_data.get('confidence', 0.0),
                    "status_confidence": email_data.get('status_confidence'),
                    "status_indicators": email_data.get('status_indicators'),
                    "status_reasoning": email_data.get('status_reasoning'),
                }
            }
            
            result = self.supabase.table("email_messages").insert(email_record).execute()
            return result.data[0] if result.data else {}
            
        except Exception as e:
            print(f"Error storing email: {e}")
            raise
    
    async def get_emails(self, application_id: str = None) -> List[Dict[str, Any]]:
        """Get emails, optionally filtered by application"""
        try:
            query = self.supabase.table("email_messages").select("*")
            if application_id:
                query = query.eq("application_id", application_id)
            
            result = query.order("received_at", desc=True).execute()
            return result.data or []
            
        except Exception as e:
            print(f"Error getting emails: {e}")
            raise
    
    async def link_to_application(self, email_id: str, application_id: str) -> Optional[Dict[str, Any]]:
        """Link an email to an application"""
        try:
            result = self.supabase.table("email_messages").update({"application_id": application_id}).eq("id", email_id).execute()
            return result.data[0] if result.data else None
            
        except Exception as e:
            print(f"Error linking email to application: {e}")
            raise
    
    def _generate_email_hash(self, email_data: Dict[str, Any]) -> str:
        """Generate hash for email deduplication"""
        canonical = {
            "sender": email_data.get('sender', '').lower().strip(),
            "subject": email_data.get('subject', '').strip(),
            "received_at": email_data.get('received_at', ''),
        }
        canonical_str = json.dumps(canonical, sort_keys=True)
        return hashlib.sha256(canonical_str.encode()).hexdigest()
    
    async def _check_duplicate_email(self, email_hash: str) -> Optional[Dict[str, Any]]:
        """Check if email already exists"""
        try:
            result = self.supabase.table("email_messages").select("*").eq("parsed_data->>email_hash", email_hash).execute()
            return result.data[0] if result.data else None
        except:
            return None


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

