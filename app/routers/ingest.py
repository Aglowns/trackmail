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

from app.deps import CurrentUserId, FlexibleUserId  # FlexibleUserId supports both API keys and JWT
from app.schemas import EmailIngest, IngestResponse, ApplicationCreate
from app.services.parsing import EmailParser, parse_job_application_email
from app.services.emails import (
    store_email_message,
    generate_email_hash,
    check_duplicate_email,
)
from app.services.applications import create_application
from app.services import profiles as profile_service
from app.db import get_supabase_client

# Create router for email ingestion endpoints
router = APIRouter(prefix="/ingest", tags=["Email Ingestion"])


@router.post("/email", response_model=IngestResponse)
async def ingest_email(
    email_data: EmailIngest,
    user_id: FlexibleUserId,  # Supports API key (X-API-Key header) or JWT
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
    # Step 0: Ensure the user profile exists so foreign key constraints pass
    print(f"🔍 INGEST DEBUG: Starting ingestion for user_id={user_id}")
    print(f"🔍 INGEST DEBUG: Email subject={email_data.subject}, sender={email_data.sender}")
    
    try:
        profile = await profile_service.get_profile(user_id)
        if profile:
            print(f"✅ Profile exists for user {user_id}: {profile.get('email')}")
        else:
            print(f"⚠️ No profile found for user {user_id}, creating default profile...")
            profile = await profile_service.create_default_profile(user_id)
            print(f"✅ Created default profile for user {user_id}: {profile.get('email')}")
    except Exception as exc:  # pragma: no cover - log and fail fast
        print(f"❌ CRITICAL: Failed to ensure profile for {user_id}: {exc}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile error: {str(exc)}"
        )

    # Step 1: Check for duplicate email
    email_hash = generate_email_hash(email_data)
    existing_email = await check_duplicate_email(email_hash)
    
    if existing_email and existing_email.get("application_id"):
        # Duplicate found with linked application - check if status needs updating
        print(f"🔄 Duplicate email detected, checking for status update...")
        
        # Parse the new email to get the updated data
        parsed = parse_job_application_email(email_data)
        print(f"🔄 New email parsed status: {parsed.get('status')}")
        print(f"🔄 New email parsed source_url: {parsed.get('source_url')}")
        
        # Get the existing application to check current status
        from app.services.applications import get_application_by_id
        existing_app = await get_application_by_id(existing_email["application_id"], user_id)
        current_status = existing_app.get("status") if existing_app else "applied"
        print(f"🔄 Existing application status: {current_status}")
        
        # If status has changed, update the application
        needs_update = False
        update_kwargs = {}

        new_status = parsed.get("status")
        if new_status and new_status != current_status and new_status != "applied":
            needs_update = True
            update_kwargs["status"] = new_status
            update_kwargs["notes"] = (
                f"Status updated from email. Previous: {current_status}, New: {new_status}"
            )

        new_source_url = parsed.get("source_url")
        current_source_url = existing_app.get("source_url") if existing_app else None
        if new_source_url and new_source_url != current_source_url:
            needs_update = True
            update_kwargs["source_url"] = new_source_url

        if needs_update:
            from app.services.applications import update_application
            from app.schemas import ApplicationUpdate

            update_data = ApplicationUpdate(**update_kwargs)

            try:
                await update_application(existing_email["application_id"], user_id, update_data)
                print("✅ Application updated successfully from duplicate email")
                return IngestResponse(
                    success=True,
                    application_id=existing_email["application_id"],
                    message="Duplicate email detected, application updated with latest info",
                    duplicate=True,
                )
            except Exception as e:
                print(f"❌ Failed to update application from duplicate email: {e}")
                return IngestResponse(
                    success=True,
                    application_id=existing_email["application_id"],
                    message="Duplicate email detected, using existing application (update failed)",
                    duplicate=True,
                )

        print("🔄 No updates needed from duplicate email")
        return IngestResponse(
            success=True,
            application_id=existing_email["application_id"],
            message="Duplicate email detected, using existing application",
            duplicate=True,
        )
    
    # Step 2: Check if email is actually job-related BEFORE parsing
    print(f"🔍 Checking if email is job-related...")
    parser = EmailParser()
    is_job_email = parser._is_job_application(email_data)
    print(f"🔍 Job application check result: {is_job_email}")
    
    if not is_job_email:
        # Email is NOT job-related - don't track it
        print(f"❌ Email is NOT a job application. Subject: '{email_data.subject}'")
        print(f"❌ Sender: '{email_data.sender}'")
        return IngestResponse(
            success=False,
            application_id=None,
            message=(
                "This email does not appear to be a job application email. "
                "JobMail only tracks emails related to job applications, interviews, offers, and rejections. "
                "If you believe this is an error, please contact support."
            ),
            duplicate=False,
        )
    
    print(f"✅ Email is job-related, proceeding with parsing...")
    
    # Step 3: Parse email to extract application details
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
    
    # Step 5: Check for existing application with same company + position (prevent duplicates)
    company_name = parsed.get("company")
    position_name = parsed.get("position")
    
    if company_name and position_name:
        print(f"🔍 Checking for existing application: {company_name} - {position_name}")
        # Get all user's applications to check for duplicates
        try:
            from app.routers.applications import list_applications as get_user_applications
            from app.deps import CurrentUserId
            
            # Simple query to check for duplicate by company + position
            supabase = get_supabase_client()
            existing_apps = (
                supabase.table("applications")
                .select("id, company, position, status")
                .eq("user_id", user_id)
                .eq("company", company_name)
                .eq("position", position_name)
                .execute()
            )
            
            if existing_apps.data and len(existing_apps.data) > 0:
                existing_app = existing_apps.data[0]
                print(f"🔄 Duplicate application found: {existing_app['id']}")
                print(f"🔄 Existing application status: {existing_app.get('status')}")
                
                # Return duplicate response - application already exists
                return IngestResponse(
                    success=True,
                    application_id=existing_app["id"],
                    message=f"This application has already been tracked. Company: {company_name}, Position: {position_name}",
                    duplicate=True,
                )
        except Exception as dup_check_error:
            print(f"⚠️ Error checking for duplicate application: {dup_check_error}")
            # Continue with creation if duplicate check fails
    
    # Step 6: Create application
    try:
        # Map all status variations to the simplified statuses we actually use
        # This ensures old/different status names are normalized correctly
        status_map = {
            # Rejection variants
            "reject": "rejected",
            "rejection": "rejected",
            "declined": "rejected",
            "decline": "rejected",
            # Interview variants → interviewing
            "interview": "interviewing",
            "interviews": "interviewing",
            "interview_scheduled": "interviewing",
            "interview_completed": "interviewing",
            "screening": "interviewing",
            "screen": "interviewing",
            # Offer variants → offer
            "offer received": "offer",
            "offer_received": "offer",
            "offeraccepted": "offer",
            "accepted offer": "offer",
            "accepted": "offer",
            # Keep these as-is (already simplified)
            "applied": "applied",
            "interviewing": "interviewing",
            "offer": "offer",
            "rejected": "rejected",
            "withdrawn": "withdrawn",
            "wishlist": "applied",  # Map wishlist to applied for simplicity
        }
        
        # Only allow the simplified statuses that match our database enum
        allowed_statuses = {"applied", "interviewing", "offer", "rejected", "withdrawn"}
        
        raw_status = (parsed.get("status") or "").strip().lower()
        normalized_status = status_map.get(raw_status, "applied")  # Default to "applied" if unknown
        
        # Final validation: ensure it's in allowed list (should always pass after mapping)
        if normalized_status not in allowed_statuses:
            normalized_status = "applied"

        print(f"🔍 CRITICAL DEBUG: About to create application with status: '{normalized_status}' (raw: '{raw_status}')")
        print(f"🔍 CRITICAL DEBUG: parsed data keys: {list(parsed.keys())}")
        print(f"🔍 CRITICAL DEBUG: parsed status value: '{parsed.get('status')}' (type: {type(parsed.get('status'))})")
        print(f"🔍 CRITICAL DEBUG: parsed company: '{parsed.get('company')}'")
        print(f"🔍 CRITICAL DEBUG: parsed position: '{parsed.get('position')}'")
        
        app_data = ApplicationCreate(
            company=parsed["company"],
            position=parsed["position"],
            status=normalized_status,
            notes=f"Auto-created from email. Confidence: {parsed.get('confidence', 0)}",
            applied_at=email_data.received_at,  # Use email received date as applied_at
        )
        
        print(f"🔍 CRITICAL DEBUG: ApplicationCreate object created: company='{app_data.company}', position='{app_data.position}', status='{app_data.status}'")
        print(f"🔍 CRITICAL DEBUG: Calling create_application for user_id={user_id}")
        
        try:
            application = await create_application(user_id=user_id, data=app_data)
            print(f"✅ Application created successfully: {application.get('id')}")
            application_id = application["id"]
        except Exception as create_exc:
            print(f"❌ CRITICAL: create_application failed: {create_exc}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create application: {str(create_exc)}"
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ CRITICAL: Unexpected error in application creation block: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
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
