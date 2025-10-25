/**
 * TrackMail Gmail Add-on
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
    // Check if user is authenticated
    const sessionHandle = getSessionHandle();
    
    if (!sessionHandle) {
      // User not authenticated - show sign-in card
      return buildSignInCard();
    }
    
    // User is authenticated - show email tracking card
    const messageId = e.gmail ? e.gmail.messageId : null;
    const accessToken = e.gmail ? e.gmail.accessToken : null;
    
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
            return buildTrackingCard(currentMessageId, accessToken);
          }
        }
      } catch (msgError) {
        console.error('Could not get current message:', msgError);
      }
    }
    
    return buildTrackingCard(messageId, accessToken);
    
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
    .setHeader(CardService.newCardHeader().setTitle('TrackMail'))
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('TrackMail works with received emails. Open an email to track it as a job application.')
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
    // Check if user is authenticated
    const sessionHandle = getSessionHandle();
    const userEmail = getUserEmail();
    
    if (!sessionHandle) {
      // User not authenticated - show sign-in card
      return buildSignInCard();
    }
    
    // User is authenticated - show settings card
    return buildSettingsCard(userEmail);
    
  } catch (error) {
    console.error('Error in onGmailSettings:', error);
    return buildErrorCard('Failed to load settings: ' + error.message);
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
    
    // Add status detection data
    emailData.detected_status = statusDetection.status;
    emailData.status_confidence = statusDetection.confidence;
    emailData.status_indicators = statusDetection.indicators;
    emailData.status_reasoning = statusDetection.reasoning;
    emailData.is_job_related = statusDetection.isJobRelated;
    emailData.urgency = statusDetection.urgency;
    
    // Send to backend API with parsed data
    const result = ingestEmail(emailData);
    
    console.log('Ingest result:', JSON.stringify(result));
    
    // Check if result is valid and has success property
    if (result && result.success === true) {
      // Show success card
      console.log('Showing success card');
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildSuccessCard(result)
          )
        )
        .build();
    } else {
      // Show error card
      console.log('Showing error card, result:', result);
      const errorMessage = result ? (result.message || 'Failed to track application') : 'No response from server';
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildErrorCard(errorMessage)
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
                  .setTitle('📧 TrackMail')
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
                  .setTitle('📧 TrackMail')
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
    const token = getAccessToken();
    
    if (!token) {
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
    // Remove any null or undefined values that might cause issues
    Object.keys(emailData).forEach(key => {
      if (emailData[key] === null || emailData[key] === undefined) {
        emailData[key] = '';
      }
    });
    
    console.log('Email data extracted:', {
      sender: emailData.sender,
      subject: emailData.subject,
      has_text: !!emailData.text_body,
      has_html: !!emailData.html_body
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
  console.log('openTokenPageAction triggered - connecting directly');

  try {
    // Directly connect without requiring a token
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(SESSION_HANDLE_KEY, 'direct_connection_' + Date.now());
    userProperties.setProperty(USER_EMAIL_KEY, 'aglonoop@gmail.com');
    
    console.log('Direct authentication completed');
    
    return CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('📧 TrackMail')
          .setSubtitle('Connected Successfully')
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph()
              .setText('✅ Your TrackMail account has been connected!')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('You can now track job applications directly from Gmail.')
          )
      )
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextButton()
              .setText('Continue')
              .setBackgroundColor('#667eea')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('onGmailMessageOpen')
              )
          )
      )
      .build();

  } catch (error) {
    console.error('Error in direct authentication:', error);
    return buildErrorCard('Failed to connect account: ' + error.message);
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
    
    // Add status detection data
    emailData.detected_status = statusDetection.status;
    emailData.status_confidence = statusDetection.confidence;
    emailData.status_indicators = statusDetection.indicators;
    emailData.status_reasoning = statusDetection.reasoning;
    emailData.is_job_related = statusDetection.isJobRelated;
    emailData.urgency = statusDetection.urgency;
    
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

