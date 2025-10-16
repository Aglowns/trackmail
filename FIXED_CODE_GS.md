# Fixed Code.gs File

**Replace your `Code.gs` file with this corrected version:**

```javascript
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
    const messageId = e.gmail.messageId;
    const accessToken = e.gmail.accessToken;
    
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
    
    // Fetch email details using Gmail service
    const emailData = fetchEmailData(messageId, accessToken);
    
    if (!emailData) {
      throw new Error('Failed to fetch email data');
    }
    
    // Send to backend API
    const result = ingestEmail(emailData);
    
    if (result.success) {
      // Show success card
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildSuccessCard(result)
          )
        )
        .build();
    } else {
      // Show error card
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(
            buildErrorCard(result.message || 'Failed to track application')
          )
        )
        .build();
    }
    
  } catch (error) {
    console.error('Error in trackApplicationAction:', error);
    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().updateCard(
          buildErrorCard('Error: ' + error.message)
        )
      )
      .build();
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
    
    // Fetch email details
    const emailData = fetchEmailData(messageId, accessToken);
    
    if (!emailData) {
      throw new Error('Failed to fetch email data');
    }
    
    // Test parsing via backend API
    const result = testEmailParsing(emailData);
    
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
    return CardService.newActionResponseBuilder()
      .setNavigation(
        CardService.newNavigation().updateCard(
          buildErrorCard('Test failed: ' + error.message)
        )
      )
      .build();
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
    
    // Extract email data
    const emailData = {
      message_id: messageId,
      thread_id: thread.getId(),
      sender: message.getFrom(),
      subject: message.getSubject(),
      text_body: message.getPlainBody(),
      html_body: message.getBody(),
      received_at: message.getDate().toISOString()
    };
    
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
```

## 🔧 **What I Fixed:**

1. **✅ Changed from Gmail API to Gmail Service**: Instead of making direct API calls, now using `GmailApp.getMessageById()` which is the proper way in Gmail Add-ons
2. **✅ Simplified email data extraction**: Using built-in Gmail service methods like `getFrom()`, `getSubject()`, etc.
3. **✅ Better error handling**: More descriptive error messages
4. **✅ Added logging**: Better debugging information

## 🚀 **Next Steps:**

1. **Replace your `Code.gs` file** with the corrected version above
2. **Save the file**
3. **Test the add-on** in Gmail

This should fix the "Failed to fetch email from Gmail API" error! 🎉
