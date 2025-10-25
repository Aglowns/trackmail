"""
Email Parsing Service

This service handles parsing job application emails to extract:
- Company name
- Position title
- Application status
- Important dates
- Contact information

Parsing strategies:
1. Pattern matching (regex) for common email formats
2. Heuristics based on sender domain and subject patterns
3. Keyword extraction
4. (Future) LLM-based extraction for complex emails

Educational Note:
This is a simplified parser for MVP. In production, you'd want:
- More sophisticated NLP
- Machine learning models
- Integration with LLMs (OpenAI, Anthropic)
- Training data from user corrections
"""

import re
from typing import Optional, Dict, Any

from app.schemas import EmailIngest


class EmailParser:
    """Email parser for job application emails"""
    
    def __init__(self):
        pass
    
    def parse_email(self, email_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parse email data and extract job application information
        
        Args:
            email_data: Raw email data dictionary
            
        Returns:
            Parsed data with job application information
        """
        try:
            # Convert dict to EmailIngest model if needed
            if isinstance(email_data, dict):
                # Extract basic email fields
                sender = email_data.get('sender', '')
                subject = email_data.get('subject', '')
                text_body = email_data.get('text_body', '')
                
                # Create a simple EmailIngest-like object
                class SimpleEmailData:
                    def __init__(self, sender, subject, text_body):
                        self.sender = sender
                        self.subject = subject
                        self.text_body = text_body
                        self.parsed_company = None
                        self.parsed_position = None
                        self.parsed_status = None
                
                email_obj = SimpleEmailData(sender, subject, text_body)
            else:
                email_obj = email_data
            
            # Parse the email
            parsed_data = parse_job_application_email(email_obj)
            
            # Add additional fields
            parsed_data.update({
                'is_job_application': self._is_job_application(email_obj),
                'email_subject': email_obj.subject,
                'email_sender': email_obj.sender,
                'extracted_at': '2025-01-01T00:00:00Z'  # Will be set properly by the service
            })
            
            return parsed_data
            
        except Exception as e:
            print(f"Error parsing email: {e}")
            # Return default structure on error
            return {
                'company': None,
                'position': None,
                'status': 'unknown',
                'confidence': 0.0,
                'is_job_application': False,
                'error': str(e)
            }
    
    def _is_job_application(self, email_data) -> bool:
        """Determine if email is related to job applications"""
        content = (email_data.subject + " " + (email_data.text_body or "")).lower()
        
        job_keywords = [
            'application', 'interview', 'job', 'position', 'career',
            'hiring', 'recruit', 'candidate', 'resume', 'cv',
            'offer', 'employment', 'role', 'opportunity'
        ]
        
        return any(keyword in content for keyword in job_keywords)


def extract_company_from_sender(sender: str) -> Optional[str]:
    """
    Extract company name from sender email address.
    
    Examples:
        "jobs@acme.com" -> "Acme"
        "noreply@greenhouse.io" -> None (recruiting platform)
        "recruiter@bigtech.com" -> "Bigtech"
    
    Args:
        sender: Email address
        
    Returns:
        Company name or None
    """
    # Extract domain from email
    match = re.search(r'@([^.]+)', sender.lower())
    if not match:
        return None
    
    domain = match.group(1)
    
    # Ignore recruiting platforms and generic domains
    recruiting_platforms = {
        'greenhouse', 'lever', 'workday', 'taleo', 'smartrecruiters',
        'indeed', 'linkedin', 'glassdoor', 'monster', 'gmail', 'outlook'
    }
    
    if domain in recruiting_platforms:
        return None
    
    # Capitalize and return
    return domain.capitalize()


def extract_position_from_subject(subject: str) -> Optional[str]:
    """
    Extract position title from email subject.
    
    Common patterns:
        "Application Received - Software Engineer"
        "Your application for Senior Developer"
        "Thanks for applying to Product Manager position"
    
    Args:
        subject: Email subject line
        
    Returns:
        Position title or None
    """
    # Pattern 1: "... - Position Title"
    match = re.search(r' - ([A-Z][A-Za-z\s]+)$', subject)
    if match:
        return match.group(1).strip()
    
    # Pattern 2: "... for Position Title"
    match = re.search(r' for ([A-Z][A-Za-z\s]+)', subject)
    if match:
        return match.group(1).strip()
    
    # Pattern 3: "... to Position Title"
    match = re.search(r' to ([A-Z][A-Za-z\s]+) position', subject, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    return None


def detect_status_from_content(subject: str, text_body: Optional[str]) -> str:
    """
    Detect application status from email content.
    
    Looks for keywords indicating different stages:
    - "received", "submitted" -> applied
    - "screen", "phone screen" -> screening
    - "interview", "schedule" -> interviewing
    - "offer", "congratulations" -> offer
    - "unfortunately", "not moving forward" -> rejected
    
    Args:
        subject: Email subject
        text_body: Email body text
        
    Returns:
        Status string (applied, screening, interviewing, offer, rejected)
    """
    content = (subject + " " + (text_body or "")).lower()
    
    # Check for rejection
    rejection_keywords = [
        'unfortunately', 'not moving forward', 'not selected',
        'decided not to', 'other candidates', 'not the right fit'
    ]
    if any(keyword in content for keyword in rejection_keywords):
        return 'rejected'
    
    # Check for offer
    offer_keywords = [
        'congratulations', 'pleased to offer', 'offer letter',
        'accept the position', 'job offer'
    ]
    if any(keyword in content for keyword in offer_keywords):
        return 'offer'
    
    # Check for interview
    interview_keywords = [
        'interview', 'schedule a call', 'meet with', 'next steps',
        'phone screen', 'technical assessment'
    ]
    if any(keyword in content for keyword in interview_keywords):
        return 'interviewing'
    
    # Check for screening
    screening_keywords = [
        'phone screen', 'initial call', 'brief chat', 'screening'
    ]
    if any(keyword in content for keyword in screening_keywords):
        return 'screening'
    
    # Default to applied
    return 'applied'


def calculate_confidence(parsed_data: dict) -> float:
    """
    Calculate confidence score for parsed data.
    
    Higher scores = more fields successfully extracted
    
    Args:
        parsed_data: Dictionary with parsed fields
        
    Returns:
        Confidence score between 0.0 and 1.0
    """
    score = 0.0
    max_score = 3.0
    
    if parsed_data.get('company'):
        score += 1.0
    if parsed_data.get('position'):
        score += 1.0
    if parsed_data.get('status') and parsed_data['status'] != 'applied':
        score += 1.0
    
    return round(score / max_score, 2)


def parse_job_application_email(email_data: EmailIngest) -> dict:
    """
    Parse a job application email and extract structured data.
    
    This uses simple heuristics and pattern matching.
    For production, consider:
    - Training a custom ML model
    - Using LLMs (GPT, Claude) for extraction
    - Implementing user feedback loop
    
    Args:
        email_data: EmailIngest model with email content
        
    Returns:
        Dictionary with extracted application data:
        - company: Company name
        - position: Job title  
        - status: Application status
        - confidence: Extraction confidence (0.0-1.0)
        
    Example:
        email = EmailIngest(
            sender="jobs@acme.com",
            subject="Application Received - Software Engineer",
            text_body="Thank you for applying..."
        )
        result = parse_job_application_email(email)
        # -> {"company": "Acme", "position": "Software Engineer", ...}
    """
    # Use pre-parsed data if available (from Gmail add-on)
    if email_data.parsed_company:
        company = email_data.parsed_company
    else:
        company = extract_company_from_sender(email_data.sender)
    
    if email_data.parsed_position:
        position = email_data.parsed_position
    else:
        position = extract_position_from_subject(email_data.subject)
    
    # Use AI-detected status if available, otherwise fall back to parsed status or content analysis
    if hasattr(email_data, 'detected_status') and email_data.detected_status:
        status = email_data.detected_status
        print(f"Using AI-detected status: {status}")
    elif hasattr(email_data, 'parsed_status') and email_data.parsed_status:
        status = email_data.parsed_status
        print(f"Using parsed status: {status}")
    else:
        status = detect_status_from_content(
            email_data.subject,
            email_data.text_body
        )
        print(f"Using content analysis status: {status}")
    
    # Build result
    parsed = {
        "company": company,
        "position": position,
        "status": status,
    }
    
    # Calculate confidence
    parsed["confidence"] = calculate_confidence(parsed)
    
    return parsed

