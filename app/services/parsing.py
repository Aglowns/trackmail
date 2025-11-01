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
4. AI-powered detection using OpenAI GPT (for job application classification)

Educational Note:
This is a simplified parser for MVP. In production, you'd want:
- More sophisticated NLP
- Machine learning models
- Integration with LLMs (OpenAI, Anthropic)
- Training data from user corrections
"""

import json
import re
from typing import Optional, Dict, Any

import httpx

from app.config import settings
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
        """
        Determine if email is related to job applications using AI (if available) or fallback keywords.
        
        This is a smart detector that uses OpenAI GPT to understand context and meaning,
        not just keyword matching. This prevents false positives like trading emails.
        """
        # Try AI-based detection first (more accurate)
        if settings.openai_api_key:
            try:
                ai_result = detect_job_application_with_ai(
                    subject=email_data.subject,
                    sender=email_data.sender,
                    body=email_data.text_body or ""
                )
                if ai_result is not None:
                    return ai_result.get("is_job_application", False)
            except Exception as e:
                print(f"⚠️ AI detection failed, falling back to keyword matching: {e}")
        
        # Fallback to keyword-based detection
        content = (email_data.subject + " " + (email_data.text_body or "")).lower()
        
        # More specific keywords to reduce false positives
        job_keywords = [
            'job application', 'application received', 'thank you for applying',
            'interview', 'job offer', 'position', 'career opportunity',
            'hiring', 'recruiter', 'candidate', 'resume', 'cv',
            'employment', 'role', 'we received your application',
            'next steps', 'schedule interview', 'application status'
        ]
        
        # Also check for rejection keywords to ensure we catch rejections
        rejection_keywords = [
            'not selected', 'decided to go with another candidate',
            'unfortunately', 'not moving forward', 'not the right fit'
        ]
        
        has_job_keywords = any(keyword in content for keyword in job_keywords)
        has_rejection_keywords = any(keyword in content for keyword in rejection_keywords)
        
        return has_job_keywords or has_rejection_keywords


def detect_job_application_with_ai(subject: str, sender: str, body: str) -> Optional[Dict[str, Any]]:
    """
    Use OpenAI GPT to intelligently determine if an email is a job application email.
    
    This function uses common sense AI reasoning to distinguish between:
    - Job application emails (application confirmations, interview invites, offers, rejections)
    - Non-job emails (marketing, newsletters, trading, personal, etc.)
    
    Args:
        subject: Email subject line
        sender: Email sender address
        body: Email body content (plain text)
        
    Returns:
        Dictionary with:
        - is_job_application: bool (True if email is job-related)
        - confidence: float (0.0-1.0)
        - reasoning: str (brief explanation)
        Or None if API call fails
    """
    if not settings.openai_api_key:
        return None
    
    # Truncate body if too long (OpenAI has token limits)
    max_body_length = 2000
    truncated_body = body[:max_body_length] if len(body) > max_body_length else body
    
    prompt = f"""You are an expert email classifier. Analyze this email and determine if it is related to a JOB APPLICATION.

CRITICAL: Use common sense! Many emails mention words like "opportunity" or "offer" but are NOT job applications.

Job application emails include:
- Application confirmations ("thank you for applying", "application received")
- Interview invitations ("we'd like to schedule", "interview", "next steps")
- Status updates ("your application", "candidate", "position")
- Job offers ("we are pleased to offer", "congratulations", "offer letter")
- Rejections ("unfortunately", "not selected", "decided to go with another candidate")
- Withdrawals ("application withdrawn")

NOT job application emails:
- Marketing/promotional emails (trading, investments, sales, deals)
- Newsletters, updates, notifications
- Personal emails
- Spam
- Financial/trading opportunities
- Course offers, educational content
- Product announcements

Email Subject: {subject}
From: {sender}
Content:
{truncated_body}

Analyze this email and respond with ONLY a valid JSON object:
{{
  "is_job_application": true or false,
  "confidence": number between 0.0 and 1.0,
  "reasoning": "brief explanation of your decision"
}}"""

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.openai_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are an expert email classifier. Always respond with valid JSON only, no other text."
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 200,
                    "temperature": 0.1,  # Low temperature for consistent, factual responses
                },
            )
            
            if response.status_code != 200:
                print(f"⚠️ OpenAI API error: {response.status_code} - {response.text}")
                return None
            
            response_data = response.json()
            ai_content = response_data["choices"][0]["message"]["content"]
            
            # Parse JSON response (may be wrapped in markdown code blocks)
            ai_content = ai_content.strip()
            if ai_content.startswith("```"):
                # Remove markdown code block markers
                ai_content = ai_content.split("```")[1]
                if ai_content.startswith("json"):
                    ai_content = ai_content[4:]
                ai_content = ai_content.strip()
            
            result = json.loads(ai_content)
            
            print(f"✅ AI Job Detection: is_job={result.get('is_job_application')}, "
                  f"confidence={result.get('confidence')}, reasoning={result.get('reasoning')}")
            
            return result
            
    except json.JSONDecodeError as e:
        print(f"⚠️ Failed to parse AI response as JSON: {e}")
        return None
    except Exception as e:
        print(f"⚠️ AI detection failed: {e}")
        return None


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
    print(f"DEBUG: Checking for detected_status...")
    print(f"DEBUG: hasattr(email_data, 'detected_status'): {hasattr(email_data, 'detected_status')}")
    if hasattr(email_data, 'detected_status'):
        print(f"DEBUG: detected_status value: '{email_data.detected_status}' (type: {type(email_data.detected_status)})")
        print(f"DEBUG: detected_status is truthy: {bool(email_data.detected_status)}")
    
    if hasattr(email_data, 'detected_status') and email_data.detected_status:
        status = email_data.detected_status
        print(f"✅ Using AI-detected status: {status}")
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
    email_source_url = None
    if hasattr(email_data, 'job_url') and email_data.job_url:
        email_source_url = email_data.job_url
    elif hasattr(email_data, 'parsed_job_url') and email_data.parsed_job_url:
        email_source_url = email_data.parsed_job_url

    parsed = {
        "company": company,
        "position": position,
        "status": status,
        "source_url": email_source_url
    }
    
    # Calculate confidence
    parsed["confidence"] = calculate_confidence(parsed)
    
    return parsed

