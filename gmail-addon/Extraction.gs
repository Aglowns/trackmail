/**
 * Email Data Extraction Functions
 * 
 * This file contains functions to extract structured data from emails,
 * including company names, job positions, and application dates.
 */

/**
 * Extract company name from email subject and body.
 *
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @return {string} Company name
 */
function extractCompanyName(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  
  // Common company name patterns
  const patterns = [
    /thank you for applying to (.+?)(?:\s+at|\s+for|\s+with)/i,
    /application for (.+?)(?:\s+at|\s+for|\s+with)/i,
    /(.+?)\s+hiring team/i,
    /(.+?)\s+recruiting/i,
    /(.+?)\s+hr team/i,
    /at\s+(.+?)(?:\s+for|\s+with)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/[^\w\s]/g, '');
    }
  }
  
  // Fallback: extract from "From" field or first part of subject
  if (subject.includes('Thank you for applying')) {
    const match = subject.match(/Thank you for applying for (.+?) at (.+?)/i);
    if (match && match[2]) {
      return match[2].trim();
    }
  }
  
  return 'Unknown Company';
}

/**
 * Extract job position from email subject and body.
 *
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @return {string} Job position
 */
function extractJobPosition(subject, body) {
  const text = (subject + ' ' + body).toLowerCase();
  
  // Common job position patterns
  const patterns = [
    /thank you for applying for the (.+?)(?:\s+at|\s+role)/i,
    /application for the (.+?)(?:\s+at|\s+role)/i,
    /(.+?)\s+role at/i,
    /(.+?)\s+position at/i,
    /(.+?)\s+internship/i,
    /(.+?)\s+intern/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: extract from subject
  if (subject.includes('Thank you for applying for')) {
    const match = subject.match(/Thank you for applying for (.+?) at/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return 'Unknown Position';
}

/**
 * Extract application date from email body.
 *
 * @param {string} body - Email body
 * @return {string} Application date
 */
function extractApplicationDate(body) {
  const text = body.toLowerCase();
  
  // Common date patterns
  const patterns = [
    /applied on (.+?)(?:\s+for|\s+to)/i,
    /application submitted on (.+?)(?:\s+for|\s+to)/i,
    /submitted on (.+?)(?:\s+for|\s+to)/i,
    /applied (.+?)(?:\s+for|\s+to)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // Fallback: use email received date
  return 'Unknown Date';
}
