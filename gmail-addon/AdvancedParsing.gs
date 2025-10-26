/**
 * Advanced Email Parsing for Job Applications
 * 
 * This file contains sophisticated parsing functions that can handle
 * any job application email format from any company.
 */

/**
 * Extract company name from email with advanced pattern matching.
 * Handles various email formats from different companies.
 *
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} sender - Email sender
 * @return {string} Company name
 */
function extractCompanyName(subject, body, sender) {
  const text = (subject + ' ' + body).toLowerCase();
  const senderText = sender ? sender.toLowerCase() : '';
  
  console.log('Extracting company name from:', { subject, sender, body: body.substring(0, 100) });
  
  // 1. Extract from subject patterns (most reliable)
  const subjectPatterns = [
    /thank you for applying.*?at\s+([^,\.!]+)/i,
    /application.*?at\s+([^,\.!]+)/i,
    /thank you.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+team/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+hiring/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+recruiting/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+hr/i,
    /position at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /role at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
  ];
  
  for (const pattern of subjectPatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim().replace(/[^\w\s]/g, '');
      if (company.length > 2 && company.length < 50 && !company.includes('thank') && !company.includes('you')) {
        console.log('Company found in subject:', company);
        return company;
      }
    }
  }
  
  // 2. Extract from sender email domain
  const domainPatterns = [
    /@([^.]+)\.com/i,
    /@([^.]+)\.org/i,
    /@([^.]+)\.net/i,
    /@([^.]+)\.io/i,
    /@([^.]+)\.co/i,
    /@([^.]+)\.jobs/i
  ];
  
  for (const pattern of domainPatterns) {
    const match = senderText.match(pattern);
    if (match && match[1]) {
      const domain = match[1].replace(/[^a-zA-Z]/g, '');
      if (domain.length > 2 && domain.length < 20 && !domain.includes('noreply') && !domain.includes('no-reply')) {
        console.log('Company found in domain:', domain);
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }
  }
  
  // 3. Extract from sender name
  const senderPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+hiring/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+recruiting/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+team/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+hr/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+careers/i
  ];
  
  for (const pattern of senderPatterns) {
    const match = senderText.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50) {
        console.log('Company found in sender:', company);
        return company;
      }
    }
  }
  
  // 4. Extract from body patterns
  const bodyPatterns = [
    /thank you for applying.*?at\s+([^,\.!]+)/i,
    /application.*?at\s+([^,\.!]+)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is excited/i,
    /we at\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+team/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+is pleased/i,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+appreciates/i
  ];
  
  for (const pattern of bodyPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim().replace(/[^\w\s]/g, '');
      if (company.length > 2 && company.length < 50) {
        console.log('Company found in body:', company);
        return company;
      }
    }
  }
  
  // 5. Fallback: extract from "From" field context
  if (senderText.includes('hiring') || senderText.includes('recruiting') || senderText.includes('hr')) {
    const words = senderText.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (words[i].toLowerCase().includes('hiring') || 
          words[i].toLowerCase().includes('recruiting') || 
          words[i].toLowerCase().includes('hr')) {
        if (i > 0) {
          const company = words[i-1].replace(/[^\w]/g, '');
          if (company.length > 2) {
            console.log('Company found in sender context:', company);
            return company.charAt(0).toUpperCase() + company.slice(1);
          }
        }
      }
    }
  }
  
  console.log('No company found, returning Unknown Company');
  return 'Unknown Company';
}

/**
 * Extract job position with advanced pattern matching.
 * Handles various job title formats and descriptions.
 *
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @return {string} Job position
 */
function extractJobPosition(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  
  console.log('Extracting job position from:', { subject, body: body.substring(0, 100) });
  
  // 1. Extract from subject patterns
  const subjectPatterns = [
    /thank you for applying for (?:the\s+)?(.+?)(?:\s+at|\s+role|\s+position)/i,
    /application for (?:the\s+)?(.+?)(?:\s+at|\s+role|\s+position)/i,
    /position.*?([A-Z][^,\.!]+)/i,
    /role.*?([A-Z][^,\.!]+)/i,
    /job.*?([A-Z][^,\.!]+)/i,
    /(.+?)\s+intern/i,
    /(.+?)\s+engineer/i,
    /(.+?)\s+developer/i,
    /(.+?)\s+analyst/i,
    /(.+?)\s+manager/i,
    /(.+?)\s+specialist/i,
    /(.+?)\s+coordinator/i
  ];
  
  for (const pattern of subjectPatterns) {
    const match = subject.match(pattern);
    if (match && match[1]) {
      const position = match[1].trim();
      if (position.length > 3 && position.length < 100) {
        console.log('Position found in subject:', position);
        return position;
      }
    }
  }
  
  // 2. Extract from body patterns
  const bodyPatterns = [
    /thank you for applying for (?:the\s+)?(.+?)(?:\s+at|\s+role|\s+position)/i,
    /application for (?:the\s+)?(.+?)(?:\s+at|\s+role|\s+position)/i,
    /position.*?([A-Z][^,\.!]+)/i,
    /role.*?([A-Z][^,\.!]+)/i,
    /job.*?([A-Z][^,\.!]+)/i,
    /(.+?)\s+intern/i,
    /(.+?)\s+engineer/i,
    /(.+?)\s+developer/i,
    /(.+?)\s+analyst/i,
    /(.+?)\s+manager/i,
    /(.+?)\s+specialist/i,
    /(.+?)\s+coordinator/i,
    /(.+?)\s+assistant/i,
    /(.+?)\s+associate/i
  ];
  
  for (const pattern of bodyPatterns) {
    const match = body.match(pattern);
    if (match && match[1]) {
      const position = match[1].trim();
      if (position.length > 3 && position.length < 100) {
        console.log('Position found in body:', position);
        return position;
      }
    }
  }
  
  // 3. Extract common job titles
  const commonTitles = [
    'software engineer', 'software developer', 'data scientist', 'data analyst',
    'product manager', 'project manager', 'marketing manager', 'sales manager',
    'business analyst', 'financial analyst', 'hr specialist', 'recruiter',
    'customer success', 'account manager', 'sales representative', 'marketing specialist',
    'graphic designer', 'ui designer', 'ux designer', 'web developer',
    'frontend developer', 'backend developer', 'full stack developer',
    'devops engineer', 'cloud engineer', 'security engineer', 'qa engineer',
    'intern', 'internship', 'entry level', 'junior', 'senior', 'lead', 'principal'
  ];
  
  for (const title of commonTitles) {
    if (text.includes(title)) {
      console.log('Common title found:', title);
      return title.charAt(0).toUpperCase() + title.slice(1);
    }
  }
  
  console.log('No position found, returning Unknown Position');
  return 'Unknown Position';
}

/**
 * Extract application date with advanced pattern matching.
 * Handles various date formats and contexts.
 *
 * @param {string} body - Email body
 * @param {string} subject - Email subject
 * @return {string} Application date
 */
function extractApplicationDate(body, subject) {
  const text = (body + ' ' + subject).toLowerCase();
  
  console.log('Extracting application date from:', { subject, body: body.substring(0, 100) });
  
  // 1. Extract explicit application dates
  const datePatterns = [
    /applied on\s+([^,\.!]+)/i,
    /application submitted on\s+([^,\.!]+)/i,
    /submitted on\s+([^,\.!]+)/i,
    /applied\s+([^,\.!]+)/i,
    /application date[:\s]+([^,\.!]+)/i,
    /submitted\s+([^,\.!]+)/i,
    /received your application on\s+([^,\.!]+)/i,
    /application received on\s+([^,\.!]+)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const date = match[1].trim();
      if (date.length > 3 && date.length < 50) {
        console.log('Application date found:', date);
        return date;
      }
    }
  }
  
  // 2. Extract relative dates
  const relativePatterns = [
    /applied\s+(yesterday|today|this week|last week|this month|last month)/i,
    /submitted\s+(yesterday|today|this week|last week|this month|last month)/i,
    /application\s+(yesterday|today|this week|last week|this month|last month)/i
  ];
  
  for (const pattern of relativePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const relativeDate = match[1].trim();
      console.log('Relative date found:', relativeDate);
      return relativeDate;
    }
  }
  
  // 3. Extract from email received date (fallback)
  console.log('No application date found, using email date');
  return 'Email Date';
}

/**
 * Extract job URL from email body.
 * Looks for job posting links and application URLs.
 *
 * @param {string} body - Email body
 * @return {string} Job URL
 */
function extractJobURL(body) {
  const text = body;
  
  console.log('Extracting job URL from body');
  
  // 1. Extract URLs from body
  const urlPatterns = [
    /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,
    /www\.[^\s<>"{}|\\^`\[\]]+/gi
  ];
  
  const urls = [];
  for (const pattern of urlPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      urls.push(...matches);
    }
  }
  
  // 2. Filter for job-related URLs
  const jobKeywords = [
    'job', 'career', 'position', 'role', 'application', 'apply',
    'hiring', 'recruiting', 'employment', 'opportunity'
  ];
  
  for (const url of urls) {
    const urlLower = url.toLowerCase();
    for (const keyword of jobKeywords) {
      if (urlLower.includes(keyword)) {
        console.log('Job URL found:', url);
        return url;
      }
    }
  }
  
  // 3. Return first URL if no job-specific URL found
  if (urls.length > 0) {
    console.log('General URL found:', urls[0]);
    return urls[0];
  }
  
  console.log('No URL found');
  return 'No URL';
}
