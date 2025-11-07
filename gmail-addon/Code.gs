/**
 * JobMail Gmail Add-on
 * 
 * Main entry points and trigger functions for the Gmail Add-on.
 * This file contains the core functions that Gmail calls when the add-on is activated.
 * 
 * Architecture:
 * - Code.gs: Main entry points and triggers
 * - Auth.gs: Authentication and session management
 * - API.gs: Backend API communication
 * - UI.gs: CardService UI components
 */

/**
 * Called when the add-on is installed or when Gmail is opened.
 * This function is declared in appsscript.json as the homepage trigger.
 * 
 * @param {Object} e - Event object containing context information
 * @return {Card} The card to display
 */
function onGmailMessageOpen(e) {
  console.log('onGmailMessageOpen triggered');
  
  try {
    // Check if user is authenticated by verifying we have an API key
    const apiKey = getApiKey();
    
    if (!apiKey) {
      // User not authenticated - show sign-in card
      console.log('No valid access token found - showing sign-in card');
      return buildSignInCard();
    }
    
    console.log('User authenticated - checking subscription status');
    
    // Check subscription status
    const subscription = checkSubscriptionStatus();
    const autoTrackingEnabled = subscription && 
                                subscription.features && 
                                subscription.features.auto_tracking === true;
    
    console.log('Auto-tracking enabled:', autoTrackingEnabled);
    
    // User is authenticated - show email tracking card
    const messageId = e.gmail ? e.gmail.messageId : null;
    const gmailAccessToken = e.gmail ? e.gmail.accessToken : null;
    
    if (!messageId) {
      console.log('No messageId available, trying to get from current message');
      // Try to get the current message ID
      try {
        const threads = GmailApp.getInboxThreads(0, 1);
        if (threads.length > 0) {
          const messages = threads[0].getMessages();
          if (messages.length > 0) {
            const currentMessageId = messages[0].getId();
            console.log('Using current message ID:', currentMessageId);
            
            // If auto-tracking enabled, attempt automatic tracking
            if (autoTrackingEnabled && gmailAccessToken) {
              console.log('Auto-tracking enabled, attempting automatic tracking...');
              const autoTrackResult = attemptAutoTracking(currentMessageId, gmailAccessToken);
              
              if (autoTrackResult && autoTrackResult.success === true) {
                // Auto-tracking successful - show success card
                console.log('Auto-tracking successful');
                return buildAutoTrackingSuccessCard(autoTrackResult);
              } else if (autoTrackResult && autoTrackResult.isJobRelated === false) {
                // Not job-related - show normal tracking card
                console.log('Email is not job-related, showing normal card');
                return buildTrackingCard(currentMessageId, gmailAccessToken, subscription);
              }
              // If auto-tracking failed or email not job-related, fall through to normal card
            }
            
            return buildTrackingCard(currentMessageId, gmailAccessToken, subscription);
          }
        }
      } catch (msgError) {
        console.error('Could not get current message:', msgError);
      }
    }
    
    // If auto-tracking enabled, attempt automatic tracking
    if (autoTrackingEnabled && messageId && gmailAccessToken) {
      console.log('Auto-tracking enabled, attempting automatic tracking...');
      const autoTrackResult = attemptAutoTracking(messageId, gmailAccessToken);
      
      if (autoTrackResult && autoTrackResult.success === true) {
        // Auto-tracking successful - show success card
        console.log('Auto-tracking successful');
        return buildAutoTrackingSuccessCard(autoTrackResult);
      } else if (autoTrackResult && autoTrackResult.isJobRelated === false) {
        // Not job-related - show normal tracking card
        console.log('Email is not job-related, showing normal card');
        return buildTrackingCard(messageId, gmailAccessToken, subscription);
      }
      // If auto-tracking failed, fall through to normal card
    }
    
    return buildTrackingCard(messageId, gmailAccessToken, subscription);
    
  } catch (error) {
    console.error('Error in onGmailMessageOpen:', error);
    return buildErrorCard('Failed to load add-on: ' + error.message);
  }
}

/**
 * Universal action handler for compose actions.
 * This is required even if we don't use compose functionality.
 * 
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function onGmailCompose(e) {
  // We don't use compose actions, but this is required by Gmail
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('JobMail'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('JobMail works with received emails. Open an email to track it as a job application.')
        )
    )
    .build();
}

/**
 * Settings action handler.
 * This is called when the user clicks "Settings" from the add-on menu.
 * 
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function onGmailSettings(e) {
  console.log('onGmailSettings triggered');
  
  try {
    // Check if user is authenticated by verifying we have an API key
    const apiKey = getApiKey();
    const userEmail = getUserEmail();
    
    if (!apiKey) {
      // User not authenticated - show sign-in card
      console.log('No valid access token found - showing sign-in card');
      return buildSignInCard();
    }
    
    console.log('User authenticated - showing settings card');
    // User is authenticated - show settings card
    return buildSettingsCard(userEmail);
    
  } catch (error) {
    console.error('Error in onGmailSettings:', error);
    return buildErrorCard('Failed to load settings: ' + error.message);
  }
}

/**
 * Attempt automatic tracking of an email for Pro users.
 * This function is called automatically when a Pro user opens a job-related email.
 * 
 * @param {string} messageId - Gmail message ID
 * @param {string} accessToken - Gmail API access token
 * @return {Object} Tracking result with success status
 */
function attemptAutoTracking(messageId, accessToken) {
  console.log('Attempting automatic tracking for message:', messageId);
  
  try {
    // Fetch email data
    const emailData = fetchEmailData(messageId, accessToken);
    
    if (!emailData) {
      console.log('Failed to fetch email data for auto-tracking');
      return {
        success: false,
        message: 'Failed to fetch email data'
      };
    }
    
    // Quick check if job-related using lightweight parsing
    console.log('Quick check if job-related...');
    let isJobRelated = true;
    
    try {
      // Use quick parsing for fast job-related check
      const quickParse = quickEmailParsing(emailData.html_body || '', emailData.subject || '', emailData.sender || '');
      isJobRelated = quickParse.isJobRelated !== false;
      
      if (!isJobRelated) {
        console.log('Email is not job-related, skipping auto-tracking');
        return {
          success: false,
          isJobRelated: false,
          message: 'Email is not job-related'
        };
      }
    } catch (parseError) {
      console.error('Error in quick parse check:', parseError);
      // Continue with tracking if parsing fails (better to track than miss)
    }
    
    // Use advanced AI parsing for accurate data extraction
    console.log('Using advanced AI parsing for auto-tracking...');
    const parsedData = ultraAccurateEmailParsing(
      emailData.html_body || '', 
      emailData.subject || '', 
      emailData.sender || ''
    );
    
    // Detect application status
    const statusDetection = detectJobApplicationStatus(
      emailData.html_body || '', 
      emailData.subject || '', 
      emailData.sender || '', 
      parsedData.company || '', 
      parsedData.position || ''
    );
    
    // Add parsed data to emailData
    emailData.parsed_company = parsedData.company;
    emailData.parsed_position = parsedData.position;
    emailData.parsed_email_type = parsedData.emailType;
    emailData.parsed_confidence = parsedData.confidence;
    emailData.parsed_job_url = normalizeJobUrl(
      parsedData.jobUrl || parsedData.job_url || parsedData.jobURL
    );
    
    // Add status detection data
    emailData.detected_status = statusDetection.status;
    emailData.status_confidence = statusDetection.confidence;
    emailData.status_indicators = statusDetection.indicators;
    emailData.status_reasoning = statusDetection.reasoning;
    emailData.is_job_related = statusDetection.isJobRelated;
    emailData.urgency = statusDetection.urgency;
    
    // Skip if not job-related after full analysis
    if (statusDetection.isJobRelated === false || statusDetection.status === 'not_job_related') {
      console.log('Email is not job-related after full analysis');
      return {
        success: false,
        isJobRelated: false,
        message: 'Email is not job-related'
      };
    }
    
    // Call ingestEmail automatically
    console.log('Calling ingestEmail for auto-tracking...');
    const result = ingestEmail(emailData);
    
    console.log('Auto-tracking result:', JSON.stringify(result));
    
    if (result && result.success === true) {
      return {
        success: true,
        message: result.message || 'Application tracked automatically',
        application_id: result.application_id,
        duplicate: result.duplicate || false,
        isJobRelated: true
      };
    } else {
      // Check if it's a limit exceeded error
      if (result && result.detail && result.detail.error === 'limit_exceeded') {
        return {
          success: false,
          error: 'limit_exceeded',
          errorDetails: result.detail,
          message: result.detail.message || 'Application limit reached'
        };
      }
      
      return {
        success: false,
        message: result ? (result.message || 'Failed to track application') : 'No response from server',
        isJobRelated: true
      };
    }
    
  } catch (error) {
    console.error('Error in attemptAutoTracking:', error);
    return {
      success: false,
      message: error.message || 'Failed to auto-track email',
      error: error.toString()
    };
  }
}

/**
 * Action handler for tracking an email as a job application.
 * This is called when the user clicks the "Track Application" button.
 * 
 * @param {Object} e - Event object containing form inputs and context
 * @return {ActionResponse} Navigation action to show result
 */
function trackApplicationAction(e) {
  console.log('trackApplicationAction triggered');
  
  try {
    // Get message ID from parameters
    const messageId = e.parameters.messageId;
    const accessToken = e.parameters.accessToken;
    
    if (!messageId || !accessToken) {
      throw new Error('Missing message ID or access token');
    }
    
    // Fetch email details using Gmail API (lightweight operation)
    const emailData = fetchEmailData(messageId, accessToken);
    
    if (!emailData) {
      throw new Error('Failed to fetch email data');
    }
    
    // Parse email data using advanced AI parsing for accurate results
    console.log('Parsing email data using ultraAccurateEmailParsing...');
    const parsedData = ultraAccurateEmailParsing(emailData.html_body, emailData.subject, emailData.sender);
    console.log('Advanced parsed data:', parsedData);
    
    // Enhanced: Detect job application status using AI
    console.log('🤖 Detecting job application status...');
    const statusDetection = detectJobApplicationStatus(
      emailData.html_body, 
      emailData.subject, 
      emailData.sender, 
      parsedData.company, 
      parsedData.position
    );
    console.log('Status detection result:', statusDetection);
    
      // Add parsed data to emailData
      emailData.parsed_company = parsedData.company;
      emailData.parsed_position = parsedData.position;
      emailData.parsed_email_type = parsedData.emailType;
      emailData.parsed_confidence = parsedData.confidence;
      emailData.parsed_job_url = normalizeJobUrl(
        parsedData.jobUrl || parsedData.job_url || parsedData.jobURL
      );
      
      // Add status detection data
      emailData.detected_status = statusDetection.status;
      emailData.status_confidence = statusDetection.confidence;
      emailData.status_indicators = statusDetection.indicators;
      emailData.status_reasoning = statusDetection.reasoning;
      emailData.is_job_related = statusDetection.isJobRelated;
      emailData.urgency = statusDetection.urgency;
      
      // If the email is not job-related, stop processing and show a friendly message
      if (statusDetection.isJobRelated === false || statusDetection.status === 'not_job_related') {
        console.log('ℹ️ Email is not job-related. Skipping ingestion.');

        return CardService.newActionResponseBuilder()
          .setNavigation(
            CardService.newNavigation().updateCard(
              CardService.newCardBuilder()
                .setHeader(
                  CardService.newCardHeader()
                    .setTitle('📧 JobMail')
                    .setSubtitle('Not Job Related')
                )
                .addSection(
                  CardService.newCardSection()
                    .addWidget(
                      CardService.newTextParagraph()
                        .setText('<font color="#1f2937"><b>This email is not related to a job application.</b></font><br>' +
                                 '<font color="#4b5563">You can track only emails related to job applications, interviews, offers, or status updates.</font>')
                    )
                )
                .addSection(
                  CardService.newCardSection()
                    .addWidget(
                      CardService.newTextButton()
                        .setText('← Back')
                        .setOnClickAction(
                          CardService.newAction()
                            .setFunctionName('onGmailMessageOpen')
                        )
                    )
                )
                .build()
            )
          )
          .build();
      }
    
    // Send to backend API with parsed data
    const result = ingestEmail(emailData);
    
    console.log('Ingest result:', JSON.stringify(result));
    
    // Check for limit_exceeded error (multiple possible error formats)
    const limitError = result && (
      (result.detail && result.detail.error === 'limit_exceeded') ||
      (result.error === 'limit_exceeded') ||
      (result.error_type === 'limit_exceeded')
    );
    
    if (limitError) {
      console.log('Application limit exceeded - showing upgrade card');
      const errorDetails = result.detail || result;
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildUpgradeCard(errorDetails)
          )
        )
        .build();
    }
    
    // Check if result is valid and has success property
    if (result && result.success === true) {
      // Check if this is a duplicate (already tracked)
      if (result.duplicate === true) {
        console.log('Duplicate application detected - showing already tracked message');
        return CardService.newActionResponseBuilder()
          .setNavigation(
            CardService.newNavigation().updateCard(
              CardService.newCardBuilder()
                .setHeader(
                  CardService.newCardHeader()
                    .setTitle('📧 JobMail')
                    .setSubtitle('Already Tracked')
                )
                .addSection(
                  CardService.newCardSection()
                    .addWidget(
                      CardService.newDecoratedText()
                        .setTopLabel('✓')
                        .setText('This application has already been tracked')
                        .setWrapText(true)
                    )
                    .addWidget(
                      CardService.newTextParagraph()
                        .setText(
                          '<font color="#6b7280">' + 
                          (result.message || 'This email has already been processed and linked to an existing application.') + 
                          '</font>'
                        )
                    )
                    .addWidget(
                      CardService.newTextParagraph()
                        .setText(
                          '<font color="#10b981"><b>✓ No action needed</b></font><br>' +
                          '<font color="#6b7280">The application is already in your dashboard.</font>'
                        )
                    )
                )
                .addSection(
                  CardService.newCardSection()
                    .addWidget(
                      CardService.newTextButton()
                        .setText('← Back')
                        .setBackgroundColor('#6366f1')
                        .setOnClickAction(
                          CardService.newAction()
                            .setFunctionName('onGmailMessageOpen')
                        )
                    )
                  )
                .build()
            )
          )
          .build();
      }
      
      // Show success card for new applications
      console.log('Showing success card');
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildSuccessCard(result)
          )
        )
        .build();
    } else {
      // Show error card with diagnostic details from backend
      console.log('Showing error card, result:', result);
      console.log('Full result object:', JSON.stringify(result, null, 2));
      
      const errorMessage = result ? (result.message || result.error || 'Failed to track application') : 'No response from server';
      
      // Check if this is a "not a job email" error
      const isNotJobEmail = errorMessage && (
        errorMessage.includes('does not appear to be a job application') ||
        errorMessage.includes('not a job application') ||
        errorMessage.includes('only tracks emails related to job applications')
      );
      
      // Show different card for non-job emails
      if (isNotJobEmail) {
        return CardService.newActionResponseBuilder()
          .setNavigation(
            CardService.newNavigation().updateCard(
              CardService.newCardBuilder()
                .setHeader(
                  CardService.newCardHeader()
                    .setTitle('📧 JobMail')
                    .setSubtitle('Not a Job Application')
                )
                .addSection(
                  CardService.newCardSection()
                    .addWidget(
                      CardService.newDecoratedText()
                        .setTopLabel('⚠️')
                        .setText('This email is not a job application email')
                        .setWrapText(true)
                    )
                    .addWidget(
                      CardService.newTextParagraph()
                        .setText(
                          '<font color="#6b7280">' + errorMessage + '</font>'
                        )
                    )
                )
                .addSection(
                  CardService.newCardSection()
                    .addWidget(
                      CardService.newTextButton()
                        .setText('← Back')
                        .setBackgroundColor('#6366f1')
                        .setOnClickAction(
                          CardService.newAction()
                            .setFunctionName('onGmailMessageOpen')
                        )
                    )
                  )
                .build()
            )
          )
          .build();
      }
      
      // Regular error handling for other errors
      const detailsLines = [];
      
      // Extract all useful diagnostic information
      if (result && result.error_type) {
        detailsLines.push('Type: ' + result.error_type);
      }
      if (result && result.detail) {
        detailsLines.push('Detail: ' + JSON.stringify(result.detail));
      }
      if (result && result.status) {
        detailsLines.push('Status: ' + result.status);
      }
      if (result && result.raw_response) {
        const raw = String(result.raw_response);
        detailsLines.push('Response: ' + raw.substring(0, 200) + (raw.length > 200 ? '…' : ''));
      }
      
      const detailsText = detailsLines.length > 0 ? ('<br><br><font color="#6b7280">' + detailsLines.join('<br>') + '</font>') : '';

      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            CardService.newCardBuilder()
              .setHeader(
                CardService.newCardHeader()
                  .setTitle('📧 JobMail')
                  .setSubtitle('Error Details')
              )
              .addSection(
                CardService.newCardSection()
                  .addWidget(
                    CardService.newTextParagraph()
                      .setText('<b>Server error occurred.</b><br>' + errorMessage + detailsText)
                  )
              )
              .addSection(
                CardService.newCardSection()
                  .addWidget(
                    CardService.newTextButton()
                      .setText('🔁 Try Again')
                      .setBackgroundColor('#6366f1')
                      .setOnClickAction(
                        CardService.newAction()
                          .setFunctionName('onGmailMessageOpen')
                      )
                  )
                  .addWidget(
                    CardService.newTextButton()
                      .setText('← Back')
                      .setOnClickAction(
                        CardService.newAction()
                          .setFunctionName('onGmailMessageOpen')
                      )
                  )
              )
              .build()
          )
        )
        .build();
    }
    
  } catch (error) {
    console.error('Error in trackApplicationAction:', error);
    
    // Ensure we always return a valid response
    try {
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildErrorCard('Error: ' + error.message)
          )
        )
        .build();
    } catch (responseError) {
      console.error('Error building response:', responseError);
      // Fallback: return a simple error card
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            CardService.newCardBuilder()
              .setHeader(
                CardService.newCardHeader()
                  .setTitle('📧 JobMail')
                  .setSubtitle('Error')
              )
              .addSection(
                CardService.newCardSection()
                  .addWidget(
                    CardService.newTextParagraph()
                      .setText('<font color="#991b1b">An error occurred while tracking the application.</font>')
                  )
                  .addWidget(
                    CardService.newTextParagraph()
                      .setText('Error: ' + error.message)
                  )
              )
              .build()
          )
        )
        .build();
    }
  }
}

/**
 * Action handler for testing email parsing without actually storing data.
 * This is called when the user clicks the "Test Parsing" button.
 * 
 * @param {Object} e - Event object
 * @return {ActionResponse} Navigation action to show test results
 */
function testParsingAction(e) {
  console.log('testParsingAction triggered');
  
  try {
    const messageId = e.parameters.messageId;
    const accessToken = e.parameters.accessToken;
    
    if (!messageId || !accessToken) {
      throw new Error('Missing message ID or access token');
    }
    
    // Fetch email details (lightweight operation)
    const emailData = fetchEmailData(messageId, accessToken);
    
    if (!emailData) {
      throw new Error('Failed to fetch email data');
    }
    
    // Test parsing using advanced AI parsing locally
    console.log('Testing advanced AI parsing...');
    const parsedData = ultraAccurateEmailParsing(emailData.html_body, emailData.subject, emailData.sender);
    console.log('Advanced parsing result:', parsedData);
    
    // Also test status detection
    const statusDetection = detectJobApplicationStatus(
      emailData.html_body, 
      emailData.subject, 
      emailData.sender, 
      parsedData.company, 
      parsedData.position
    );
    console.log('Status detection result:', statusDetection);
    
    // Combine results
    const result = {
      success: true,
      parsed: parsedData,
      status: statusDetection,
      message: 'Advanced AI parsing completed successfully'
    };
    
    // Show test results card
    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().updateCard(
          buildTestResultsCard(result)
        )
      )
      .build();
    
  } catch (error) {
    console.error('Error in testParsingAction:', error);
    
    // Ensure we always return a valid response
    try {
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildErrorCard('Test failed: ' + error.message)
          )
        )
        .build();
    } catch (responseError) {
      console.error('Error building test response:', responseError);
      // Fallback: return a simple error card
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            CardService.newCardBuilder()
              .setHeader(
                CardService.newCardHeader()
                  .setTitle('📧 JobMail')
                  .setSubtitle('Test Error')
              )
              .addSection(
                CardService.newCardSection()
                  .addWidget(
                    CardService.newTextParagraph()
                      .setText('<font color="#991b1b">An error occurred while testing email parsing.</font>')
                  )
                  .addWidget(
                    CardService.newTextParagraph()
                      .setText('Error: ' + error.message)
                  )
              )
              .build()
          )
        )
        .build();
    }
  }
}

/**
 * Action handler for opening the authentication page.
 * Opens the auth bridge in a new browser window.
 * 
 * @param {Object} e - Event object
 * @return {ActionResponse} Opens auth page in new window
 */
function openAuthPageAction(e) {
  console.log('openAuthPageAction triggered');
  
  const authUrl = getAuthBridgeUrl();
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(authUrl)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.RELOAD)
    )
    .build();
}

/**
 * Action handler for opening the upgrade page.
 * This is called when the user clicks "Upgrade to Pro" button.
 * 
 * @param {Object} e - Event object
 * @return {ActionResponse} Opens upgrade page in new window
 */
function openUpgradePageAction(e) {
  console.log('openUpgradePageAction triggered');
  
  // Get the frontend URL from config
  const frontendUrl = 'https://jobmail-frontend.vercel.app';
  const upgradeUrl = frontendUrl + '/subscription?upgrade=true';
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(upgradeUrl)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
        .setOnClose(CardService.OnClose.NOTHING)
    )
    .build();
}

/**
 * Action handler for saving the session handle after authentication.
 * This is called when the user pastes their session handle from the auth page.
 * 
 * @param {Object} e - Event object containing form input
 * @return {ActionResponse} Navigation to authenticated state
 */
function saveSessionHandleAction(e) {
  console.log('saveSessionHandleAction triggered');
  
  try {
    // Get session handle from form input
    const sessionHandle = e.formInput.sessionHandle;
    
    if (!sessionHandle || sessionHandle.trim().length === 0) {
      throw new Error('Please enter a valid session handle');
    }
    
    // Save session handle
    saveSessionHandle(sessionHandle.trim());
    
    // Verify it works by trying to get a token
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('Failed to verify session handle. Please try again.');
    }
    
    // Success - reload the add-on
    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().updateCard(
          buildAuthSuccessCard()
        )
      )
      .setStateChanged(true)
      .build();
    
  } catch (error) {
    console.error('Error in saveSessionHandleAction:', error);
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText('Failed to save session: ' + error.message)
      )
      .build();
  }
}

/**
 * Action handler for signing out.
 * Clears the stored session handle.
 * 
 * @param {Object} e - Event object
 * @return {ActionResponse} Navigation to sign-in card
 */
function signOutAction(e) {
  console.log('signOutAction triggered');
  
  try {
    // Clear session handle
    clearSessionHandle();
    
    // Show sign-in card
    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().updateCard(
          buildSignInCard()
        )
      )
      .setStateChanged(true)
      .build();
    
  } catch (error) {
    console.error('Error in signOutAction:', error);
    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification()
          .setText('Sign out failed: ' + error.message)
      )
      .build();
  }
}

/**
 * Fetches email data from Gmail using the Gmail service.
 * 
 * @param {string} messageId - Gmail message ID
 * @param {string} accessToken - Gmail API access token (not used in Gmail service)
 * @return {Object} Email data formatted for backend API
 */
function fetchEmailData(messageId, accessToken) {
  try {
    console.log('Fetching email data for message:', messageId);
    
    // Use Gmail service to get the current message
    const message = GmailApp.getMessageById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Get thread information
    const thread = message.getThread();
    
    // Get user email for backend association
    const userEmail = getUserEmail();
    
    // Extract email data
    const emailData = {
      message_id: messageId,
      thread_id: thread.getId(),
      sender: message.getFrom(),
      subject: message.getSubject(),
      text_body: message.getPlainBody(),
      html_body: message.getBody(),
      received_at: message.getDate().toISOString(),
      user_email: userEmail || 'aglonoop@gmail.com' // Include user email for backend
    };
    
    // Clean up the email data to ensure it's properly formatted
    // Remove any null or undefined values that might cause issues (but preserve received_at!)
    Object.keys(emailData).forEach(key => {
      if (key !== 'received_at' && (emailData[key] === null || emailData[key] === undefined)) {
        emailData[key] = '';
      }
    });
    
    console.log('Email data extracted:', {
      sender: emailData.sender,
      subject: emailData.subject,
      has_text: !!emailData.text_body,
      has_html: !!emailData.html_body,
      received_at: emailData.received_at
    });
    
    return emailData;
    
  } catch (error) {
    console.error('Error fetching email data:', error);
    throw new Error('Failed to fetch email from Gmail API: ' + error.message);
  }
}

/**
 * Direct authentication action handler.
 * This bypasses the token requirement and directly connects the account.
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function openTokenPageAction(e) {
  console.log('openTokenPageAction triggered - checking authentication status');

  try {
    // Check if user is already authenticated
    const apiKey = getApiKey();
    
    if (apiKey) {
      // User is already authenticated - show success card with "Start Tracking" button
      console.log('User already authenticated - showing success card');
      return buildAuthSuccessCard();
    }
    
    console.log('User not authenticated - showing token input instructions');
    const loginUrl = getFrontendLoginUrl();
    
    return CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('📧 JobMail')
          .setSubtitle('Sign In Required')
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('<b>👋 Welcome to JobMail!</b>')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('To get started, you need to sign in with your Gmail account on the JobMail website.')
          )
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Setup Steps:')
          .addWidget(
            CardService.newTextParagraph()
              .setText('<b>1.</b> Click "Open JobMail" below<br>' +
                       '<b>2.</b> Sign in with <b>this Gmail account</b> (' + Session.getActiveUser().getEmail() + ')<br>' +
                       '<b>3.</b> Come back here and click "I\'ve Signed In"')
          )
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextButton()
              .setText('🌐 Open JobMail')
              .setBackgroundColor('#667eea')
              .setOpenLink(
                CardService.newOpenLink()
                  .setUrl(loginUrl)
                  .setOpenAs(CardService.OpenAs.FULL_SIZE)
                  .setOnClose(CardService.OnClose.NOTHING)
              )
          )
          .addWidget(
            CardService.newTextButton()
              .setText('✅ I\'ve Signed In')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('checkAuthenticationAction')
              )
          )
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('<font color="#6b7280"><i>💡 Tip: Use the same Gmail account for both the website and this add-on so your applications sync correctly.</i></font>')
          )
      )
      .build();

  } catch (error) {
    console.error('Error in openTokenPageAction:', error);
    return buildErrorCard('Failed to show sign-in instructions: ' + error.message);
  }
}


/**
 * Check if user has authenticated by testing the backend connection.
 * This is called after user claims they've signed in on the frontend.
 * 
 * @param {Object} e - Event object
 * @return {ActionResponse} Navigation action
 */
function checkAuthenticationAction(e) {
  console.log('checkAuthenticationAction triggered');
  
  try {
    // Check if user is already authenticated
    const apiKey = getApiKey();
    
    if (apiKey) {
      // User is already authenticated - show success card
      console.log('User already authenticated - showing success card');
      return buildAuthSuccessCard();
    }
    
    // Try to get the user's email from their Gmail session
    const userEmail = Session.getActiveUser().getEmail();
    
    return CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('📧 JobMail')
          .setSubtitle('Connect Your Account')
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('<b>🔐 One-Time Setup</b>')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('Get your connection token from the JobMail website. <b>You only need to do this once!</b>')
          )
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Quick Steps:')
          .addWidget(
            CardService.newTextParagraph()
              .setText('<b>1.</b> Click "Open Settings" below<br>' +
                       '<b>2.</b> Sign in with: <b>' + userEmail + '</b><br>' +
                       '<b>3.</b> Find "Gmail Add-on" section<br>' +
                       '<b>4.</b> Copy the token shown<br>' +
                       '<b>5.</b> Come back and paste it below')
          )
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextButton()
              .setText('🌐 Open Settings')
              .setBackgroundColor('#667eea')
              .setOpenLink(
                CardService.newOpenLink()
                  .setUrl('https://jobmail-frontend.vercel.app/settings?tab=gmail-addon')
                  .setOpenAs(CardService.OpenAs.FULL_SIZE)
                  .setOnClose(CardService.OnClose.NOTHING)
              )
          )
          .addWidget(
            CardService.newTextButton()
              .setText('✏️ Paste Token')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('showTokenInputCard')
              )
          )
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('<font color="#16a34a"><b>✨ After this, everything works automatically forever!</b></font><br><br>' +
                       '<font color="#6b7280"><i>💡 The token refreshes itself automatically, so you never have to do this again.</i></font>')
          )
      )
      .build();
    
  } catch (error) {
    console.error('Error in checkAuthenticationAction:', error);
    return buildErrorCard('Failed to show connection instructions: ' + error.message);
  }
}

/**
 * Show card with instructions and text input for pasting the refresh token.
 * 
 * @param {Object} e - Event object
 * @return {Card} Token input card
 */
function showTokenInputCard(e) {
  console.log('showTokenInputCard triggered');
  
  try {
    // Check if user is already authenticated
    const apiKey = getApiKey();
    
    if (apiKey) {
      // User is already authenticated - show success card
      console.log('User already authenticated - showing success card');
      return buildAuthSuccessCard();
    }
    
    return CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('📧 JobMail')
          .setSubtitle('Paste Your Token')
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('<b>Paste the token you copied from the Settings page:</b>')
          )
          .addWidget(
            CardService.newTextInput()
              .setFieldName('refresh_token')
              .setTitle('Refresh Token')
              .setHint('Paste your token here')
              .setMultiline(true)
          )
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextButton()
              .setText('✅ Connect')
              .setBackgroundColor('#6366f1')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('saveTokenAndConnect')
              )
          )
          .addWidget(
            CardService.newTextButton()
              .setText('← Back')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('checkAuthenticationAction')
              )
          )
      )
      .build();
    
  } catch (error) {
    console.error('Error in showTokenInputCard:', error);
    return buildErrorCard('Failed to show token input: ' + error.message);
  }
}

/**
 * Save the pasted access token and attempt to connect.
 * 
 * @param {Object} e - Event object with form inputs
 * @return {ActionResponse} Navigation action
 */
function saveTokenAndConnect(e) {
  console.log('saveTokenAndConnect triggered');
  
  try {
    const formInputs = e.formInput || {};
    const pastedApiKey = formInputs.refresh_token; // Field name is still 'refresh_token' for backward compat
    
    if (!pastedApiKey || pastedApiKey.trim() === '') {
      return buildErrorCard('Please paste a valid API key');
    }
    
    const apiKey = pastedApiKey.trim();
    
    // API keys start with "jobmail_"
    if (!apiKey.startsWith('jobmail_')) {
      return buildErrorCard('Invalid API key format. API keys should start with "jobmail_". Please copy the entire API key from Settings.');
    }
    
    console.log('Saving API key...');
    console.log('API key length:', apiKey.length);
    
    // Save the API key (simple!)
    const userEmail = Session.getActiveUser().getEmail();
    saveApiKey(apiKey, userEmail);
    
    // Success! API key is saved
    
    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().updateCard(
          CardService.newCardBuilder()
            .setHeader(
              CardService.newCardHeader()
                .setTitle('📧 JobMail')
                .setSubtitle('Connected!')
            )
            .addSection(
              CardService.newCardSection()
                .addWidget(
                  CardService.newTextParagraph()
                    .setText('<b>✅ Successfully Connected!</b>')
                )
                .addWidget(
                  CardService.newTextParagraph()
                    .setText('<font color="#16a34a">Your Gmail add-on is now connected to your JobMail account.</font>')
                )
            )
            .addSection(
              CardService.newCardSection()
                .setHeader('What\'s Next?')
                .addWidget(
                  CardService.newTextParagraph()
                    .setText('• Open any job application email<br>' +
                             '• Click "Track This Application"<br>' +
                             '• Your applications will automatically sync to JobMail<br><br>' +
                             '<b>Signed in as:</b> ' + userEmail)
                )
            )
            .addSection(
              CardService.newCardSection()
                .addWidget(
                  CardService.newTextButton()
                    .setText('🎉 Start Tracking')
                    .setBackgroundColor('#667eea')
                    .setOnClickAction(
                      CardService.newAction()
                        .setFunctionName('onGmailMessageOpen')
                    )
                )
            )
            .build()
        )
      )
      .build();
    
  } catch (error) {
    console.error('Error in saveTokenAndConnect:', error);
    return buildErrorCard('Failed to save token: ' + error.message);
  }
}

/**
 * Test function to manually set up authentication for testing
 * Call this function manually in the Apps Script editor if needed
 */
function testAuthenticationBypass() {
  console.log('Setting up test authentication...');
  
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(SESSION_HANDLE_KEY, 'test_token_12345');
  userProperties.setProperty(USER_EMAIL_KEY, 'aglonoop@gmail.com');
  
  console.log('Test authentication set up. You can now test the add-on.');
  return 'Test authentication set up successfully! Note: The add-on now connects automatically without requiring a token.';
}

/**
 * Test function to debug email fetching
 * Call this function manually in the Apps Script editor to test email access
 */
function testEmailFetching() {
  try {
    console.log('Testing email fetching...');
    
    // Get the most recent message
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length > 0) {
      const messages = threads[0].getMessages();
      if (messages.length > 0) {
        const message = messages[0];
        const messageId = message.getId();
        
        console.log('Found message:', {
          id: messageId,
          sender: message.getFrom(),
          subject: message.getSubject(),
          hasBody: !!message.getBody()
        });
        
        // Test the fetchEmailData function
        const emailData = fetchEmailData(messageId, 'test_token');
        console.log('Email data fetched:', emailData);
        
        return 'Email fetching test successful!';
      }
    }
    
    return 'No messages found in inbox';
  } catch (error) {
    console.error('Email fetching test failed:', error);
    return 'Email fetching test failed: ' + error.message;
  }
}

/**
 * Force authentication setup
 * Call this function to ensure authentication is properly set up
 */
function forceAuthenticationSetup() {
  console.log('Setting up authentication...');
  
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(SESSION_HANDLE_KEY, 'direct_connection_' + Date.now());
  userProperties.setProperty(USER_EMAIL_KEY, 'aglonoop@gmail.com');
  
  console.log('Authentication setup complete');
  return 'Authentication setup complete! You can now use the add-on.';
}

/**
 * Test all API connections and configurations
 * Call this function to verify all APIs are working properly
 */
function testAllAPIs() {
  console.log('Testing all API connections...');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };
  
  // Test OpenAI API
  console.log('Testing OpenAI API...');
  try {
    const openaiStatus = getOpenAIAPIKeyStatus();
    results.tests.openai = {
      success: openaiStatus.valid,
      message: openaiStatus.message,
      hasKey: openaiStatus.hasKey,
      status: openaiStatus.status
    };
  } catch (error) {
    results.tests.openai = {
      success: false,
      message: 'OpenAI API test failed: ' + error.message,
      error: error.message
    };
  }
  
  // Test Backend API
  console.log('Testing Backend API...');
  try {
    const backendStatus = testBackendConnection();
    results.tests.backend = {
      success: backendStatus.success,
      message: backendStatus.message,
      response: backendStatus.response
    };
  } catch (error) {
    results.tests.backend = {
      success: false,
      message: 'Backend API test failed: ' + error.message,
      error: error.message
    };
  }
  
  // Test Authentication
  console.log('Testing Authentication...');
  try {
    const sessionHandle = getSessionHandle();
    const userEmail = getUserEmail();
    results.tests.authentication = {
      success: !!(sessionHandle && userEmail),
      message: sessionHandle && userEmail ? 'Authentication working' : 'Authentication not configured',
      sessionHandle: sessionHandle ? 'Set' : 'Not set',
      userEmail: userEmail || 'Not set'
    };
  } catch (error) {
    results.tests.authentication = {
      success: false,
      message: 'Authentication test failed: ' + error.message,
      error: error.message
    };
  }
  
  // Test Email Parsing
  console.log('Testing Email Parsing...');
  try {
    const parsingResult = testCompleteParsing();
    results.tests.parsing = {
      success: true,
      message: 'Email parsing test completed',
      apiKeyStatus: parsingResult.apiKeyStatus,
      parsingResult: parsingResult.parsingResult
    };
  } catch (error) {
    results.tests.parsing = {
      success: false,
      message: 'Email parsing test failed: ' + error.message,
      error: error.message
    };
  }
  
  console.log('All API tests completed:', results);
  return results;
}

/**
 * Debug function to test the track application action
 * Call this function to debug the track application functionality
 */
function debugTrackApplication() {
  console.log('Debugging track application...');
  
  try {
    // Get a test message ID
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) {
      return 'No messages found in inbox';
    }
    
    const messages = threads[0].getMessages();
    if (messages.length === 0) {
      return 'No messages found in thread';
    }
    
    const messageId = messages[0].getId();
    console.log('Using message ID:', messageId);
    
    // Test fetchEmailData
    const emailData = fetchEmailData(messageId, 'test_token');
    console.log('Email data:', emailData);
    
    if (!emailData) {
      return 'Failed to fetch email data';
    }
    
    // Test advanced parsing
    console.log('Testing advanced AI parsing...');
    const parsedData = ultraAccurateEmailParsing(emailData.html_body, emailData.subject, emailData.sender);
    console.log('Advanced parsing result:', parsedData);
    
    // Test status detection
    const statusDetection = detectJobApplicationStatus(
      emailData.html_body, 
      emailData.subject, 
      emailData.sender, 
      parsedData.company, 
      parsedData.position
    );
    console.log('Status detection result:', statusDetection);
    
      // Add parsed data to emailData (same as in trackApplicationAction)
      emailData.parsed_company = parsedData.company;
      emailData.parsed_position = parsedData.position;
      emailData.parsed_email_type = parsedData.emailType;
      emailData.parsed_confidence = parsedData.confidence;
      emailData.parsed_job_url = normalizeJobUrl(
        parsedData.jobUrl || parsedData.job_url || parsedData.jobURL
      );
      
      // Add status detection data
      emailData.detected_status = statusDetection.status;
      emailData.status_confidence = statusDetection.confidence;
      emailData.status_indicators = statusDetection.indicators;
      emailData.status_reasoning = statusDetection.reasoning;
      emailData.is_job_related = statusDetection.isJobRelated;
      emailData.urgency = statusDetection.urgency;
      
      if (statusDetection.isJobRelated === false || statusDetection.status === 'not_job_related') {
        return {
          messageId: messageId,
          emailData: emailData,
          parsedData: parsedData,
          statusDetection: statusDetection,
          ingestResult: null,
          success: true,
          notJobRelated: true
        };
      }
    
    console.log('Final email data being sent to backend:', JSON.stringify(emailData));
    
    // Test ingestEmail
    const result = ingestEmail(emailData);
    console.log('Ingest result:', result);
    
    return {
      messageId: messageId,
      emailData: emailData,
      parsedData: parsedData,
      statusDetection: statusDetection,
      ingestResult: result,
      success: true
    };
    
  } catch (error) {
    console.error('Debug track application failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Test function to verify AI status detection is working
 * This tests the complete flow from email to backend
 */
function testAIStatusDetection() {
  console.log('🧪 Testing AI status detection...');
  
  try {
    // Get a test message ID
    const threads = GmailApp.getInboxThreads(0, 1);
    if (threads.length === 0) {
      return 'No messages found in inbox';
    }
    
    const messages = threads[0].getMessages();
    if (messages.length === 0) {
      return 'No messages found in thread';
    }
    
    const messageId = messages[0].getId();
    console.log('Using message ID:', messageId);
    
    // Fetch email data
    const emailData = fetchEmailData(messageId, 'test_token');
    console.log('Email data:', emailData);
    
    if (!emailData) {
      return 'Failed to fetch email data';
    }
    
    // Test advanced parsing
    console.log('Testing advanced AI parsing...');
    const parsedData = ultraAccurateEmailParsing(emailData.html_body, emailData.subject, emailData.sender);
    console.log('Advanced parsing result:', parsedData);
    
    // Test status detection
    const statusDetection = detectJobApplicationStatus(
      emailData.html_body, 
      emailData.subject, 
      emailData.sender, 
      parsedData.company, 
      parsedData.position
    );
    console.log('Status detection result:', statusDetection);
    
    // Show what would be sent to backend
    const finalEmailData = {
      ...emailData,
      parsed_company: parsedData.company,
      parsed_position: parsedData.position,
      parsed_email_type: parsedData.emailType,
      parsed_confidence: parsedData.confidence,
      detected_status: statusDetection.status,
      status_confidence: statusDetection.confidence,
      status_indicators: statusDetection.indicators,
      status_reasoning: statusDetection.reasoning,
      is_job_related: statusDetection.isJobRelated,
      urgency: statusDetection.urgency
    };
    
    console.log('Final email data that would be sent to backend:', JSON.stringify(finalEmailData, null, 2));
    
    return {
      messageId: messageId,
      emailData: emailData,
      parsedData: parsedData,
      statusDetection: statusDetection,
      finalEmailData: finalEmailData,
      success: true
    };
    
  } catch (error) {
    console.error('Test AI status detection failed:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}


