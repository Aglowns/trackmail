/**
 * Time-driven triggers for automated scanning
 */

import { searchJobEmails, extractEmailData } from './gmail';
import { parseJobApplication } from './parser';
import { upsertApplication, getConfig } from './storage';

/**
 * Hourly scan for new job application emails
 * This function should be set up as a time-driven trigger
 */
export function hourlyScan(): void {
  try {
    console.log('Starting hourly job scan...');
    
    // Check configuration
    const config = getConfig();
    if (!config) {
      console.error('Configuration not set, skipping scan');
      return;
    }
    
    const count = hourlyScanImpl();
    
    console.log(`Hourly scan complete. Processed ${count} applications.`);
  } catch (error) {
    console.error('Error in hourlyScan:', error);
  }
}

/**
 * Implementation of hourly scan (can be called from UI too)
 */
export function hourlyScanImpl(): number {
  let processedCount = 0;
  
  // Search for job-related emails from last 2 days
  const messages = searchJobEmails(2);
  
  console.log(`Found ${messages.length} potential job emails`);
  
  for (const message of messages) {
    try {
      const messageId = message.getId();
      const threadId = message.getThread().getId();
      
      // Extract email data
      const emailData = extractEmailData(messageId);
      if (!emailData) {
        console.log(`Skipping message ${messageId}: unable to extract data`);
        continue;
      }
      
      // Parse as job application
      const parsed = parseJobApplication(emailData);
      
      if (!parsed) {
        console.log(`Skipping message ${messageId}: not a job application`);
        continue;
      }
      
      // Only process high confidence emails in automated scan
      if (parsed.confidence === 'low') {
        console.log(`Skipping message ${messageId}: low confidence`);
        continue;
      }
      
      // Upsert to API (idempotent via messageId)
      const result = upsertApplication({
        messageId: emailData.messageId,
        threadId: emailData.threadId,
        lastEmailId: emailData.messageId,
        company: parsed.company,
        title: parsed.jobTitle, // Map jobTitle to title
        jobUrl: parsed.jobUrl,
        source: parsed.source,
        status: parsed.status,
        confidence: parsed.confidence.toUpperCase(), // Ensure uppercase
        appliedAt: emailData.internalDate,
        rawSubject: emailData.subject,
        rawSnippet: emailData.bodyText.substring(0, 500), // First 500 chars as snippet
      });
      
      if (result.success) {
        console.log(`Saved application: ${parsed.company} - ${parsed.jobTitle}`);
        processedCount++;
      } else {
        console.error(`Failed to save application: ${result.error}`);
      }
      
      // Small delay to avoid rate limiting
      Utilities.sleep(200);
      
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }
  
  return processedCount;
}

/**
 * Daily digest scan (optional - more comprehensive)
 * Scans last 7 days and processes medium confidence too
 */
export function dailyDigestScan(): void {
  try {
    console.log('Starting daily digest scan...');
    
    // Check configuration
    const config = getConfig();
    if (!config) {
      console.error('Configuration not set, skipping scan');
      return;
    }
    
    let processedCount = 0;
    
    // Search for job-related emails from last 7 days
    const messages = searchJobEmails(7);
    
    console.log(`Found ${messages.length} potential job emails`);
    
    for (const message of messages) {
      try {
        const messageId = message.getId();
        const threadId = message.getThread().getId();
        
        // Extract email data
        const emailData = extractEmailData(messageId);
        if (!emailData) {
          continue;
        }
        
        // Parse as job application
        const parsed = parseJobApplication(emailData);
        
        if (!parsed) {
          continue;
        }
        
        // Process high and medium confidence
        if (parsed.confidence === 'low') {
          continue;
        }
        
        // Upsert to API
        const result = upsertApplication({
          messageId: emailData.messageId,
          threadId: emailData.threadId,
          lastEmailId: emailData.messageId,
          company: parsed.company,
          title: parsed.jobTitle, // Map jobTitle to title
          jobUrl: parsed.jobUrl,
          source: parsed.source,
          status: parsed.status,
          confidence: parsed.confidence.toUpperCase(), // Ensure uppercase
          appliedAt: emailData.internalDate,
          rawSubject: emailData.subject,
          rawSnippet: emailData.bodyText.substring(0, 500), // First 500 chars as snippet
        });
        
        if (result.success) {
          console.log(`Saved application: ${parsed.company} - ${parsed.jobTitle}`);
          processedCount++;
        }
        
        // Delay to avoid rate limiting
        Utilities.sleep(300);
        
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
    
    console.log(`Daily digest scan complete. Processed ${processedCount} applications.`);
  } catch (error) {
    console.error('Error in dailyDigestScan:', error);
  }
}

/**
 * Setup time-driven triggers
 * Run this once manually to install the triggers
 */
export function setupTriggers(): void {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      ScriptApp.deleteTrigger(trigger);
    }
    
    console.log('Deleted existing triggers');
    
    // Create hourly trigger
    ScriptApp.newTrigger('hourlyScan')
      .timeBased()
      .everyHours(1)
      .create();
    
    console.log('Created hourly scan trigger');
    
    // Create daily trigger (optional)
    ScriptApp.newTrigger('dailyDigestScan')
      .timeBased()
      .atHour(8) // Run at 8 AM
      .everyDays(1)
      .create();
    
    console.log('Created daily digest scan trigger');
    
    console.log('Triggers setup complete!');
  } catch (error) {
    console.error('Error setting up triggers:', error);
    throw error;
  }
}

/**
 * Remove all time-driven triggers
 */
export function removeTriggers(): void {
  try {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      ScriptApp.deleteTrigger(trigger);
    }
    console.log(`Removed ${triggers.length} triggers`);
  } catch (error) {
    console.error('Error removing triggers:', error);
    throw error;
  }
}

// Functions are now exported above

