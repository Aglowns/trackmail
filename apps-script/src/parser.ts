/**
 * Email parsing logic to extract job application details
 */

import { ParsedEmail, ParsedApplication } from './types';
import { extractDomain, cleanCompanyName, containsAny } from './util';

// Known ATS (Applicant Tracking System) domains
const ATS_DOMAINS: Record<string, string> = {
  'greenhouse.io': 'Greenhouse',
  'lever.co': 'Lever',
  'workday.com': 'Workday',
  'jobvite.com': 'Jobvite',
  'smartrecruiters.com': 'SmartRecruiters',
  'breezy.hr': 'Breezy HR',
  'recruitee.com': 'Recruitee',
  'applytojob.com': 'Taleo',
  'linkedin.com': 'LinkedIn',
  'indeed.com': 'Indeed',
  'glassdoor.com': 'Glassdoor',
  'ziprecruiter.com': 'ZipRecruiter',
  'monster.com': 'Monster',
  'careers-page.com': 'SmartRecruiters',
};

// Confidence indicators
const HIGH_CONFIDENCE_SUBJECTS = [
  'application received',
  'application submitted',
  'application confirmation',
  'thank you for applying',
  'thanks for your application',
  'we received your application',
  "we've received your application",
];

const MEDIUM_CONFIDENCE_SUBJECTS = [
  'thank you for your interest',
  'thanks for your interest',
  'application',
  'job alert',
];

// Status indicators
const STATUS_KEYWORDS: Record<string, string> = {
  'application received': 'applied',
  'application submitted': 'applied',
  'under review': 'screening',
  'reviewing your application': 'screening',
  'interview': 'interview',
  'offer': 'offer',
  'congratulations': 'offer',
  'unfortunately': 'rejected',
  'not moving forward': 'rejected',
  'not selected': 'rejected',
};

/**
 * Parse email into job application data
 */
export function parseJobApplication(email: ParsedEmail): ParsedApplication | null {
  const { subject, from, bodyText, links } = email;
  
  // Determine confidence level
  const confidence = determineConfidence(subject, from, bodyText);
  
  if (confidence === 'low') {
    // Skip low confidence emails unless they match strict patterns
    if (!isStrictJobConfirmation(subject, from)) {
      return null;
    }
  }
  
  // Extract company name
  const company = extractCompany(subject, from, bodyText);
  if (!company) {
    return null;
  }
  
  // Extract job title
  const jobTitle = extractJobTitle(subject, bodyText);
  
  // Find job URL
  const jobUrl = findJobUrl(links, bodyText);
  
  // Detect source (ATS or job board)
  const source = detectSource(from, links);
  
  // Determine status
  const status = determineStatus(subject, bodyText);
  
  // Generate notes
  const notes = generateNotes(email);
  
  return {
    company: cleanCompanyName(company),
    jobTitle: jobTitle || 'Position',
    jobUrl,
    source,
    status,
    confidence,
    notes,
  };
}

/**
 * Determine confidence level based on email content
 */
function determineConfidence(subject: string, from: string, body: string): 'high' | 'medium' | 'low' {
  const lowerSubject = subject.toLowerCase();
  const lowerFrom = from.toLowerCase();
  const lowerBody = body.toLowerCase();
  
  // High confidence: explicit application confirmation
  if (containsAny(lowerSubject, HIGH_CONFIDENCE_SUBJECTS)) {
    return 'high';
  }
  
  // High confidence: from known ATS
  const fromDomain = extractDomain(from);
  if (fromDomain && ATS_DOMAINS[fromDomain]) {
    return 'high';
  }
  
  // High confidence: career/recruiting email addresses
  if (lowerFrom.includes('careers@') || 
      lowerFrom.includes('recruiting@') || 
      lowerFrom.includes('talent@') ||
      lowerFrom.includes('jobs@') ||
      lowerFrom.includes('noreply@') && lowerBody.includes('application')) {
    return 'high';
  }
  
  // Medium confidence: mentions application
  if (containsAny(lowerSubject, MEDIUM_CONFIDENCE_SUBJECTS) ||
      (lowerBody.includes('application') && lowerBody.includes('position'))) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Check if email is a strict job confirmation
 */
function isStrictJobConfirmation(subject: string, from: string): boolean {
  const lowerSubject = subject.toLowerCase();
  return HIGH_CONFIDENCE_SUBJECTS.some(phrase => lowerSubject.includes(phrase));
}

/**
 * Extract company name from email
 */
function extractCompany(subject: string, from: string, body: string): string | null {
  // Try to extract from sender name
  const fromMatch = from.match(/^([^<@]+?)(?:\s*<|@)/);
  if (fromMatch) {
    const senderName = fromMatch[1].trim();
    // Skip generic names
    if (!containsAny(senderName, ['noreply', 'no-reply', 'donotreply', 'careers', 'jobs', 'talent'])) {
      return senderName;
    }
  }
  
  // Try to extract from domain
  const domain = extractDomain(from);
  if (domain && !ATS_DOMAINS[domain]) {
    // Convert domain to company name (e.g., "acme-corp.com" -> "Acme Corp")
    const name = domain
      .replace(/\.(com|org|net|io|co)$/, '')
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    if (name.length > 2) {
      return name;
    }
  }
  
  // Try to extract from subject (e.g., "Your application to Acme Corp")
  const subjectMatch = subject.match(/(?:to|at|with|for)\s+([A-Z][a-zA-Z\s&]+?)(?:\s+[-–—]|\s+for|\s+regarding|$)/);
  if (subjectMatch && subjectMatch[1].length > 2) {
    return subjectMatch[1].trim();
  }
  
  // Try to extract from body (look for "at CompanyName" or "to CompanyName")
  const bodyMatch = body.match(/(?:application\s+(?:to|at|with))\s+([A-Z][a-zA-Z\s&]+?)(?:[,.\n]|for\s+the)/i);
  if (bodyMatch && bodyMatch[1].length > 2) {
    return bodyMatch[1].trim();
  }
  
  // Fallback: use domain name
  if (domain) {
    return domain.split('.')[0];
  }
  
  return null;
}

/**
 * Extract job title from email
 */
function extractJobTitle(subject: string, body: string): string | null {
  // Common patterns for job titles
  const patterns = [
    /(?:for|as|position:)\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:at|position|role)|$)/,
    /(?:role|position):\s+([A-Z][a-zA-Z\s-]+?)(?:\n|$)/,
    /applied\s+for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|$)/i,
    /application\s+for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|$)/i,
  ];
  
  // Try subject first
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 100) {
        return title;
      }
    }
  }
  
  // Try body (first 500 chars)
  const bodyStart = body.substring(0, 500);
  for (const pattern of patterns) {
    const match = bodyStart.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (title.length > 3 && title.length < 100) {
        return title;
      }
    }
  }
  
  return null;
}

/**
 * Find job posting URL from links
 */
function findJobUrl(links: string[], body: string): string | null {
  if (!links || links.length === 0) return null;
  
  // Priority order: job posting links > application links > career pages
  const jobUrlKeywords = ['jobs', 'careers', 'positions', 'apply', 'job-post', 'opening'];
  const excludeKeywords = ['unsubscribe', 'privacy', 'terms', 'settings', 'preferences'];
  
  let bestUrl: string | null = null;
  let bestScore = 0;
  
  for (const url of links) {
    if (url.length > 500) continue; // Skip very long URLs
    
    const lowerUrl = url.toLowerCase();
    
    // Skip excluded URLs
    if (excludeKeywords.some(kw => lowerUrl.includes(kw))) {
      continue;
    }
    
    let score = 0;
    
    // Check for job-related keywords in URL
    for (const keyword of jobUrlKeywords) {
      if (lowerUrl.includes(keyword)) {
        score += 2;
      }
    }
    
    // Known ATS domains get bonus points
    const domain = extractDomain(url);
    if (domain && ATS_DOMAINS[domain]) {
      score += 3;
    }
    
    // Check if URL is mentioned near "view" or "application" in body
    if (body.includes(url)) {
      const urlIndex = body.indexOf(url);
      const contextBefore = body.substring(Math.max(0, urlIndex - 50), urlIndex).toLowerCase();
      if (containsAny(contextBefore, ['view', 'application', 'position', 'role', 'job'])) {
        score += 2;
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestUrl = url;
    }
  }
  
  // If no good match, return first non-excluded link
  if (!bestUrl && links.length > 0) {
    for (const url of links) {
      const lowerUrl = url.toLowerCase();
      if (!excludeKeywords.some(kw => lowerUrl.includes(kw))) {
        bestUrl = url;
        break;
      }
    }
  }
  
  return bestUrl;
}

/**
 * Detect the source (ATS or job board)
 */
function detectSource(from: string, links: string[]): string {
  // Check sender domain
  const fromDomain = extractDomain(from);
  if (fromDomain && ATS_DOMAINS[fromDomain]) {
    return ATS_DOMAINS[fromDomain];
  }
  
  // Check link domains
  for (const link of links) {
    const linkDomain = extractDomain(link);
    if (linkDomain && ATS_DOMAINS[linkDomain]) {
      return ATS_DOMAINS[linkDomain];
    }
  }
  
  // Fallback to "Email" if not from known source
  return 'Email';
}

/**
 * Determine application status from email content
 */
function determineStatus(subject: string, body: string): string {
  const combined = (subject + ' ' + body).toLowerCase();
  
  // Check for status keywords
  for (const [keyword, status] of Object.entries(STATUS_KEYWORDS)) {
    if (combined.includes(keyword)) {
      return status;
    }
  }
  
  // Default to "applied" for confirmation emails
  return 'applied';
}

/**
 * Generate notes from email
 */
function generateNotes(email: ParsedEmail): string {
  const notes: string[] = [];
  
  // Add source info
  notes.push(`From: ${email.from}`);
  
  // Add subject if informative
  if (email.subject.length < 100) {
    notes.push(`Subject: ${email.subject}`);
  }
  
  return notes.join('\n');
}

