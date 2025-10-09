/**
 * Gmail API interaction functions
 */

import { ParsedEmail } from './types';
import { htmlToText, extractUrls } from './util';

/**
 * Extract email data from a Gmail message
 */
export function extractEmailData(messageId: string): ParsedEmail | null {
  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      console.error('Message not found:', messageId);
      return null;
    }

    const thread = message.getThread();
    const subject = message.getSubject();
    const from = message.getFrom();
    const date = message.getDate();
    
    // Get body content
    let bodyText = message.getPlainBody();
    
    // If plain body is empty or too short, try HTML body
    if (!bodyText || bodyText.length < 50) {
      const htmlBody = message.getBody();
      bodyText = htmlToText(htmlBody);
    }
    
    // Extract links from both plain and HTML body
    const plainLinks = extractUrls(bodyText);
    const htmlBody = message.getBody();
    const htmlLinks = extractUrls(htmlBody);
    const allLinks = Array.from(new Set([...plainLinks, ...htmlLinks]));
    
    return {
      messageId: message.getId(),
      threadId: thread.getId(),
      internalDate: date.toISOString(),
      subject: subject,
      from: from,
      bodyText: bodyText,
      links: allLinks
    };
  } catch (error) {
    console.error('Error extracting email data:', error);
    return null;
  }
}

/**
 * Search for job-related emails in the last N days
 */
export function searchJobEmails(daysBack: number = 2): GmailMessage[] {
  try {
    const searchDate = new Date();
    searchDate.setDate(searchDate.getDate() - daysBack);
    const dateStr = Utilities.formatDate(searchDate, Session.getScriptTimeZone(), 'yyyy/MM/dd');
    
    // Search for common job application confirmation patterns
    const queries = [
      `after:${dateStr} (subject:"application received" OR subject:"application submitted" OR subject:"application confirmation")`,
      `after:${dateStr} (subject:"thank you for applying" OR subject:"thanks for applying")`,
      `after:${dateStr} from:(noreply@greenhouse.io OR jobs-noreply@linkedin.com OR jobalerts-noreply@linkedin.com OR no-reply@workday.com)`,
      `after:${dateStr} (from:careers@ OR from:recruiting@ OR from:talent@ OR from:jobs@)`,
    ];
    
    const foundMessages = new Set<string>();
    const messages: GmailMessage[] = [];
    
    for (const query of queries) {
      try {
        const threads = GmailApp.search(query, 0, 50);
        
        for (const thread of threads) {
          const threadMessages = thread.getMessages();
          for (const msg of threadMessages) {
            const msgId = msg.getId();
            if (!foundMessages.has(msgId)) {
              foundMessages.add(msgId);
              messages.push(msg);
            }
          }
        }
      } catch (e) {
        console.warn('Search query failed:', query, e);
      }
    }
    
    return messages;
  } catch (error) {
    console.error('Error searching job emails:', error);
    return [];
  }
}

/**
 * Get current message from Add-on context
 */
export function getCurrentMessage(event: any): GmailMessage | null {
  try {
    let messageId: string | null = null;
    
    // Try different event structures
    if (event?.messageMetadata?.messageId) {
      messageId = event.messageMetadata.messageId;
    } else if (event?.gmail?.messageId) {
      messageId = event.gmail.messageId;
    }
    
    if (!messageId) {
      console.error('No messageId in event');
      return null;
    }
    
    return GmailApp.getMessageById(messageId);
  } catch (error) {
    console.error('Error getting current message:', error);
    return null;
  }
}

/**
 * Get access token for Gmail API (if needed for advanced operations)
 */
export function getGmailAccessToken(): string {
  return ScriptApp.getOAuthToken();
}

