/**
 * Main entry point for Gmail Add-on
 */

import { GmailEvent } from './types';
import { extractEmailData, getCurrentMessage } from './gmail';
import { parseJobApplication } from './parser';
import { upsertApplication, getApplicationByThread, getConfig } from './storage';
import { formatDate } from './util';
import { 
  buildSettingsCardImpl as _buildSettingsCardImpl,
  onSaveSettings as _onSaveSettings,
  onTestConnection as _onTestConnection,
  onManualScan as _onManualScan,
  runManualScanSync as _runManualScanSync
} from './settings';
import {
  hourlyScan as _hourlyScan,
  hourlyScanImpl as _hourlyScanImpl,
  dailyDigestScan as _dailyDigestScan,
  setupTriggers as _setupTriggers,
  removeTriggers as _removeTriggers
} from './scheduler';

/**
 * Build context card when Gmail message is opened
 */
function onGmailMessageOpen(e: GmailEvent): GoogleAppsScript.Card_Service.Card[] {
  try {
    console.log('onGmailMessageOpen triggered');
    
    // Check configuration
    const config = getConfig();
    if (!config) {
      return [buildConfigErrorCard()];
    }
    
    // Get current message
    const message = getCurrentMessage(e);
    if (!message) {
      return [buildErrorCard('Unable to load message')];
    }
    
    const messageId = message.getId();
    const threadId = message.getThread().getId();
    
    // Extract email data
    const emailData = extractEmailData(messageId);
    if (!emailData) {
      return [buildErrorCard('Unable to parse email data')];
    }
    
    // Parse as job application
    const parsed = parseJobApplication(emailData);
    
    if (!parsed) {
      // Not a job application email
      return [buildNoJobCard()];
    }
    
    // Check if already saved
    const existingApp = getApplicationByThread(threadId);
    const isExisting = existingApp.success && existingApp.data;
    
    // Build context card
    return [buildJobApplicationCard(parsed, emailData, isExisting)];
    
  } catch (error) {
    console.error('Error in onGmailMessageOpen:', error);
    return [buildErrorCard(`Error: ${error.toString()}`)];
  }
}

/**
 * Build homepage card (Settings)
 */
function onHomepage(e: any): GoogleAppsScript.Card_Service.Card {
  try {
    return buildSettingsCard();
  } catch (error) {
    console.error('Error in onHomepage:', error);
    return buildErrorCard(`Error: ${error.toString()}`);
  }
}

/**
 * Build job application context card
 */
function buildJobApplicationCard(
  parsed: any,
  emailData: any,
  isExisting: boolean
): GoogleAppsScript.Card_Service.Card {
  const card = CardService.newCardBuilder();
  
  // Header
  card.setHeader(
    CardService.newCardHeader()
      .setTitle(isExisting ? 'Job Application (Saved)' : 'Job Application Detected')
      .setImageUrl('https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png')
  );
  
  // Application details section
  const detailsSection = CardService.newCardSection();
  
  detailsSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Company')
      .setContent(parsed.company)
      .setIcon(CardService.Icon.BOOKMARK)
  );
  
  detailsSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Position')
      .setContent(parsed.jobTitle)
      .setIcon(CardService.Icon.DESCRIPTION)
  );
  
  detailsSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Status')
      .setContent(parsed.status.toUpperCase())
      .setIcon(CardService.Icon.STAR)
  );
  
  detailsSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Source')
      .setContent(parsed.source)
      .setIcon(CardService.Icon.INVITE)
  );
  
  detailsSection.addWidget(
    CardService.newKeyValue()
      .setTopLabel('Confidence')
      .setContent(parsed.confidence.toUpperCase())
      .setIcon(
        parsed.confidence === 'high' ? CardService.Icon.STAR :
        parsed.confidence === 'medium' ? CardService.Icon.CONFIRMATION_NUMBER_ICON :
        CardService.Icon.MULTIPLE_PEOPLE
      )
  );
  
  if (parsed.jobUrl) {
    detailsSection.addWidget(
      CardService.newKeyValue()
        .setTopLabel('Job URL')
        .setContent(parsed.jobUrl.substring(0, 60) + (parsed.jobUrl.length > 60 ? '...' : ''))
        .setIcon(CardService.Icon.LINK)
        .setOpenLink(CardService.newOpenLink().setUrl(parsed.jobUrl))
    );
  }
  
  card.addSection(detailsSection);
  
  // Actions section
  const actionsSection = CardService.newCardSection();
  
  // Save/Update button
  const saveButton = CardService.newTextButton()
    .setText(isExisting ? '✓ Update in Tracker' : '+ Save to Tracker')
    .setBackgroundColor(isExisting ? '#34a853' : '#4285f4')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onSaveApplication')
        .setParameters({
          messageId: emailData.messageId,
          threadId: emailData.threadId,
          lastEmailId: emailData.messageId,
          company: parsed.company,
          title: parsed.jobTitle, // Map jobTitle to title
          jobUrl: parsed.jobUrl || '',
          source: parsed.source,
          status: parsed.status,
          confidence: parsed.confidence.toUpperCase(), // Ensure uppercase
          appliedAt: emailData.internalDate,
          rawSubject: emailData.subject,
          rawSnippet: emailData.bodyText.substring(0, 500), // First 500 chars as snippet
        })
    );
  
  actionsSection.addWidget(saveButton);
  
  // Dashboard link
  const config = getConfig();
  if (config && config.DASHBOARD_URL) {
    const dashboardButton = CardService.newTextButton()
      .setText('Open Dashboard')
      .setOpenLink(CardService.newOpenLink().setUrl(config.DASHBOARD_URL))
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT);
    
    actionsSection.addWidget(dashboardButton);
  }
  
  card.addSection(actionsSection);
  
  // Info footer
  if (parsed.notes) {
    const footerSection = CardService.newCardSection();
    footerSection.addWidget(
      CardService.newTextParagraph()
        .setText(`<font color="#666"><small>${parsed.notes}</small></font>`)
    );
    card.addSection(footerSection);
  }
  
  return card.build();
}

/**
 * Handle save application action
 */
function onSaveApplication(e: any): GoogleAppsScript.Card_Service.ActionResponse {
  try {
    const params = e.parameters;
    
    const result = upsertApplication({
      messageId: params.messageId,
      threadId: params.threadId,
      lastEmailId: params.lastEmailId || params.messageId,
      company: params.company,
      title: params.title || params.jobTitle, // Support both field names
      jobUrl: params.jobUrl || null,
      source: params.source,
      status: params.status,
      confidence: params.confidence || 'MEDIUM',
      appliedAt: params.appliedAt,
      rawSubject: params.rawSubject,
      rawSnippet: params.rawSnippet,
    });
    
    if (result.success) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('✓ Application saved successfully!')
            .setType(CardService.NotificationType.INFO)
        )
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(`Error: ${result.error}`)
            .setType(CardService.NotificationType.ERROR)
        )
        .build();
    }
  } catch (error) {
    console.error('Error in onSaveApplication:', error);
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText(`Error: ${error.toString()}`)
          .setType(CardService.NotificationType.ERROR)
      )
      .build();
  }
}

/**
 * Build settings card
 */
function buildSettingsCard(): GoogleAppsScript.Card_Service.Card {
  // Import settings module function
  return buildSettingsCardImpl();
}

/**
 * Build error card
 */
function buildErrorCard(message: string): GoogleAppsScript.Card_Service.Card {
  const card = CardService.newCardBuilder();
  
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Error')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/error_outline_red_24dp.png')
  );
  
  const section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph()
      .setText(message)
  );
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Build configuration error card
 */
function buildConfigErrorCard(): GoogleAppsScript.Card_Service.Card {
  const card = CardService.newCardBuilder();
  
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Configuration Required')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/settings_24dp.png')
  );
  
  const section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph()
      .setText('Please configure the add-on in Settings before using it.')
  );
  
  const button = CardService.newTextButton()
    .setText('Go to Settings')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onHomepage')
    );
  
  section.addWidget(button);
  
  card.addSection(section);
  
  return card.build();
}

/**
 * Build "not a job application" card
 */
function buildNoJobCard(): GoogleAppsScript.Card_Service.Card {
  const card = CardService.newCardBuilder();
  
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Job Application Tracker')
      .setImageUrl('https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png')
  );
  
  const section = CardService.newCardSection();
  section.addWidget(
    CardService.newTextParagraph()
      .setText('This email doesn\'t appear to be a job application confirmation.\n\nThe add-on will automatically detect and track job application emails.')
  );
  
  card.addSection(section);
  
  return card.build();
}

// Export all global functions
export { onGmailMessageOpen, onHomepage, onSaveApplication };
export { 
  _buildSettingsCardImpl as buildSettingsCardImpl,
  _onSaveSettings as onSaveSettings,
  _onTestConnection as onTestConnection,
  _onManualScan as onManualScan,
  _runManualScanSync as runManualScanSync
};
export {
  _hourlyScan as hourlyScan,
  _hourlyScanImpl as hourlyScanImpl,
  _dailyDigestScan as dailyDigestScan,
  _setupTriggers as setupTriggers,
  _removeTriggers as removeTriggers
};

