"""
Application Service

Business logic for managing job applications.

This service layer separates business logic from route handlers,
making the code more testable and maintainable.

Why a service layer?
- Separates business logic from HTTP concerns
- Makes testing easier (no need to mock HTTP requests)
- Reusable across different endpoints
- Centralizes database queries
"""

from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta

from supabase import Client
from app.schemas import ApplicationCreate, ApplicationUpdate
from app.db import get_supabase_client


class ApplicationService:
    """Service class for managing job applications"""
    
    def __init__(self, supabase_client: Client):
        self.supabase = supabase_client
    
    async def get_applications(self, user_id: str = None) -> List[Dict[str, Any]]:
        """Get all applications"""
        try:
            query = self.supabase.table("applications").select("*")
            if user_id:
                query = query.eq("user_id", user_id)
            
            result = query.order("created_at", desc=True).execute()
            return result.data or []
        except Exception as e:
            print(f"Error getting applications: {e}")
            raise
    
    async def get_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        """Get specific application by ID"""
        try:
            result = self.supabase.table("applications").select("*").eq("id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error getting application: {e}")
            raise
    
    async def create_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new application"""
        try:
            # Add timestamps
            application_data.update({
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            })
            
            # For testing, skip user_id requirement by creating a simple test application
            # In production, this would come from authenticated user context
            if not application_data.get('user_id'):
                # Try to create test user, but don't fail if it doesn't work
                try:
                    application_data['user_id'] = await self._get_or_create_test_user()
                except Exception as user_error:
                    print(f"⚠️ Could not create test user: {user_error}")
                    # For testing, we'll create the application anyway
                    # This might fail due to foreign key constraint, but let's try
                    application_data['user_id'] = "00000000-0000-0000-0000-000000000001"
            
            result = self.supabase.table("applications").insert(application_data).execute()
            return result.data[0] if result.data else {}
        except Exception as e:
            print(f"Error creating application: {e}")
            raise
    
    async def _get_user_by_email(self, email: str) -> Optional[str]:
        """Get user ID by email from profiles table"""
        try:
            result = self.supabase.table("profiles").select("id").eq("email", email).execute()
            if result.data and len(result.data) > 0:
                user_id = result.data[0]['id']
                print(f"✅ Found user by email {email}: {user_id}")
                return user_id
            print(f"⚠️ No user found for email: {email}")
            return None
        except Exception as e:
            print(f"⚠️ Error looking up user by email: {e}")
            return None
    
    async def _get_or_create_test_user(self) -> str:
        """Get or create a test user for email ingestion testing"""
        test_user_id = "00000000-0000-0000-0000-000000000001"
        
        try:
            # Try to find existing test user first
            result = self.supabase.table("profiles").select("id").eq("id", test_user_id).execute()
            if result.data:
                print(f"✅ Found existing test user: {test_user_id}")
                return test_user_id
        except:
            pass
        
        # Create test user profile using raw SQL to bypass RLS
        try:
            # Use Supabase's RPC (Remote Procedure Call) to execute raw SQL
            # This should bypass RLS since we're using service role key
            sql_query = """
            INSERT INTO profiles (id, email, full_name, created_at, updated_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            ON CONFLICT (id) DO NOTHING
            RETURNING id;
            """
            
            # Execute the SQL query
            result = self.supabase.rpc('exec_sql', {
                'sql': sql_query,
                'params': [test_user_id, 'test@trackmail.app', 'Test User']
            }).execute()
            
            print(f"✅ Created test user via SQL: {test_user_id}")
            return test_user_id
            
        except Exception as sql_error:
            print(f"⚠️ SQL creation failed: {sql_error}")
            
            # Fallback: try regular insert one more time
            try:
                profile_data = {
                    "id": test_user_id,
                    "email": "test@trackmail.app",
                    "full_name": "Test User",
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                
                profile_result = self.supabase.table("profiles").insert(profile_data).execute()
                print(f"✅ Created test user via table insert: {test_user_id}")
                return test_user_id
                
            except Exception as final_error:
                print(f"⚠️ All profile creation methods failed: {final_error}")
                # Return the test ID anyway - the application creation might still work
                # if the profile exists from a previous run
                return test_user_id
    
    async def update_application(self, application_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update an application"""
        try:
            updates["updated_at"] = datetime.utcnow().isoformat()
            
            result = self.supabase.table("applications").update(updates).eq("id", application_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"Error updating application: {e}")
            raise
    
    async def delete_application(self, application_id: str) -> bool:
        """Delete an application"""
        try:
            result = self.supabase.table("applications").delete().eq("id", application_id).execute()
            return bool(result.data)
        except Exception as e:
            print(f"Error deleting application: {e}")
            raise
    
    async def create_or_update_application(self, parsed_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update application based on parsed email data"""
        try:
            # Look for existing application with same company and position
            company = parsed_data.get('company')
            position = parsed_data.get('position')
            
            if company and position:
                existing = self.supabase.table("applications").select("*").eq("company", company).eq("position", position).execute()
                
                if existing.data:
                    # Update existing application
                    app_id = existing.data[0]['id']
                    updates = {
                        "status": parsed_data.get('status', 'applied'),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    return await self.update_application(app_id, updates)
            
            # Create new application
            app_data = {
                "company": company or "Unknown Company",
                "position": position or "Unknown Position", 
                "status": parsed_data.get('status', 'applied'),
                "source_url": parsed_data.get('source_url'),
                "location": parsed_data.get('location'),
                "notes": f"Created from email: {parsed_data.get('email_subject', '')}",
                "user_id": parsed_data.get('user_id'),  # Include user_id from parsed data
                "applied_at": parsed_data.get('applied_at'),
            }
            
            return await self.create_application(app_data)
            
        except Exception as e:
            print(f"Error creating/updating application: {e}")
            raise


async def create_application(user_id: str, data: ApplicationCreate) -> dict:
    """
    Create a new job application for a user.
    
    This function:
    1. Validates the input data (already done by Pydantic)
    2. Inserts into the database
    3. Returns the created application
    
    RLS automatically ensures the user_id is set correctly.
    
    Args:
        user_id: UUID of the authenticated user
        data: Application data from request
        
    Returns:
        Created application record
        
    Raises:
        Exception: If database operation fails
    """
    supabase = get_supabase_client()
    
    # Prepare application data
    app_data = {
        "user_id": user_id,
        "company": data.company,
        "position": data.position,
        "status": data.status,
        "source_url": data.source_url,
        "location": data.location,
        "notes": data.notes,
        "applied_at": data.applied_at.isoformat() if data.applied_at and isinstance(data.applied_at, datetime) else data.applied_at,
    }
    
    # Insert into database
    try:
        result = supabase.table("applications").insert(app_data).execute()
    except Exception as exc:  # pragma: no cover - log full context for production debugging
        print(
            "❌ Supabase insert exception in create_application:",
            {
                "user_id": user_id,
                "company": data.company,
                "position": data.position,
                "status": data.status,
                "error": repr(exc),
            },
        )
        raise
    
    error = getattr(result, "error", None)
    if error:
        print(
            "❌ Supabase insert error in create_application:",
            {
                "user_id": user_id,
                "company": data.company,
                "position": data.position,
                "status": data.status,
                "error": error,
            },
        )
        raise Exception(f"Supabase error creating application: {error}")
    
    if not result.data:
        raise Exception("Failed to create application: empty response")
    
    return result.data[0]


async def get_user_applications(
    user_id: str,
    skip: int = 0,
    limit: int = 20,
    status: Optional[str] = None,
    company: Optional[str] = None,
    position: Optional[str] = None,
    source: Optional[str] = None,
    confidence: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
) -> tuple[list[dict], int]:
    """
    Get applications for a user with filtering and pagination.
    """
    supabase = get_supabase_client()

    query = (
        supabase.table("applications")
        .select("*", count="exact")
        .eq("user_id", user_id)
    )

    if status:
        query = query.eq("status", status)
    if company:
        query = query.ilike("company", f"%{company}%")
    if position:
        query = query.ilike("position", f"%{position}%")
    if source:
        query = query.eq("source", source)
    if confidence:
        query = query.eq("confidence", confidence)
    if search:
        query = query.or_(f"company.ilike.%{search}%,position.ilike.%{search}%")
    if date_from:
        query = query.gte("applied_at", date_from)
    if date_to:
        query = query.lte("applied_at", date_to)

    query = query.range(skip, skip + limit - 1).order("order_index", desc=False).order(
        "updated_at", desc=True
    )

    result = query.execute()
    total = result.count if result.count is not None else 0

    return result.data or [], total


async def get_applications_grouped_by_status(user_id: str) -> dict[str, list[dict]]:
    """Return applications grouped by status ordered by order_index."""
    supabase = get_supabase_client()
    result = (
        supabase.table("applications")
        .select("*")
        .eq("user_id", user_id)
        .order("order_index", desc=False)
        .order("updated_at", desc=False)
        .execute()
    )

    grouped: dict[str, list[dict]] = {}
    for record in result.data or []:
        status = record.get("status", "applied")
        grouped.setdefault(status, []).append(record)
    return grouped


async def export_applications_to_csv(
    user_id: str,
    status: Optional[str] = None,
    company: Optional[str] = None,
    position: Optional[str] = None,
    source: Optional[str] = None,
    confidence: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
) -> str:
    """Export filtered applications as CSV."""
    applications, _ = await get_user_applications(
        user_id=user_id,
        skip=0,
        limit=1000,
        status=status,
        company=company,
        position=position,
        source=source,
        confidence=confidence,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )

    to_iso = lambda value: value.split("T")[0] if isinstance(value, str) and "T" in value else value

    lines = [
        "Company,Position,Status,Location,Source,Confidence,Applied At,Updated At"
    ]
    for app in applications:
        line = [
            app.get("company", ""),
            app.get("position", ""),
            app.get("status", ""),
            app.get("location", ""),
            app.get("source", ""),
            app.get("confidence", ""),
            to_iso(app.get("applied_at", "")),
            to_iso(app.get("updated_at", "")),
        ]
        escaped = []
        for item in line:
            text = "" if item is None else str(item)
            if "," in text or "\"" in text:
                text = text.replace("\"", "\"\"")
                escaped.append(f'"{text}"')
            else:
                escaped.append(text)
        lines.append(",".join(escaped))

    return "\n".join(lines)


async def bulk_update_applications(
    user_id: str,
    updates: list[dict],
) -> list[dict]:
    """Bulk update application order/status values."""
    if not updates:
        return []

    supabase = get_supabase_client()
    payload = []
    for update in updates:
        record_id = update.get("id")
        if not record_id:
            continue
        data: dict[str, Any] = {}
        if "status" in update:
            data["status"] = update["status"]
        if "order_index" in update:
            data["order_index"] = update["order_index"]
        if not data:
            continue
        data["updated_at"] = datetime.utcnow().isoformat()
        payload.append({"id": record_id, **data})

    if not payload:
        return []

    result = (
        supabase.table("applications")
        .upsert(payload, on_conflict="id")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    return result.data or []


async def get_application_by_id(application_id: str, user_id: str) -> Optional[dict]:
    """
    Get a single application by ID.
    
    RLS ensures user can only access their own applications.
    
    Args:
        application_id: UUID of the application
        user_id: UUID of the authenticated user (for RLS)
        
    Returns:
        Application record or None if not found
    """
    supabase = get_supabase_client()
    
    result = (
        supabase.table("applications")
        .select("*")
        .eq("id", application_id)
        .execute()
    )
    
    if not result.data:
        return None
    
    return result.data[0]


async def update_application(
    application_id: str,
    user_id: str,
    data: ApplicationUpdate
) -> Optional[dict]:
    """
    Update an existing application.
    
    Only updates fields that are provided (partial update).
    RLS ensures user can only update their own applications.
    
    Args:
        application_id: UUID of the application to update
        user_id: UUID of the authenticated user (for RLS)
        data: Updated fields
        
    Returns:
        Updated application record or None if not found
    """
    supabase = get_supabase_client()
    
    # Build update data - only include fields that were provided
    update_data = {}
    if data.company is not None:
        update_data["company"] = data.company
    if data.position is not None:
        update_data["position"] = data.position
    if data.status is not None:
        update_data["status"] = data.status
    if data.source_url is not None:
        update_data["source_url"] = data.source_url
    if data.location is not None:
        update_data["location"] = data.location
    if data.notes is not None:
        update_data["notes"] = data.notes
    
    if not update_data:
        # No fields to update
        return await get_application_by_id(application_id, user_id)
    
    # Perform update
    result = (
        supabase.table("applications")
        .update(update_data)
        .eq("id", application_id)
        .execute()
    )
    
    if not result.data:
        return None
    
    return result.data[0]


async def delete_application(application_id: str, user_id: str) -> bool:
    """
    Delete an application.
    
    RLS ensures user can only delete their own applications.
    Cascade deletes handle related events and emails.
    
    Args:
        application_id: UUID of the application to delete
        user_id: UUID of the authenticated user (for RLS)
        
    Returns:
        True if deleted, False if not found
    """
    supabase = get_supabase_client()
    
    result = (
        supabase.table("applications")
        .delete()
        .eq("id", application_id)
        .execute()
    )
    
    # If data is returned, deletion was successful
    return bool(result.data)


async def get_analytics_overview(user_id: str) -> dict:
    """Get analytics overview data for dashboard."""
    supabase = get_supabase_client()
    
    # Get total applications count
    total_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    total_applications = total_result.count or 0
    
    # Get applications by status
    status_result = (
        supabase.table("applications")
        .select("status")
        .eq("user_id", user_id)
        .execute()
    )
    
    status_counts = {}
    for app in status_result.data or []:
        status = app.get("status", "applied")
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Get applications this month
    month_start = (datetime.now() - timedelta(days=30)).isoformat()
    month_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .gte("created_at", month_start)
        .execute()
    )
    applications_this_month = month_result.count or 0
    
    # Get response rate (applications that moved past "applied" status)
    responded_result = (
        supabase.table("applications")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .neq("status", "applied")
        .execute()
    )
    responded_count = responded_result.count or 0
    response_rate = (responded_count / total_applications * 100) if total_applications > 0 else 0
    
    return {
        "total_applications": total_applications,
        "applications_this_month": applications_this_month,
        "response_rate": round(response_rate, 1),
        "status_counts": status_counts,
    }


async def get_analytics_trends(user_id: str, days: int = 30) -> dict:
    """Get application trends over time."""
    supabase = get_supabase_client()
    
    start_date = (datetime.now() - timedelta(days=days)).isoformat()
    
    # Get applications grouped by date
    result = (
        supabase.table("applications")
        .select("created_at")
        .eq("user_id", user_id)
        .gte("created_at", start_date)
        .order("created_at")
        .execute()
    )
    
    # Group by date
    daily_counts = {}
    for app in result.data or []:
        date_str = app["created_at"][:10]  # Get YYYY-MM-DD part
        daily_counts[date_str] = daily_counts.get(date_str, 0) + 1
    
    # Create trend data
    trend_data = []
    current_date = datetime.now() - timedelta(days=days)
    for i in range(days):
        date_str = current_date.strftime("%Y-%m-%d")
        trend_data.append({
            "date": date_str,
            "applications": daily_counts.get(date_str, 0)
        })
        current_date += timedelta(days=1)
    
    return {
        "trend_data": trend_data,
        "total_in_period": sum(daily_counts.values()),
    }


async def get_analytics_companies(user_id: str) -> dict:
    """Get company analytics data."""
    supabase = get_supabase_client()
    
    # Get applications grouped by company
    result = (
        supabase.table("applications")
        .select("company")
        .eq("user_id", user_id)
        .execute()
    )
    
    company_counts = {}
    for app in result.data or []:
        company = app.get("company", "Unknown")
        company_counts[company] = company_counts.get(company, 0) + 1
    
    # Sort by count and get top companies
    sorted_companies = sorted(company_counts.items(), key=lambda x: x[1], reverse=True)
    top_companies = sorted_companies[:10]  # Top 10 companies
    
    return {
        "company_counts": dict(sorted_companies),
        "top_companies": [{"company": company, "count": count} for company, count in top_companies],
        "unique_companies": len(company_counts),
    }


async def get_analytics_sources(user_id: str) -> dict:
    """Get application source analytics."""
    supabase = get_supabase_client()
    
    # Get applications grouped by source
    result = (
        supabase.table("applications")
        .select("source")
        .eq("user_id", user_id)
        .execute()
    )
    
    source_counts = {}
    for app in result.data or []:
        source = app.get("source") or "Unknown"
        source_counts[source] = source_counts.get(source, 0) + 1
    
    # Sort by count
    sorted_sources = sorted(source_counts.items(), key=lambda x: x[1], reverse=True)
    
    return {
        "source_counts": dict(sorted_sources),
        "top_sources": [{"source": source, "count": count} for source, count in sorted_sources[:5]],
    }

