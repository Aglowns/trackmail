/**
 * Advanced HTML Structure Parsing for Job Applications
 * 
 * This file contains sophisticated HTML parsing functions that can handle
 * any job application email format by analyzing HTML structure and patterns.
 * 
 * Based on Careerflow.ai's approach for maximum accuracy.
 */

/**
 * Extract company name using HTML structure analysis
 * Uses HTML DOM patterns for maximum accuracy
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @param {string} sender - Email sender
 * @return {string} Company name
 */
function extractCompanyNameFromHTML(htmlBody, subject, sender) {
  console.log('Extracting company name from HTML structure');
  
  const htmlContent = htmlBody || '';
  const senderText = sender ? sender.toLowerCase() : '';
  
  // 1. Extract from HTML patterns (most reliable)
  const htmlPatterns = [
    // Common email template patterns
    /<div[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*company[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /<strong[^>]*>([^<]*(?:hiring|recruiting|team)[^<]*)<\/strong>/gi,
    /<h[1-6][^>]*>([^<]*(?:hiring|recruiting|team)[^<]*)<\/h[1-6]>/gi,
    // ATS system patterns
    /<td[^>]*>([^<]*(?:hiring|recruiting|team)[^<]*)<\/td>/gi,
    /<th[^>]*>([^<]*(?:hiring|recruiting|team)[^<]*)<\/th>/gi,
    // Generic company patterns
    /<div[^>]*>([^<]*(?:hiring|recruiting|team)[^<]*)<\/div>/gi,
    /<p[^>]*>([^<]*(?:hiring|recruiting|team)[^<]*)<\/p>/gi
  ];
  
  for (const pattern of htmlPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        const company = extractCompanyFromMatch(match);
        if (company && company.length > 2 && company.length < 50) {
          console.log('Company found in HTML:', company);
          return company;
        }
      }
    }
  }
  
  // 2. Extract from structured email templates
  const templatePatterns = [
    // Greenhouse.io pattern
    /<div[^>]*class="[^"]*greenhouse[^"]*"[^>]*>([^<]+)<\/div>/gi,
    // Workday pattern
    /<div[^>]*class="[^"]*workday[^"]*"[^>]*>([^<]+)<\/div>/gi,
    // BambooHR pattern
    /<div[^>]*class="[^"]*bamboo[^"]*"[^>]*>([^<]+)<\/div>/gi,
    // Generic ATS patterns
    /<div[^>]*class="[^"]*ats[^"]*"[^>]*>([^<]+)<\/div>/gi,
    // Job board patterns
    /<div[^>]*class="[^"]*job[^"]*"[^>]*>([^<]+)<\/div>/gi
  ];
  
  for (const pattern of templatePatterns) {
    const match = htmlContent.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      if (company.length > 2 && company.length < 50) {
        console.log('Company found in template:', company);
        return company;
      }
    }
  }
  
  // 3. Extract from sender email domain
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
  
  // 4. Fallback to text-based extraction
  console.log('Falling back to text-based extraction');
  return extractCompanyName(subject, htmlContent, sender);
}

/**
 * Extract job position using HTML structure
 * Analyzes HTML patterns for job titles and positions
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @return {string} Job position
 */
function extractJobPositionFromHTML(htmlBody, subject) {
  console.log('Extracting job position from HTML structure');
  
  const htmlContent = htmlBody || '';
  
  // 1. Extract from HTML patterns
  const htmlPatterns = [
    // Position-specific patterns
    /<div[^>]*class="[^"]*position[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*position[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /<h[1-6][^>]*class="[^"]*position[^"]*"[^>]*>([^<]+)<\/h[1-6]>/gi,
    // Role-specific patterns
    /<div[^>]*class="[^"]*role[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*role[^"]*"[^>]*>([^<]+)<\/span>/gi,
    // Job title patterns
    /<div[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*title[^"]*"[^>]*>([^<]+)<\/span>/gi,
    // Generic job patterns
    /<div[^>]*>([^<]*(?:engineer|developer|manager|analyst|specialist|coordinator|assistant|associate|intern)[^<]*)<\/div>/gi,
    /<p[^>]*>([^<]*(?:engineer|developer|manager|analyst|specialist|coordinator|assistant|associate|intern)[^<]*)<\/p>/gi
  ];
  
  for (const pattern of htmlPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        const position = extractPositionFromMatch(match);
        if (position && position.length > 3 && position.length < 100) {
          console.log('Position found in HTML:', position);
          return position;
        }
      }
    }
  }
  
  // 2. Extract from email templates
  const templatePatterns = [
    // Common ATS patterns
    /<td[^>]*>([^<]*(?:engineer|developer|manager|analyst|specialist|coordinator|assistant|associate|intern)[^<]*)<\/td>/gi,
    /<th[^>]*>([^<]*(?:engineer|developer|manager|analyst|specialist|coordinator|assistant|associate|intern)[^<]*)<\/th>/gi,
    // Job posting patterns
    /<div[^>]*class="[^"]*job[^"]*"[^>]*>([^<]+)<\/div>/gi,
    // Table patterns
    /<tr[^>]*>([^<]*(?:engineer|developer|manager|analyst|specialist|coordinator|assistant|associate|intern)[^<]*)<\/tr>/gi
  ];
  
  for (const pattern of templatePatterns) {
    const match = htmlContent.match(pattern);
    if (match && match[1]) {
      const position = match[1].trim();
      if (position.length > 3 && position.length < 100) {
        console.log('Position found in template:', position);
        return position;
      }
    }
  }
  
  // 3. Fallback to text-based extraction
  console.log('Falling back to text-based extraction');
  return extractJobPosition(subject, htmlContent);
}

/**
 * Extract application date using HTML structure
 * Analyzes HTML patterns for dates and timestamps
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @return {string} Application date
 */
function extractApplicationDateFromHTML(htmlBody, subject) {
  console.log('Extracting application date from HTML structure');
  
  const htmlContent = htmlBody || '';
  
  // 1. Extract from HTML date patterns
  const datePatterns = [
    // Date-specific patterns
    /<div[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/span>/gi,
    /<td[^>]*>([^<]*(?:applied|submitted|received)[^<]*)<\/td>/gi,
    // Time-specific patterns
    /<div[^>]*class="[^"]*time[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*time[^"]*"[^>]*>([^<]+)<\/span>/gi,
    // Generic date patterns
    /<div[^>]*>([^<]*(?:applied|submitted|received)[^<]*)<\/div>/gi,
    /<p[^>]*>([^<]*(?:applied|submitted|received)[^<]*)<\/p>/gi
  ];
  
  for (const pattern of datePatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        const date = extractDateFromMatch(match);
        if (date && date.length > 3) {
          console.log('Date found in HTML:', date);
          return date;
        }
      }
    }
  }
  
  // 2. Extract from email templates
  const templatePatterns = [
    // ATS system patterns
    /<div[^>]*class="[^"]*application[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*application[^"]*"[^>]*>([^<]+)<\/span>/gi,
    // Table patterns
    /<td[^>]*>([^<]*(?:applied|submitted|received)[^<]*)<\/td>/gi,
    /<th[^>]*>([^<]*(?:applied|submitted|received)[^<]*)<\/th>/gi
  ];
  
  for (const pattern of templatePatterns) {
    const match = htmlContent.match(pattern);
    if (match && match[1]) {
      const date = match[1].trim();
      if (date.length > 3) {
        console.log('Date found in template:', date);
        return date;
      }
    }
  }
  
  // 3. Fallback to text-based extraction
  console.log('Falling back to text-based extraction');
  return extractApplicationDate(htmlContent, subject);
}

/**
 * Extract job URL using HTML structure
 * Analyzes HTML patterns for job-related links
 * 
 * @param {string} htmlBody - Email HTML content
 * @return {string} Job URL
 */
function extractJobURLFromHTML(htmlBody) {
  console.log('Extracting job URL from HTML structure');
  
  const htmlContent = htmlBody || '';
  
  // 1. Extract from HTML link patterns
  const linkPatterns = [
    // Job-specific link patterns
    /<a[^>]*href="([^"]*job[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*career[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*position[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*apply[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*hiring[^"]*)"[^>]*>/gi,
    /<a[^>]*href="([^"]*recruiting[^"]*)"[^>]*>/gi,
    // Generic link patterns
    /<a[^>]*href="([^"]*)"[^>]*>/gi
  ];
  
  for (const pattern of linkPatterns) {
    const matches = htmlContent.match(pattern);
    if (matches) {
      for (const match of matches) {
        const url = match[1];
        if (isJobRelatedURL(url)) {
          console.log('Job URL found in HTML:', url);
          return url;
        }
      }
    }
  }
  
  // 2. Extract from email templates
  const templatePatterns = [
    // ATS system patterns
    /<div[^>]*class="[^"]*link[^"]*"[^>]*>([^<]+)<\/div>/gi,
    /<span[^>]*class="[^"]*link[^"]*"[^>]*>([^<]+)<\/span>/gi
  ];
  
  for (const pattern of templatePatterns) {
    const match = htmlContent.match(pattern);
    if (match && match[1]) {
      const url = match[1].trim();
      if (url.startsWith('http')) {
        console.log('URL found in template:', url);
        return url;
      }
    }
  }
  
  // 3. Fallback to text-based extraction
  console.log('Falling back to text-based extraction');
  return extractJobURL(htmlContent);
}

/**
 * Helper function to extract company from HTML match
 * Cleans up HTML content and extracts company name
 * 
 * @param {string} match - HTML match string
 * @return {string} Cleaned company name
 */
function extractCompanyFromMatch(match) {
  // Remove HTML tags and clean up
  let company = match.replace(/<[^>]*>/g, '').trim();
  
  // Remove common prefixes/suffixes
  company = company.replace(/^(hiring|recruiting|hr)\s+/i, '');
  company = company.replace(/\s+(hiring|recruiting|hr)$/i, '');
  company = company.replace(/\s+(team|department)$/i, '');
  company = company.replace(/^[:\-\s]+/, '');
  company = company.replace(/[:\-\s]+$/, '');
  
  return company;
}

/**
 * Helper function to extract position from HTML match
 * Cleans up HTML content and extracts job position
 * 
 * @param {string} match - HTML match string
 * @return {string} Cleaned job position
 */
function extractPositionFromMatch(match) {
  // Remove HTML tags and clean up
  let position = match.replace(/<[^>]*>/g, '').trim();
  
  // Remove common prefixes/suffixes
  position = position.replace(/^(position|role|job)\s*:?\s*/i, '');
  position = position.replace(/\s+(position|role|job)$/i, '');
  position = position.replace(/^[:\-\s]+/, '');
  position = position.replace(/[:\-\s]+$/, '');
  
  return position;
}

/**
 * Helper function to extract date from HTML match
 * Cleans up HTML content and extracts application date
 * 
 * @param {string} match - HTML match string
 * @return {string} Cleaned application date
 */
function extractDateFromMatch(match) {
  // Remove HTML tags and clean up
  let date = match.replace(/<[^>]*>/g, '').trim();
  
  // Remove common prefixes/suffixes
  date = date.replace(/^(applied|submitted|received)\s*:?\s*/i, '');
  date = date.replace(/\s+(applied|submitted|received)$/i, '');
  date = date.replace(/^[:\-\s]+/, '');
  date = date.replace(/[:\-\s]+$/, '');
  
  return date;
}

/**
 * Helper function to check if URL is job-related
 * Determines if a URL is likely related to job applications
 * 
 * @param {string} url - URL to check
 * @return {boolean} True if job-related
 */
function isJobRelatedURL(url) {
  const jobKeywords = [
    'job', 'career', 'position', 'role', 'application', 'apply',
    'hiring', 'recruiting', 'employment', 'opportunity'
  ];
  
  const urlLower = url.toLowerCase();
  return jobKeywords.some(keyword => urlLower.includes(keyword));
}

/**
 * Enhanced email classification using HTML structure
 * Classifies emails as new application, follow-up, rejection, or not job-related
 * 
 * @param {string} htmlBody - Email HTML content
 * @param {string} subject - Email subject
 * @param {string} sender - Email sender
 * @return {Object} Classification result
 */
function classifyEmailTypeFromHTML(htmlBody, subject, sender) {
  console.log('Classifying email type from HTML structure');
  
  const htmlContent = htmlBody || '';
  const text = (subject + ' ' + htmlContent).toLowerCase();
  
  const classification = {
    type: 'unknown',
    confidence: 0,
    reasoning: []
  };
  
  // 1. NEW APPLICATION indicators
  const newAppPatterns = [
    /thank you for applying/i,
    /application received/i,
    /we received your application/i,
    /thank you for your interest/i,
    /application submitted/i,
    /your application has been received/i
  ];
  
  for (const pattern of newAppPatterns) {
    if (text.match(pattern)) {
      classification.type = 'new_application';
      classification.confidence = 85;
      classification.reasoning.push('Contains application confirmation patterns');
      break;
    }
  }
  
  // 2. FOLLOW-UP indicators
  if (classification.type === 'unknown') {
    const followUpPatterns = [
      /interview/i,
      /next steps/i,
      /scheduling/i,
      /we would like to/i,
      /thank you for your time/i,
      /follow.up/i,
      /update on your application/i
    ];
    
    for (const pattern of followUpPatterns) {
      if (text.match(pattern)) {
        classification.type = 'follow_up';
        classification.confidence = 80;
        classification.reasoning.push('Contains interview/next steps patterns');
        break;
      }
    }
  }
  
  // 3. REJECTION indicators
  if (classification.type === 'unknown') {
    const rejectionPatterns = [
      /unfortunately/i,
      /not selected/i,
      /not moving forward/i,
      /other candidates/i,
      /thank you for your interest/i
    ];
    
    for (const pattern of rejectionPatterns) {
      if (text.match(pattern)) {
        classification.type = 'rejection';
        classification.confidence = 90;
        classification.reasoning.push('Contains rejection language');
        break;
      }
    }
  }
  
  // 4. NOT JOB-RELATED indicators
  if (classification.type === 'unknown') {
    const notJobPatterns = [
      /newsletter/i,
      /marketing/i,
      /promotion/i,
      /unsubscribe/i,
      /newsletter/i
    ];
    
    for (const pattern of notJobPatterns) {
      if (text.match(pattern)) {
        classification.type = 'not_job_related';
        classification.confidence = 95;
        classification.reasoning.push('Contains non-job patterns');
        break;
      }
    }
  }
  
  return classification;
}
