"""
Pydantic Schemas for Request/Response Validation

Schemas define the structure of data for API requests and responses.
Pydantic automatically validates incoming data against these schemas.

Benefits:
- Type safety: Ensures data matches expected structure
- Automatic validation: Rejects invalid requests before they reach your code
- Documentation: Auto-generates OpenAPI/Swagger docs
- Serialization: Converts between Python objects and JSON
"""

from datetime import datetime
from typing import Optional, Any
from uuid import UUID

from pydantic import BaseModel, Field, EmailStr, ConfigDict


# Application Status Enum
class ApplicationStatus:
    """
    Valid application status values.
    
    These match the database enum type defined in the migration.
    Enhanced with AI-detected status categories.
    """
    WISHLIST = "wishlist"
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEWING = "interviewing"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFER = "offer"
    OFFER_RECEIVED = "offer_received"
    REJECTED = "rejected"
    ACCEPTED = "accepted"
    WITHDRAWN = "withdrawn"


# Application Schemas
class ApplicationBase(BaseModel):
    """Base schema with fields common to all application operations."""
    company: str = Field(..., min_length=1, max_length=255, description="Company name")
    position: str = Field(..., min_length=1, max_length=255, description="Job title")
    status: str = Field(default=ApplicationStatus.APPLIED, description="Application status")
    source_url: Optional[str] = Field(None, description="URL to job posting")
    location: Optional[str] = Field(None, description="Job location")
    notes: Optional[str] = Field(None, description="User notes")
    applied_at: Optional[datetime] = Field(None, description="When the application was first received")


class ApplicationCreate(ApplicationBase):
    """Schema for creating a new application (Stage 4)."""
    pass


class ApplicationUpdate(BaseModel):
    """Schema for updating an application (Stage 4)."""
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    position: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = None
    source_url: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class ProfileBase(BaseModel):
    full_name: Optional[str] = None
    profession: Optional[str] = None
    phone: Optional[str] = None
    notification_email: Optional[str] = None
    job_preferences: Optional[dict[str, Any]] = None


class ProfileResponse(ProfileBase):
    id: UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime


class ProfileUpdate(ProfileBase):
    pass


class ApplicationResponse(ApplicationBase):
    """Schema for application responses."""
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Event Schemas
class EventCreate(BaseModel):
    """Schema for creating an application event (Stage 4)."""
    event_type: str = Field(..., description="Type of event")
    status: Optional[str] = Field(None, description="Associated status")
    notes: Optional[str] = Field(None, description="Event notes")
    metadata: Optional[dict] = Field(None, description="Additional metadata")


class EventResponse(BaseModel):
    """Schema for event responses."""
    id: UUID
    application_id: UUID
    event_type: str
    status: Optional[str]
    notes: Optional[str]
    metadata: Optional[dict]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Email Schemas
class EmailIngest(BaseModel):
    """Schema for ingesting forwarded emails (Stage 4)."""
    sender: str = Field(..., description="Email sender")
    subject: str = Field(..., description="Email subject")
    text_body: Optional[str] = Field(None, description="Plain text body")
    html_body: Optional[str] = Field(None, description="HTML body")
    received_at: Optional[datetime] = Field(None, description="When email was received")
    
    # Gmail-specific fields (for Gmail Add-on integration)
    message_id: Optional[str] = Field(None, description="Gmail message ID")
    thread_id: Optional[str] = Field(None, description="Gmail thread ID")
    raw_rfc822: Optional[str] = Field(None, description="Raw RFC822 email content")
    
    # Optional: Pre-parsed data (if Gmail add-on already extracted info)
    parsed_company: Optional[str] = Field(None, description="Pre-extracted company name")
    parsed_position: Optional[str] = Field(None, description="Pre-extracted position")
    parsed_status: Optional[str] = Field(None, description="Pre-extracted status")
    parsed_job_url: Optional[str] = Field(None, description="Pre-extracted job posting URL")
    
    # Enhanced: AI Status Detection fields
    detected_status: Optional[str] = Field(None, description="AI-detected job application status")
    status_confidence: Optional[float] = Field(None, description="Confidence score for status detection (0-100)")
    status_indicators: Optional[list[str]] = Field(None, description="Key phrases that led to status detection")
    status_reasoning: Optional[str] = Field(None, description="AI reasoning for status detection")
    is_job_related: Optional[bool] = Field(None, description="Whether email is job-related")
    urgency: Optional[str] = Field(None, description="Urgency level: low, medium, high")


class EmailResponse(BaseModel):
    """Schema for email message responses."""
    id: UUID
    application_id: Optional[UUID]
    sender: str
    subject: str
    received_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IngestResponse(BaseModel):
    """Response from email ingestion endpoint."""
    success: bool = Field(..., description="Whether ingestion succeeded")
    application_id: Optional[UUID] = Field(None, description="Created/updated application ID")
    message: str = Field(..., description="Human-readable message")
    duplicate: bool = Field(default=False, description="Whether this was a duplicate")
    status_detection: Optional[dict] = Field(None, description="AI status detection information")


# Pagination Schema
class PaginatedResponse(BaseModel):
    """Generic paginated response wrapper."""
    items: list = Field(..., description="List of items")
    total: int = Field(..., description="Total number of items")
    skip: int = Field(..., description="Number of items skipped")
    limit: int = Field(..., description="Maximum items per page")


# Health Check Schema
class HealthResponse(BaseModel):
    """Schema for health check responses."""
    status: str = Field(..., description="Overall health status")
    checks: Optional[dict[str, str]] = Field(None, description="Individual component checks")

