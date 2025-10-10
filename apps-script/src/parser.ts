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
  // Comprehensive patterns for job titles from any source
  const patterns = [
    // Southwest Airlines format: "Application Received for R-2025-60279 Cloud DevOps Engineer Summer 2026 Internships"
    /Application Received for [A-Z0-9-]+\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:Summer|Fall|Spring|Winter)\s+\d{4}|\s+Internships?|\s+Positions?|$)/i,
    
    // General ATS format: "Application Received for [Job Title]"
    /Application Received for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:at|with|for)|\s+position|\s+role|$)/i,
    
    // Reference number format: "Your application for [REF-NUM] [Job Title]"
    /application for\s+[A-Z0-9-]+\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:has been|was)|$)/i,
    
    // Thank you formats: "Thank you for applying to [Job Title]"
    /Thank you for applying to\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    /Thank you for your application to\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    /Thanks for applying to\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    
    // Confirmation formats: "We received your application for [Job Title]"
    /We received your application for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    /We have received your application for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    /Your application has been received for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    
    // Status update formats: "Update on your application for [Job Title]"
    /Update on your application for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    /Status update for your application to\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    
    // Standard patterns
    /(?:for|as|position:)\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:at|position|role)|$)/,
    /(?:role|position):\s+([A-Z][a-zA-Z\s-]+?)(?:\n|$)/,
    /applied\s+for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|$)/i,
    /application\s+for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|$)/i,
    
    // Greenhouse format: "Application for [Job Title] at [Company]"
    /Application for\s+([A-Z][a-zA-Z\s-]+?)\s+at\s+[A-Z]/i,
    
    // LinkedIn format: "Your application for [Job Title]"
    /Your application for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+has|\s+was|$)/i,
    
    // Workday format: "Application submitted for [Job Title]"
    /Application submitted for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+position|\s+role|$)/i,
    
    // Indeed format: "Application confirmation for [Job Title]"
    /Application confirmation for\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    
    // Glassdoor format: "Your application to [Job Title]"
    /Your application to\s+([A-Z][a-zA-Z\s-]+?)(?:\s+at|\s+with|\s+for|\s+position|$)/i,
    
    // Generic patterns for any email
    /(?:applied|application|applying)\s+(?:to|for)\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:at|with|for|\s+position|\s+role)|$)/i,
    /(?:position|role)\s+(?:of|:)\s+([A-Z][a-zA-Z\s-]+?)(?:\s+(?:at|with|for|\s+position|\s+role)|$)/i,
    
    // Fallback: Look for capitalized words that could be job titles
    /(?:for|as|position|role)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,4})(?:\s+(?:at|with|for|\s+position|\s+role)|$)/,
  ];
  
  // Try subject first (highest priority)
  for (const pattern of patterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (isValidJobTitle(title)) {
        return title;
      }
    }
  }
  
  // Try body (first 1000 chars for better coverage)
  const bodyStart = body.substring(0, 1000);
  for (const pattern of patterns) {
    const match = bodyStart.match(pattern);
    if (match && match[1]) {
      const title = match[1].trim();
      if (isValidJobTitle(title)) {
        return title;
      }
    }
  }
  
  // Last resort: Extract from subject using intelligent parsing
  const fallbackTitle = extractTitleFromSubject(subject);
  if (fallbackTitle && isValidJobTitle(fallbackTitle)) {
    return fallbackTitle;
  }
  
  return null;
}

/**
 * Intelligent fallback extraction from subject line
 */
function extractTitleFromSubject(subject: string): string | null {
  // Remove common prefixes/suffixes
  let cleanSubject = subject
    .replace(/^(Application|Thank you|Thanks|We received|Update|Status).*?(?:for|to|regarding)\s+/i, '')
    .replace(/\s+(at|with|has been|was|received|submitted).*$/i, '')
    .replace(/\s+(Summer|Fall|Spring|Winter)\s+\d{4}.*$/i, '')
    .replace(/\s+(Internships?|Positions?).*$/i, '')
    .replace(/^[A-Z0-9-]+\s+/, ''); // Remove reference numbers
  
  // Look for capitalized sequences that could be job titles
  const words = cleanSubject.split(/\s+/);
  const titleWords: string[] = [];
  
  for (const word of words) {
    // Stop if we hit common company indicators
    if (/^(at|with|for|position|role|job)$/i.test(word)) {
      break;
    }
    
    // Stop if we hit common email indicators
    if (/^(received|submitted|applied|application)$/i.test(word)) {
      break;
    }
    
    // Include capitalized words and common job title words
    if (/^[A-Z]/.test(word) || /^(and|of|in|the|for)$/i.test(word)) {
      titleWords.push(word);
    } else if (titleWords.length > 0) {
      // Stop if we hit a non-capitalized word after starting a title
      break;
    }
  }
  
  const potentialTitle = titleWords.join(' ').trim();
  return potentialTitle.length > 3 ? potentialTitle : null;
}

/**
 * Validate if extracted text looks like a real job title
 */
function isValidJobTitle(title: string): boolean {
  if (!title || title.length < 3 || title.length > 150) {
    return false;
  }
  
  // Skip generic words that aren't job titles
  const genericWords = [
    'position', 'role', 'job', 'opening', 'opportunity', 'vacancy',
    'application', 'applied', 'received', 'submitted', 'thank you',
    'confirmation', 'status', 'update', 'notification'
  ];
  
  const lowerTitle = title.toLowerCase();
  if (genericWords.some(word => lowerTitle === word)) {
    return false;
  }
  
  // Must contain at least one capital letter (job titles are typically capitalized)
  if (!/[A-Z]/.test(title)) {
    return false;
  }
  
  // Skip if it's just a company name (too short or no job-related words)
  const jobKeywords = [
    'engineer', 'developer', 'manager', 'analyst', 'specialist', 'coordinator',
    'assistant', 'director', 'lead', 'senior', 'junior', 'intern', 'internship',
    'consultant', 'advisor', 'architect', 'designer', 'writer', 'editor',
    'sales', 'marketing', 'hr', 'finance', 'operations', 'support', 'admin'
  ];
  
  const hasJobKeyword = jobKeywords.some(keyword => 
    lowerTitle.includes(keyword)
  );
  
  // If it has job keywords, it's likely a real title
  if (hasJobKeyword) {
    return true;
  }
  
  // If no job keywords but it's reasonably long and has multiple words, accept it
  return title.split(' ').length >= 2 && title.length > 8;
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

