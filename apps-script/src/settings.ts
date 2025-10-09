/**
 * Settings UI and configuration management
 */

import { getConfig, saveConfig, testApiConnection } from './storage';

/**
 * Build settings card UI
 */
export function buildSettingsCardImpl(): GoogleAppsScript.Card_Service.Card {
  const card = CardService.newCardBuilder();
  
  card.setHeader(
    CardService.newCardHeader()
      .setTitle('Job Tracker Settings')
      .setImageUrl('https://www.gstatic.com/images/icons/material/system/1x/settings_24dp.png')
  );
  
  // Get current config
  const config = getConfig();
  
  // Configuration section
  const configSection = CardService.newCardSection()
    .setHeader('API Configuration');
  
  configSection.addWidget(
    CardService.newTextInput()
      .setFieldName('apiUrl')
      .setTitle('Vercel API URL')
      .setHint('e.g., https://yourapp.vercel.app')
      .setValue(config?.VERCEL_API_URL || '')
  );
  
  configSection.addWidget(
    CardService.newTextInput()
      .setFieldName('apiKey')
      .setTitle('API Key')
      .setHint('Your JOBMAIL_API_KEY')
      .setValue(config?.JOBMAIL_API_KEY || '')
  );
  
  configSection.addWidget(
    CardService.newTextInput()
      .setFieldName('dashboardUrl')
      .setTitle('Dashboard URL')
      .setHint('Optional: Custom dashboard URL')
      .setValue(config?.DASHBOARD_URL || '')
  );
  
  card.addSection(configSection);
  
  // Actions section
  const actionsSection = CardService.newCardSection();
  
  // Save configuration button
  const saveButton = CardService.newTextButton()
    .setText('Save Configuration')
    .setBackgroundColor('#4285f4')
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onSaveSettings')
    );
  
  actionsSection.addWidget(saveButton);
  
  // Test connection button
  if (config) {
    const testButton = CardService.newTextButton()
      .setText('Test Connection')
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName('onTestConnection')
      );
    
    actionsSection.addWidget(testButton);
  }
  
  card.addSection(actionsSection);
  
  // Manual scan section
  const scanSection = CardService.newCardSection()
    .setHeader('Manual Actions');
  
  scanSection.addWidget(
    CardService.newTextParagraph()
      .setText('Run a manual scan to find and save job application emails from the last 2 days.')
  );
  
  const scanButton = CardService.newTextButton()
    .setText('Run Scan Now')
    .setBackgroundColor('#34a853')
    .setDisabled(!config) // Disable if not configured
    .setOnClickAction(
      CardService.newAction()
        .setFunctionName('onManualScan')
    );
  
  scanSection.addWidget(scanButton);
  
  card.addSection(scanSection);
  
  // Info section
  const infoSection = CardService.newCardSection()
    .setHeader('About');
  
  infoSection.addWidget(
    CardService.newTextParagraph()
      .setText('<font color="#666">This add-on automatically detects job application confirmation emails and saves them to your tracker via the Vercel API.</font>')
  );
  
  if (config?.DASHBOARD_URL) {
    const dashboardButton = CardService.newTextButton()
      .setText('Open Dashboard →')
      .setOpenLink(CardService.newOpenLink().setUrl(config.DASHBOARD_URL))
      .setTextButtonStyle(CardService.TextButtonStyle.TEXT);
    
    infoSection.addWidget(dashboardButton);
  }
  
  card.addSection(infoSection);
  
  return card.build();
}

/**
 * Handle save settings action
 */
export function onSaveSettings(e: any): GoogleAppsScript.Card_Service.ActionResponse {
  try {
    const formInputs = e.formInput;
    
    if (!formInputs) {
      throw new Error('No form data received');
    }
    
    const apiUrl = formInputs.apiUrl?.trim();
    const apiKey = formInputs.apiKey?.trim();
    const dashboardUrl = formInputs.dashboardUrl?.trim();
    
    if (!apiUrl || !apiKey) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('API URL and API Key are required')
            .setType(CardService.NotificationType.ERROR)
        )
        .build();
    }
    
    // Validate URL format
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('API URL must start with http:// or https://')
            .setType(CardService.NotificationType.ERROR)
        )
        .build();
    }
    
    // Save configuration
    const success = saveConfig({
      VERCEL_API_URL: apiUrl,
      JOBMAIL_API_KEY: apiKey,
      DASHBOARD_URL: dashboardUrl || apiUrl,
    });
    
    if (success) {
      // Refresh the card
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('✓ Configuration saved successfully!')
            .setType(CardService.NotificationType.INFO)
        )
        .setNavigation(
          CardService.newNavigation()
            .updateCard(buildSettingsCardImpl())
        )
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('Failed to save configuration')
            .setType(CardService.NotificationType.ERROR)
        )
        .build();
    }
  } catch (error) {
    console.error('Error in onSaveSettings:', error);
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
 * Handle test connection action
 */
export function onTestConnection(e: any): GoogleAppsScript.Card_Service.ActionResponse {
  try {
    const result = testApiConnection();
    
    if (result.success) {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText('✓ Connection successful!')
            .setType(CardService.NotificationType.INFO)
        )
        .build();
    } else {
      return CardService.newActionResponseBuilder()
        .setNotification(
          CardService.newNotification()
            .setText(`Connection failed: ${result.error}`)
            .setType(CardService.NotificationType.WARNING)
        )
        .build();
    }
  } catch (error) {
    console.error('Error in onTestConnection:', error);
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
 * Handle manual scan action
 */
export function onManualScan(e: any): GoogleAppsScript.Card_Service.ActionResponse {
  try {
    // Trigger the manual scan
    const result = runManualScanSync();
    
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText(result)
          .setType(CardService.NotificationType.INFO)
      )
      .build();
  } catch (error) {
    console.error('Error in onManualScan:', error);
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
 * Run manual scan synchronously (for immediate feedback)
 */
export function runManualScanSync(): string {
  // Import from scheduler
  const count = hourlyScanImpl();
  
  if (count === 0) {
    return 'No new job applications found';
  } else if (count === 1) {
    return '✓ Found and saved 1 application';
  } else {
    return `✓ Found and saved ${count} applications`;
  }
}

// Functions are now exported above

