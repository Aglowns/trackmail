"""
Email Ingestion Router

This router handles email forwarding and parsing:
- Receive forwarded emails via webhook or direct submission
- Parse email content to extract application information
- Create or update applications based on email content
- Store email messages for reference
- Handle deduplication to prevent duplicate entries

This is the core endpoint that the Gmail Add-on or email forwarding service calls.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import CurrentUserId
from app.schemas import EmailIngest, IngestResponse, ApplicationCreate
from app.services.parsing import parse_job_application_email
from app.services.emails import (
    store_email_message,
    generate_email_hash,
    check_duplicate_email,
)
from app.services.applications import create_application

# Create router for email ingestion endpoints
router = APIRouter(prefix="/ingest", tags=["Email Ingestion"])


@router.post("/email", response_model=IngestResponse)
async def ingest_email(
    email_data: EmailIngest,
    user_id: CurrentUserId,
) -> IngestResponse:
    """
    Receive and process a forwarded job application email.
    
    This endpoint:
    1. Checks for duplicate emails
    2. Parses the email to extract application details
    3. Creates a new application (or updates existing)
    4. Stores the email message for reference
    5. Returns the created application ID
    
    Idempotency:
    - Duplicate emails (same sender, subject, date) are detected
    - Returns the existing application ID instead of creating duplicates
    
    Args:
        email_data: Email content (sender, subject, body, etc.)
        user_id: Automatically extracted from JWT token
        
    Returns:
        Ingestion result with application ID and duplicate flag
        
    Example Request:
        POST /ingest/email
        {
            "sender": "jobs@acme.com",
            "subject": "Application Received - Software Engineer",
            "text_body": "Thank you for applying to Acme Corp...",
            "html_body": "<html>...</html>",
            "received_at": "2025-10-13T10:00:00Z",
            "parsed_company": "Acme Corp",  // Optional: pre-parsed
            "parsed_position": "Software Engineer",  // Optional: pre-parsed
            "parsed_status": "applied"  // Optional: pre-parsed
        }
        
    Example Response (new):
        {
            "success": true,
            "application_id": "123e4567-e89b-12d3-a456-426614174000",
            "message": "Application created successfully",
            "duplicate": false
        }
        
    Example Response (duplicate):
        {
            "success": true,
            "application_id": "existing-uuid",
            "message": "Duplicate email detected, using existing application",
            "duplicate": true
        }
    """
    # Step 1: Check for duplicate email
    email_hash = generate_email_hash(email_data)
    existing_email = await check_duplicate_email(email_hash)
    
    if existing_email and existing_email.get("application_id"):
        # Duplicate found with linked application
        return IngestResponse(
            success=True,
            application_id=existing_email["application_id"],
            message="Duplicate email detected, using existing application",
            duplicate=True,
        )
    
    # Step 2: Parse email to extract application details
    print(f"Email data received: {email_data}")
    print(f"Detected status: {getattr(email_data, 'detected_status', 'NOT_SET')}")
    print(f"Parsed status: {getattr(email_data, 'parsed_status', 'NOT_SET')}")
    print(f"Parsed company: {getattr(email_data, 'parsed_company', 'NOT_SET')}")
    print(f"Parsed position: {getattr(email_data, 'parsed_position', 'NOT_SET')}")
    
    # Debug: Print all attributes of email_data
    print(f"All email_data attributes: {dir(email_data)}")
    if hasattr(email_data, 'detected_status'):
        print(f"detected_status value: '{email_data.detected_status}' (type: {type(email_data.detected_status)})")
    if hasattr(email_data, 'parsed_status'):
        print(f"parsed_status value: '{email_data.parsed_status}' (type: {type(email_data.parsed_status)})")
    
    parsed = parse_job_application_email(email_data)
    print(f"Final parsed result: {parsed}")
    
    # Step 3: Validate parsed data
    if not parsed.get("company") or not parsed.get("position"):
        # Couldn't extract enough information
        # Still store the email for manual processing
        email_record = await store_email_message(
            email_data=email_data,
            application_id=None,
        )
        
        return IngestResponse(
            success=False,
            application_id=None,
            message=(
                f"Could not extract sufficient information from email. "
                f"Company: {parsed.get('company')}, Position: {parsed.get('position')}. "
                f"Email saved for manual review."
            ),
            duplicate=False,
        )
    
    # Step 4: Create application
    try:
        app_data = ApplicationCreate(
            company=parsed["company"],
            position=parsed["position"],
            status=parsed.get("status", "applied"),
            notes=f"Auto-created from email. Confidence: {parsed.get('confidence', 0)}",
        )
        
        application = await create_application(user_id=user_id, data=app_data)
        application_id = application["id"]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application: {str(e)}"
        )
    
    # Step 5: Store email message linked to application
    try:
        await store_email_message(
            email_data=email_data,
            application_id=application_id,
        )
    except Exception as e:
        # Application created but email storage failed
        # Don't fail the request, just log the error
        print(f"Warning: Failed to store email message: {e}")
    
    # Prepare status detection information for response
    status_detection = None
    if hasattr(email_data, 'detected_status') and email_data.detected_status:
        status_detection = {
            'detected_status': email_data.detected_status,
            'confidence': email_data.status_confidence,
            'indicators': email_data.status_indicators,
            'reasoning': email_data.status_reasoning,
            'is_job_related': email_data.is_job_related,
            'urgency': email_data.urgency
        }
    
    response = IngestResponse(
        success=True,
        application_id=application_id,
        message=f"Application created successfully from email (confidence: {parsed.get('confidence', 0)})",
        duplicate=False,
    )
    
    # Add status detection to response if available
    if status_detection:
        response_dict = response.dict()
        response_dict['status_detection'] = status_detection
        return response_dict
    
    return response


@router.post("/email/test", response_model=dict)
async def test_email_parsing(
    email_data: EmailIngest,
    user_id: CurrentUserId,
) -> dict:
    """
    Test email parsing without actually storing data.
    
    Useful for:
    - Testing parsing logic with different email formats
    - Debugging extraction issues
    - Previewing what would be extracted before ingesting
    
    This endpoint does NOT create applications or store emails.
    
    Args:
        email_data: Email content to parse
        user_id: Automatically extracted from JWT token
        
    Returns:
        Parsed application details and confidence score
        
    Example Request:
        POST /ingest/email/test
        {
            "sender": "jobs@acme.com",
            "subject": "Application Received - Software Engineer",
            "text_body": "Thank you for applying..."
        }
        
    Example Response:
        {
            "parsed": {
                "company": "Acme",
                "position": "Software Engineer",
                "status": "applied",
                "confidence": 0.67
            },
            "email_hash": "abc123...",
            "would_create_duplicate": false
        }
    """
    # Parse the email
    parsed = parse_job_application_email(email_data)
    
    # Check if it would be a duplicate
    email_hash = generate_email_hash(email_data)
    existing_email = await check_duplicate_email(email_hash)
    
    return {
        "parsed": parsed,
        "email_hash": email_hash,
        "would_create_duplicate": existing_email is not None,
        "existing_application_id": existing_email.get("application_id") if existing_email else None,
        "note": "This is a test - no data was stored",
    }
