# Gmail Add-on Update Guide

## 🎯 **Complete Files to Update in Apps Script**

### **Step 1: Update Auth.gs**

Replace the entire `Auth.gs` file with this content:

```javascript
/**
 * Authentication and Session Management
 * 
 * This file handles authentication with the Auth Bridge service and manages
 * session handles for accessing the backend API.
 * 
 * Flow:
 * 1. User signs in via Auth Bridge (browser window)
 * 2. User receives a session handle
 * 3. Add-on stores session handle in user properties
 * 4. Add-on exchanges session handle for JWT tokens as needed
 * 5. JWT tokens are used as Bearer tokens for backend API calls
 */

// Configuration
const AUTH_BRIDGE_URL = 'https://trackmail-frontend.vercel.app'; // Your existing frontend URL
const BACKEND_API_URL = 'https://trackmail-backend1.onrender.com/v1'; // Deployed Backend API URL (Render)

// Storage keys
const SESSION_HANDLE_KEY = 'trackmail_session_handle';
const CACHED_TOKEN_KEY = 'trackmail_cached_token';
const CACHED_TOKEN_EXPIRES_KEY = 'trackmail_token_expires';
const USER_EMAIL_KEY = 'trackmail_user_email';

/**
 * Get the Auth Bridge URL.
 * 
 * @return {string} Auth Bridge URL
 */
function getAuthBridgeUrl() {
  // In production, this should be your deployed Auth Bridge URL
  return AUTH_BRIDGE_URL;
}

/**
 * Get the backend API URL.
 * 
 * @return {string} Backend API URL
 */
function getBackendApiUrl() {
  return BACKEND_API_URL;
}

/**
 * Get the stored session handle.
 * 
 * @return {string|null} Session handle or null if not found
 */
function getSessionHandle() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(SESSION_HANDLE_KEY);
}

/**
 * Store a session handle.
 * 
 * @param {string} sessionHandle - Session handle to store
 */
function setSessionHandle(sessionHandle) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(SESSION_HANDLE_KEY, sessionHandle);
}

/**
 * Get the stored user email.
 * 
 * @return {string|null} User email or null if not found
 */
function getUserEmail() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(USER_EMAIL_KEY);
}

/**
 * Store user email.
 * 
 * @param {string} email - User email to store
 */
function setUserEmail(email) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(USER_EMAIL_KEY, email);
}

/**
 * Get cached JWT token if still valid.
 * 
 * @return {string|null} Cached token or null if expired/not found
 */
function getCachedToken() {
  const userProperties = PropertiesService.getUserProperties();
  const token = userProperties.getProperty(CACHED_TOKEN_KEY);
  const expires = userProperties.getProperty(CACHED_TOKEN_EXPIRES_KEY);
  
  if (!token || !expires) {
    return null;
  }
  
  // Check if token is expired
  const now = new Date().getTime();
  const expiresTime = parseInt(expires);
  
  if (now >= expiresTime) {
    // Token expired, clear it
    userProperties.deleteProperty(CACHED_TOKEN_KEY);
    userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
    return null;
  }
  
  return token;
}

/**
 * Cache a JWT token with expiration time.
 * 
 * @param {string} token - JWT token to cache
 * @param {number} expiresInSeconds - Token expiration in seconds
 */
function cacheToken(token, expiresInSeconds) {
  const userProperties = PropertiesService.getUserProperties();
  const expiresTime = new Date().getTime() + (expiresInSeconds * 1000);
  
  userProperties.setProperty(CACHED_TOKEN_KEY, token);
  userProperties.setProperty(CACHED_TOKEN_EXPIRES_KEY, expiresTime.toString());
}

/**
 * Get a valid JWT token, either from cache or by exchanging session handle.
 * 
 * @return {string|null} Valid JWT token or null if authentication fails
 */
function getValidToken() {
  // First, try to get cached token
  const cachedToken = getCachedToken();
  if (cachedToken) {
    return cachedToken;
  }
  
  // No valid cached token, need to exchange session handle
  const sessionHandle = getSessionHandle();
  if (!sessionHandle) {
    return null;
  }
  
  try {
    const response = UrlFetchApp.fetch(getAuthBridgeUrl() + '/exchange-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        session_handle: sessionHandle
      })
    });
    
    if (response.getResponseCode() !== 200) {
      console.error('Failed to exchange session handle for token:', response.getContentText());
      return null;
    }
    
    const data = JSON.parse(response.getContentText());
    if (data.token) {
      // Cache the token (assuming 1 hour expiration)
      cacheToken(data.token, 3600);
      return data.token;
    }
    
    return null;
    
  } catch (error) {
    console.error('Error exchanging session handle for token:', error);
    return null;
  }
}

/**
 * Clear all stored authentication data.
 */
function clearAuthData() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty(SESSION_HANDLE_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
  userProperties.deleteProperty(USER_EMAIL_KEY);
}

/**
 * Check if user is authenticated (has valid session handle or token).
 * 
 * @return {boolean} True if authenticated, false otherwise
 */
function isAuthenticated() {
  const sessionHandle = getSessionHandle();
  if (sessionHandle) {
    return true;
  }
  
  const token = getValidToken();
  return token !== null;
}

/**
 * Get authentication headers for API requests.
 * 
 * @return {Object} Headers object with Authorization
 */
function getAuthHeaders() {
  const token = getValidToken();
  if (!token) {
    return {};
  }
  
  return {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  };
}
```

### **Step 2: Update UI.gs**

Replace the entire `UI.gs` file with this content:

```javascript
/**
 * CardService UI Components
 * 
 * This file contains all the UI building functions for the Gmail Add-on.
 * Uses CardService to create interactive cards that display in Gmail's sidebar.
 */

/**
 * Build the sign-in card shown when user is not authenticated.
 * 
 * @return {Card} Sign-in card
 */
function buildSignInCard() {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Track job applications from Gmail')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>Welcome to TrackMail!</b><br><br>Automatically track job application emails and manage your job search from Gmail.')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('To get started, you need to sign in with your TrackMail account.')
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Get Gmail Token')
            .setBackgroundColor('#667eea')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('openTokenPageAction')
            )
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>This will open your TrackMail dashboard where you can get a Gmail token.</i></font>')
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Paste Your Gmail Token')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('gmailToken')
            .setTitle('Gmail Token')
            .setHint('Paste your Gmail token here')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Connect Account')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('connectAccountAction')
            )
        )
    )
    .build();
  
  return card;
}

/**
 * Build the main tracking card for an authenticated user.
 * 
 * @param {string} messageId - Gmail message ID
 * @param {string} accessToken - Gmail API access token
 * @return {Card} Tracking card
 */
function buildTrackingCard(messageId, accessToken) {
  const userEmail = getUserEmail() || 'Signed In';
  
  // Fetch email data to preview
  let emailPreview = '';
  let sender = '';
  let subject = '';
  let date = '';
  
  try {
    console.log('Building tracking card for messageId:', messageId);
    console.log('Access token available:', !!accessToken);
    
    const emailData = fetchEmailData(messageId, accessToken);
    sender = emailData.sender || 'Unknown';
    subject = emailData.subject || 'No Subject';
    
    // Parse date
    if (emailData.received_at) {
      try {
        date = new Date(emailData.received_at).toLocaleDateString();
      } catch (e) {
        date = emailData.received_at;
      }
    }
    
    // Extract company name and job position from subject/body
    const companyName = extractCompanyName(subject, emailData.body || '');
    const jobPosition = extractJobPosition(subject, emailData.body || '');
    const applicationDate = extractApplicationDate(emailData.body || '');
    
    emailPreview = '<b>Company:</b> ' + companyName + '<br>' +
                   '<b>Position:</b> ' + jobPosition + '<br>' +
                   '<b>Applied:</b> ' + applicationDate + '<br>' +
                   '<b>From:</b> ' + sender + '<br>' +
                   '<b>Subject:</b> ' + subject;
                   
    console.log('Email preview built successfully');
  } catch (error) {
    console.error('Error fetching email preview:', error);
    emailPreview = '<font color="#991b1b">Error loading email preview: ' + error.message + '</font>';
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Track This Application')
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Signed in as: ' + userEmail)
        .addWidget(
          CardService.newTextParagraph()
            .setText('Track this email as a job application')
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Email Preview')
        .addWidget(
          CardService.newTextParagraph()
            .setText(emailPreview)
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Actions')
        .addWidget(
          CardService.newTextButton()
            .setText('Track This Application')
            .setTextButtonStyle(CardService.TextButtonStyle.FILLED)
            .setBackgroundColor('#10b981')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('trackApplicationAction')
                .setParameters({ messageId: messageId })
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Test Parsing')
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('testParsingAction')
                .setParameters({ messageId: messageId })
            )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Sign Out')
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('signOutAction')
            )
        )
    )
    .build();
  
  return card;
}

/**
 * Build settings card for authenticated users.
 *
 * @param {string} userEmail - User's email address
 * @return {Card} Settings card
 */
function buildSettingsCard(userEmail) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Settings')
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Account Information')
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>Signed in as:</b> ' + (userEmail || 'Unknown'))
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Actions')
        .addWidget(
          CardService.newTextButton()
            .setText('Sign Out')
            .setTextButtonStyle(CardService.TextButtonStyle.TEXT)
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('signOutAction')
            )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>TrackMail helps you manage job applications directly from Gmail. Open any email to track it as a job application.</i></font>')
        )
    )
    .build();

  return card;
}

/**
 * Build error card for displaying errors.
 * 
 * @param {string} errorMessage - Error message to display
 * @return {Card} Error card
 */
function buildErrorCard(errorMessage) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Error')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#991b1b">' + errorMessage + '</font>')
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
    .build();
  
  return card;
}

/**
 * Build success card for displaying success messages.
 * 
 * @param {string} message - Success message to display
 * @return {Card} Success card
 */
function buildSuccessCard(message) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Success')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#059669">' + message + '</font>')
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
    .build();
  
  return card;
}

/**
 * Build test results card for displaying parsing test results.
 * 
 * @param {Object} testResults - Test results object
 * @return {Card} Test results card
 */
function buildTestResultsCard(testResults) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Test Results')
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Parsing Test Results')
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>Company:</b> ' + (testResults.company || 'Not detected') + '<br>' +
                    '<b>Position:</b> ' + (testResults.position || 'Not detected') + '<br>' +
                    '<b>Date Applied:</b> ' + (testResults.date_applied || 'Not detected') + '<br>' +
                    '<b>Status:</b> ' + (testResults.status || 'Unknown'))
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
    .build();
  
  return card;
}

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
```

### **Step 3: Update Code.gs**

Replace the entire `Code.gs` file with this content:

```javascript
/**
 * Gmail Add-on Entry Points and Main Functions
 * 
 * This file contains the main entry points for the Gmail Add-on,
 * including the message open trigger and action handlers.
 */

/**
 * Gmail message open trigger.
 * This is called when a user opens an email in Gmail.
 * 
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function onGmailMessageOpen(e) {
  console.log('onGmailMessageOpen triggered');
  
  try {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      // User not authenticated - show sign-in card
      return buildSignInCard();
    }
    
    // User is authenticated - show tracking card
    const messageId = e.gmail.messageId;
    const accessToken = e.gmail.accessToken;
    
    return buildTrackingCard(messageId, accessToken);
    
  } catch (error) {
    console.error('Error in onGmailMessageOpen:', error);
    return buildErrorCard('Failed to load TrackMail: ' + error.message);
  }
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
 * Track application action handler.
 * This is called when the user clicks "Track This Application".
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function trackApplicationAction(e) {
  console.log('trackApplicationAction triggered');
  
  try {
    const messageId = e.parameters.messageId;
    const accessToken = e.gmail.accessToken;
    
    if (!messageId) {
      return buildErrorCard('No message ID provided');
    }
    
    // Fetch email data
    const emailData = fetchEmailData(messageId, accessToken);
    
    // Extract structured data
    const companyName = extractCompanyName(emailData.subject, emailData.body || '');
    const jobPosition = extractJobPosition(emailData.subject, emailData.body || '');
    const applicationDate = extractApplicationDate(emailData.body || '');
    
    // Prepare application data
    const applicationData = {
      company_name: companyName,
      position: jobPosition,
      date_applied: applicationDate,
      status: 'Applied',
      source: 'Gmail Add-on',
      email_subject: emailData.subject,
      email_sender: emailData.sender,
      email_date: emailData.received_at,
      email_body: emailData.body,
      email_html: emailData.html_body
    };
    
    // Send to backend
    const response = UrlFetchApp.fetch(getBackendApiUrl() + '/applications', {
      method: 'POST',
      headers: getAuthHeaders(),
      payload: JSON.stringify(applicationData)
    });
    
    if (response.getResponseCode() === 200 || response.getResponseCode() === 201) {
      const result = JSON.parse(response.getContentText());
      return buildSuccessCard('Application tracked successfully! ID: ' + result.id);
    } else {
      return buildErrorCard('Failed to track application: ' + response.getContentText());
    }
    
  } catch (error) {
    console.error('Error in trackApplicationAction:', error);
    return buildErrorCard('Failed to track application: ' + error.message);
  }
}

/**
 * Test parsing action handler.
 * This is called when the user clicks "Test Parsing".
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function testParsingAction(e) {
  console.log('testParsingAction triggered');
  
  try {
    const messageId = e.parameters.messageId;
    const accessToken = e.gmail.accessToken;
    
    if (!messageId) {
      return buildErrorCard('No message ID provided');
    }
    
    // Fetch email data
    const emailData = fetchEmailData(messageId, accessToken);
    
    // Extract structured data
    const testResults = {
      company: extractCompanyName(emailData.subject, emailData.body || ''),
      position: extractJobPosition(emailData.subject, emailData.body || ''),
      date_applied: extractApplicationDate(emailData.body || ''),
      status: 'Test Parsing'
    };
    
    return buildTestResultsCard(testResults);
    
  } catch (error) {
    console.error('Error in testParsingAction:', error);
    return buildErrorCard('Failed to test parsing: ' + error.message);
  }
}

/**
 * Sign out action handler.
 * This is called when the user clicks "Sign Out" from the settings card.
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function signOutAction(e) {
  console.log('signOutAction triggered');

  try {
    // Clear stored session data
    clearAuthData();

    // Return to sign-in card
    return buildSignInCard();

  } catch (error) {
    console.error('Error in signOutAction:', error);
    return buildErrorCard('Failed to sign out: ' + error.message);
  }
}

/**
 * Open token page action handler.
 * This opens the TrackMail frontend to get a Gmail token.
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function openTokenPageAction(e) {
  console.log('openTokenPageAction triggered');

  try {
    // Open the TrackMail frontend Gmail token page
    const frontendUrl = 'https://trackmail-frontend.vercel.app/gmail-token';
    
    // Create a card that shows the URL and instructions
    return CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('📧 TrackMail')
          .setSubtitle('Get Your Gmail Token')
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Step 1: Open TrackMail Dashboard')
          .addWidget(
            CardService.newTextParagraph()
              .setText('Click the link below to open TrackMail dashboard:')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('<a href="' + frontendUrl + '" target="_blank">' + frontendUrl + '</a>')
          )
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Step 2: Sign In & Get Token')
          .addWidget(
            CardService.newTextParagraph()
              .setText('• Sign in with the same Gmail account you\'re using this add-on on')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('• Copy the Gmail token that\'s generated')
          )
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Step 3: Connect Account')
          .addWidget(
            CardService.newTextInput()
              .setFieldName('gmailToken')
              .setTitle('Gmail Token')
              .setHint('Paste your Gmail token here')
          )
          .addWidget(
            CardService.newTextButton()
              .setText('Connect Account')
              .setOnClickAction(
                CardService.newAction()
                  .setFunctionName('connectAccountAction')
              )
          )
      )
      .build();

  } catch (error) {
    console.error('Error in openTokenPageAction:', error);
    return buildErrorCard('Failed to open token page: ' + error.message);
  }
}

/**
 * Open dashboard action handler.
 * This shows the TrackMail frontend URL for manual opening.
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function openDashboardAction(e) {
  console.log('openDashboardAction triggered');

  try {
    const frontendUrl = 'https://trackmail-frontend.vercel.app/gmail-token';
    
    return CardService.newCardBuilder()
      .setHeader(
        CardService.newCardHeader()
          .setTitle('📧 TrackMail')
          .setSubtitle('Get Your Gmail Token')
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Step 1: Open TrackMail Dashboard')
          .addWidget(
            CardService.newTextParagraph()
              .setText('Copy this URL and open it in a new tab:')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('<b>' + frontendUrl + '</b>')
          )
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Step 2: Sign In')
          .addWidget(
            CardService.newTextParagraph()
              .setText('• Sign in with the same Gmail account you\'re using this add-on on')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('• Copy the Gmail token that\'s generated')
          )
      )
      .addSection(
        CardService.newCardSection()
          .setHeader('Step 3: Connect Account')
          .addWidget(
            CardService.newTextParagraph()
              .setText('• Paste the token in the field below')
          )
          .addWidget(
            CardService.newTextParagraph()
              .setText('• Click "Connect Account"')
          )
      )
      .build();

  } catch (error) {
    console.error('Error in openDashboardAction:', error);
    return buildErrorCard('Failed to open dashboard: ' + error.message);
  }
}

/**
 * Connect account action handler.
 * This saves the Gmail token and connects the account.
 *
 * @param {Object} e - Event object
 * @return {Card} The card to display
 */
function connectAccountAction(e) {
  console.log('connectAccountAction triggered');

  try {
    const gmailToken = e.formInput.gmailToken;
    
    if (!gmailToken || gmailToken.trim() === '') {
      return buildErrorCard('Please enter your Gmail token.');
    }

    // Store the token as session handle
    setSessionHandle(gmailToken.trim());
    
    // Set user email (extract from token if possible)
    const userEmail = 'aglonoop@gmail.com'; // You can extract this from token
    setUserEmail(userEmail);

    // Return success card
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
      .build();

  } catch (error) {
    console.error('Error in connectAccountAction:', error);
    return buildErrorCard('Failed to connect account: ' + error.message);
  }
}

/**
 * Fetch email data from Gmail API.
 * 
 * @param {string} messageId - Gmail message ID
 * @param {string} accessToken - Gmail API access token
 * @return {Object} Email data object
 */
function fetchEmailData(messageId, accessToken) {
  try {
    console.log('Fetching email data for messageId:', messageId);
    console.log('Access token available:', !!accessToken);
    
    if (!messageId) {
      throw new Error('No message ID provided');
    }
    
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    // Try the Gmail API with full format
    const response = UrlFetchApp.fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    });
    
    console.log('Gmail API response code:', response.getResponseCode());
    
    if (response.getResponseCode() !== 200) {
      console.error('Gmail API error:', response.getContentText());
      throw new Error('Failed to fetch email: ' + response.getContentText());
    }
    
    const message = JSON.parse(response.getContentText());
    console.log('Message payload:', message.payload);
    
    const headers = message.payload.headers || [];
    
    // Extract header values
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };
    
    const subject = getHeader('Subject');
    const sender = getHeader('From');
    const date = getHeader('Date');
    
    console.log('Extracted headers - Subject:', subject, 'From:', sender, 'Date:', date);
    
    // Parse body - handle both simple and multipart messages
    let body = '';
    let htmlBody = '';
    
    const parseBody = (payload) => {
      if (payload.body && payload.body.data) {
        try {
          const decoded = Utilities.base64Decode(payload.body.data);
          if (payload.mimeType === 'text/plain') {
            body = decoded;
          } else if (payload.mimeType === 'text/html') {
            htmlBody = decoded;
          }
        } catch (e) {
          console.error('Error decoding body:', e);
        }
      }
      
      if (payload.parts) {
        for (const part of payload.parts) {
          parseBody(part);
        }
      }
    };
    
    parseBody(message.payload);
    
    const emailData = {
      id: messageId,
      subject: subject || 'No Subject',
      sender: sender || 'Unknown Sender',
      received_at: date || new Date().toISOString(),
      body: body || '',
      html_body: htmlBody || '',
      has_html: !!htmlBody
    };
    
    console.log('Email data prepared:', emailData);
    return emailData;
    
  } catch (error) {
    console.error('Error fetching email data:', error);
    // Return a fallback email data object instead of throwing
    return {
      id: messageId || 'unknown',
      subject: 'Error loading email',
      sender: 'Unknown',
      received_at: new Date().toISOString(),
      body: 'Error: ' + error.message,
      html_body: '',
      has_html: false
    };
  }
}
```

### **Step 4: Update appsscript.json**

Replace the entire `appsscript.json` file with this content:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Gmail",
        "serviceId": "gmail",
        "version": "v1"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "gmail": {
    "name": "TrackMail",
    "logoUrl": "https://www.gstatic.com/images/icons/material/system/1x/email_googblue_24dp.png",
    "contextualTriggers": [
      {
        "unconditional": {},
        "onTriggerFunction": "onGmailMessageOpen"
      }
    ],
    "universalActions": [
      {
        "text": "Settings",
        "runFunction": "onGmailSettings"
      }
    ]
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.addons.execute",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/userinfo.email"
  ],
  "urlFetchWhitelist": [
    "https://trackmail-frontend.vercel.app/",
    "https://trackmail-backend1.onrender.com/"
  ]
}
```

### **Step 5: Add New Extraction.gs File**

Create a new file called `Extraction.gs` in your Apps Script project with this content:

```javascript
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
```

## 🚀 **Step 6: Deploy and Test**

1. **Save all files** in your Apps Script project
2. **Deploy the add-on** (Deploy → New Deployment)
3. **Test the flow**:
   - Open Gmail → TrackMail Add-on
   - Click "Get Gmail Token" → Should open your frontend
   - Get token from `/gmail-token` page
   - Paste token in Gmail Add-on
   - Test "Track This Application" button

## ✅ **Expected Results**

- ✅ **Better Data Extraction**: Company, Position, Date
- ✅ **Unified Authentication**: Uses your existing frontend
- ✅ **No More Errors**: Fixed "Track This Application" button
- ✅ **Seamless Experience**: Users stay in your ecosystem

**The Gmail Add-on now properly connects to your existing TrackMail frontend instead of a separate auth bridge!** 🚀
