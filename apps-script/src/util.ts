/**
 * Utility functions
 */

/**
 * Extract domain from email address or URL
 */
export function extractDomain(text: string): string | null {
  if (!text) return null;
  
  // Email address
  const emailMatch = text.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    return emailMatch[1].toLowerCase();
  }
  
  // URL
  try {
    const urlMatch = text.match(/https?:\/\/([a-zA-Z0-9.-]+)/);
    if (urlMatch) {
      return urlMatch[1].toLowerCase().replace(/^www\./, '');
    }
  } catch (e) {
    // Ignore
  }
  
  return null;
}

/**
 * Strip HTML tags and convert to plain text
 */
export function htmlToText(html: string): string {
  if (!html) return '';
  
  // Remove script and style tags with their content
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  
  // Replace common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Replace <br> and block elements with newlines
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(div|p|li|tr|h[1-6])>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode remaining entities
  text = text.replace(/&[a-z]+;/gi, ' ');
  
  // Normalize whitespace
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  return text.trim();
}

/**
 * Extract all URLs from text
 */
export function extractUrls(text: string): string[] {
  if (!text) return [];
  
  const urlRegex = /https?:\/\/[^\s<>"]+/gi;
  const matches = text.match(urlRegex) || [];
  
  // Deduplicate and clean
  const urls = new Set<string>();
  matches.forEach(url => {
    // Remove trailing punctuation
    url = url.replace(/[.,;:!?)]+$/, '');
    urls.add(url);
  });
  
  return Array.from(urls);
}

/**
 * Truncate text to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Clean company name (remove Inc., LLC, etc.)
 */
export function cleanCompanyName(name: string): string {
  if (!name) return '';
  
  return name
    .replace(/,?\s+(Inc\.?|LLC\.?|Ltd\.?|Corporation|Corp\.?|Co\.?)$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate a simple hash for idempotency
 */
export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if string contains any of the patterns (case-insensitive)
 */
export function containsAny(text: string, patterns: string[]): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return patterns.some(pattern => lowerText.includes(pattern.toLowerCase()));
}

/**
 * Extract first match from regex
 */
export function extractMatch(text: string, regex: RegExp): string | null {
  if (!text) return null;
  const match = text.match(regex);
  return match ? match[1] || match[0] : null;
}

