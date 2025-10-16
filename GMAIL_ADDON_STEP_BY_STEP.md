# 🚀 Step-by-Step Gmail Add-on Creation

## ✅ Step 1: Create Apps Script Project

1. **Go to**: https://script.google.com
2. **Click**: "New Project"
3. **Name it**: "TrackMail"
4. **Delete**: Default `Code.gs` content

## ✅ Step 2: Enable Manifest

1. **Click**: ⚙️ "Project Settings"
2. **Check**: ☑️ "Show appsscript.json manifest file in editor"
3. **Go back to**: "Editor"

## ✅ Step 3: Replace appsscript.json

**Click on `appsscript.json` in the file list and replace ALL content with:**

```json
{
  "timeZone": "America/New_York",
  "dependencies": {
    "enabledAdvancedServices": [
      {
        "userSymbol": "Gmail",
        "version": "v1",
        "serviceId": "gmail"
      }
    ]
  },
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "gmail": {
    "name": "TrackMail",
    "logoUrl": "https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png",
    "primaryColor": "#667eea",
    "secondaryColor": "#764ba2",
    "contextualTriggers": [
      {
        "unconditional": {},
        "onTriggerFunction": "onGmailMessageOpen"
      }
    ],
    "composeTrigger": {
      "selectActions": [
        {
          "text": "TrackMail",
          "runFunction": "onGmailCompose"
        }
      ],
      "draftAccess": "NONE"
    },
    "universalActions": [
      {
        "text": "Settings",
        "runFunction": "onGmailMessageOpen"
      }
    ]
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.addons.current.message.readonly",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/userinfo.email"
  ]
}
```

## ✅ Step 4: Create Code.gs

**Click on `Code.gs` and replace ALL content with:**

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
    
    // Fetch email details using Gmail API
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
 * Fetches email data from Gmail API.
 * 
 * @param {string} messageId - Gmail message ID
 * @param {string} accessToken - Gmail API access token
 * @return {Object} Email data formatted for backend API
 */
function fetchEmailData(messageId, accessToken) {
  try {
    // Fetch message using Gmail API
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;
    
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() !== 200) {
      console.error('Gmail API error:', response.getContentText());
      throw new Error('Failed to fetch email from Gmail API');
    }
    
    const message = JSON.parse(response.getContentText());
    
    // Extract headers
    const headers = {};
    message.payload.headers.forEach(function(header) {
      headers[header.name.toLowerCase()] = header.value;
    });
    
    // Extract body
    let textBody = '';
    let htmlBody = '';
    
    if (message.payload.body && message.payload.body.data) {
      // Simple email with body directly in payload
      const decodedBody = Utilities.newBlob(
        Utilities.base64Decode(
          message.payload.body.data.replace(/-/g, '+').replace(/_/g, '/')
        )
      ).getDataAsString();
      
      if (message.payload.mimeType === 'text/html') {
        htmlBody = decodedBody;
      } else {
        textBody = decodedBody;
      }
    } else if (message.payload.parts) {
      // Multipart email - extract text and HTML parts
      message.payload.parts.forEach(function(part) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          textBody = Utilities.newBlob(
            Utilities.base64Decode(
              part.body.data.replace(/-/g, '+').replace(/_/g, '/')
            )
          ).getDataAsString();
        } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
          htmlBody = Utilities.newBlob(
            Utilities.base64Decode(
              part.body.data.replace(/-/g, '+').replace(/_/g, '/')
            )
          ).getDataAsString();
        }
      });
    }
    
    // Build email data object for backend API
    return {
      message_id: messageId,
      thread_id: message.threadId,
      sender: headers['from'] || '',
      subject: headers['subject'] || '',
      text_body: textBody,
      html_body: htmlBody,
      received_at: headers['date'] || new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching email data:', error);
    throw error;
  }
}
```

## ✅ Step 5: Create Auth.gs

**Click ➕ "Script file" → Name it "Auth" → Replace ALL content with:**

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
const AUTH_BRIDGE_URL = 'https://trackmail-production.up.railway.app'; // Your Auth Bridge URL
const BACKEND_API_URL = 'http://localhost:8000/v1'; // Your backend API URL

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
 * Save a session handle to user properties.
 * 
 * @param {string} sessionHandle - The session handle to save
 */
function saveSessionHandle(sessionHandle) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(SESSION_HANDLE_KEY, sessionHandle);
  
  // Clear cached token when session changes
  userProperties.deleteProperty(CACHED_TOKEN_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
  
  console.log('Session handle saved');
}

/**
 * Clear the stored session handle and cached tokens.
 */
function clearSessionHandle() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty(SESSION_HANDLE_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
  userProperties.deleteProperty(USER_EMAIL_KEY);
  
  console.log('Session cleared');
}

/**
 * Get a valid access token.
 * 
 * This function checks if we have a cached token that's still valid.
 * If not, it fetches a new token from the Auth Bridge.
 * 
 * @return {string|null} Access token or null if authentication fails
 */
function getAccessToken() {
  const userProperties = PropertiesService.getUserProperties();
  
  // Check if we have a cached token that's still valid
  const cachedToken = userProperties.getProperty(CACHED_TOKEN_KEY);
  const expiresAt = userProperties.getProperty(CACHED_TOKEN_EXPIRES_KEY);
  
  if (cachedToken && expiresAt) {
    const now = new Date().getTime();
    const expiryTime = parseInt(expiresAt);
    
    // If token expires in more than 30 seconds, use it
    if (expiryTime > now + 30000) {
      console.log('Using cached token');
      return cachedToken;
    }
  }
  
  // Need to fetch a new token
  console.log('Fetching new token from Auth Bridge');
  return fetchNewAccessToken();
}

/**
 * Fetch a new access token from the Auth Bridge.
 * 
 * @return {string|null} Access token or null if fetch fails
 */
function fetchNewAccessToken() {
  try {
    const sessionHandle = getSessionHandle();
    
    if (!sessionHandle) {
      console.error('No session handle found');
      return null;
    }
    
    // Call Auth Bridge to exchange session handle for token
    const url = AUTH_BRIDGE_URL + '/token?handle=' + encodeURIComponent(sessionHandle);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    const statusCode = response.getResponseCode();
    
    if (statusCode === 401) {
      // Session expired or invalid
      console.error('Session expired or invalid');
      clearSessionHandle();
      return null;
    }
    
    if (statusCode === 429) {
      // Rate limit exceeded
      console.error('Rate limit exceeded');
      throw new Error('Too many requests. Please wait a moment and try again.');
    }
    
    if (statusCode !== 200) {
      console.error('Auth Bridge error:', response.getContentText());
      return null;
    }
    
    const data = JSON.parse(response.getContentText());
    
    // Cache the token
    const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(CACHED_TOKEN_KEY, data.access_token);
    
    // Calculate expiry time (current time + expires_in seconds - 30 second buffer)
    const expiresAt = new Date().getTime() + (data.expires_in * 1000) - 30000;
    userProperties.setProperty(CACHED_TOKEN_EXPIRES_KEY, expiresAt.toString());
    
    // Save user email
    if (data.user_email) {
      userProperties.setProperty(USER_EMAIL_KEY, data.user_email);
    }
    
    console.log('New token fetched and cached');
    return data.access_token;
    
  } catch (error) {
    console.error('Error fetching access token:', error);
    return null;
  }
}

/**
 * Get the signed-in user's email.
 * 
 * @return {string|null} User email or null if not available
 */
function getUserEmail() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(USER_EMAIL_KEY);
}

/**
 * Test the current authentication status.
 * 
 * @return {Object} Test result with status and details
 */
function testAuthentication() {
  const sessionHandle = getSessionHandle();
  
  if (!sessionHandle) {
    return {
      authenticated: false,
      message: 'No session handle found. Please sign in.'
    };
  }
  
  const token = getAccessToken();
  
  if (!token) {
    return {
      authenticated: false,
      message: 'Failed to get access token. Session may have expired.'
    };
  }
  
  const userEmail = getUserEmail();
  
  return {
    authenticated: true,
    message: 'Authentication successful',
    user_email: userEmail
  };
}

/**
 * Make an authenticated API call to the backend.
 * 
 * @param {string} endpoint - API endpoint (e.g., '/ingest/email')
 * @param {Object} options - UrlFetchApp options
 * @return {Object} Parsed response data
 */
function makeAuthenticatedRequest(endpoint, options) {
  const token = getAccessToken();
  
  if (!token) {
    throw new Error('Authentication required. Please sign in.');
  }
  
  // Add authorization header
  options = options || {};
  options.headers = options.headers || {};
  options.headers['Authorization'] = 'Bearer ' + token;
  options.headers['Content-Type'] = 'application/json';
  options.muteHttpExceptions = true;
  
  const url = BACKEND_API_URL + endpoint;
  
  console.log('Making authenticated request to:', url);
  
  const response = UrlFetchApp.fetch(url, options);
  const statusCode = response.getResponseCode();
  
  console.log('Response status:', statusCode);
  
  if (statusCode === 401) {
    // Token expired, try to refresh
    console.log('Token expired, clearing cache and retrying');
    const userProperties = PropertiesService.getUserProperties();
    userProperties.deleteProperty(CACHED_TOKEN_KEY);
    userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
    
    // Retry once with fresh token
    const newToken = getAccessToken();
    if (newToken) {
      options.headers['Authorization'] = 'Bearer ' + newToken;
      const retryResponse = UrlFetchApp.fetch(url, options);
      
      if (retryResponse.getResponseCode() === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      
      return JSON.parse(retryResponse.getContentText());
    } else {
      throw new Error('Authentication failed. Please sign in again.');
    }
  }
  
  if (statusCode >= 400) {
    const errorText = response.getContentText();
    console.error('API error:', errorText);
    throw new Error('API request failed: ' + errorText);
  }
  
  return JSON.parse(response.getContentText());
}
```

**⚠️ IMPORTANT**: Update line 15 with your backend URL:
```javascript
const BACKEND_API_URL = 'https://your-backend-url.com/v1'; // Replace with your actual backend URL
```

## ✅ Step 6: Create API.gs

**Click ➕ "Script file" → Name it "API" → Replace ALL content with:**

```javascript
/**
 * Backend API Communication
 * 
 * This file contains functions for communicating with the TrackMail backend API.
 * All API calls use authentication via the Auth Bridge.
 */

/**
 * Ingest an email to create or update a job application.
 * 
 * @param {Object} emailData - Email data object
 * @return {Object} Ingestion result from backend
 */
function ingestEmail(emailData) {
  try {
    console.log('Ingesting email:', emailData.subject);
    
    const response = makeAuthenticatedRequest('/ingest/email', {
      method: 'post',
      payload: JSON.stringify(emailData)
    });
    
    console.log('Ingest response:', JSON.stringify(response));
    return response;
    
  } catch (error) {
    console.error('Error ingesting email:', error);
    return {
      success: false,
      message: error.message || 'Failed to ingest email'
    };
  }
}

/**
 * Test email parsing without storing data.
 * 
 * @param {Object} emailData - Email data object
 * @return {Object} Parsing test results from backend
 */
function testEmailParsing(emailData) {
  try {
    console.log('Testing email parsing');
    
    const response = makeAuthenticatedRequest('/ingest/email/test', {
      method: 'post',
      payload: JSON.stringify(emailData)
    });
    
    console.log('Test response:', JSON.stringify(response));
    return response;
    
  } catch (error) {
    console.error('Error testing email parsing:', error);
    return {
      success: false,
      message: error.message || 'Failed to test parsing',
      parsed: null
    };
  }
}

/**
 * Get all applications for the current user.
 * 
 * @param {number} skip - Number of records to skip (pagination)
 * @param {number} limit - Number of records to return
 * @return {Object} Paginated list of applications
 */
function getApplications(skip, limit) {
  skip = skip || 0;
  limit = limit || 50;
  
  try {
    console.log('Fetching applications');
    
    const response = makeAuthenticatedRequest(
      '/applications?skip=' + skip + '&limit=' + limit,
      {
        method: 'get'
      }
    );
    
    return response;
    
  } catch (error) {
    console.error('Error fetching applications:', error);
    return {
      items: [],
      total: 0,
      error: error.message
    };
  }
}

/**
 * Get a specific application by ID.
 * 
 * @param {string} applicationId - Application UUID
 * @return {Object} Application details
 */
function getApplication(applicationId) {
  try {
    console.log('Fetching application:', applicationId);
    
    const response = makeAuthenticatedRequest('/applications/' + applicationId, {
      method: 'get'
    });
    
    return response;
    
  } catch (error) {
    console.error('Error fetching application:', error);
    return null;
  }
}

/**
 * Create a new application manually.
 * 
 * @param {Object} applicationData - Application data
 * @return {Object} Created application
 */
function createApplication(applicationData) {
  try {
    console.log('Creating application:', applicationData.company);
    
    const response = makeAuthenticatedRequest('/applications', {
      method: 'post',
      payload: JSON.stringify(applicationData)
    });
    
    return response;
    
  } catch (error) {
    console.error('Error creating application:', error);
    return {
      success: false,
      message: error.message || 'Failed to create application'
    };
  }
}

/**
 * Update an existing application.
 * 
 * @param {string} applicationId - Application UUID
 * @param {Object} updateData - Fields to update
 * @return {Object} Updated application
 */
function updateApplication(applicationId, updateData) {
  try {
    console.log('Updating application:', applicationId);
    
    const response = makeAuthenticatedRequest('/applications/' + applicationId, {
      method: 'patch',
      payload: JSON.stringify(updateData)
    });
    
    return response;
    
  } catch (error) {
    console.error('Error updating application:', error);
    return {
      success: false,
      message: error.message || 'Failed to update application'
    };
  }
}

/**
 * Delete an application.
 * 
 * @param {string} applicationId - Application UUID
 * @return {Object} Deletion result
 */
function deleteApplication(applicationId) {
  try {
    console.log('Deleting application:', applicationId);
    
    const response = makeAuthenticatedRequest('/applications/' + applicationId, {
      method: 'delete'
    });
    
    return { success: true };
    
  } catch (error) {
    console.error('Error deleting application:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete application'
    };
  }
}

/**
 * Get events for an application.
 * 
 * @param {string} applicationId - Application UUID
 * @return {Array} List of events
 */
function getApplicationEvents(applicationId) {
  try {
    console.log('Fetching events for application:', applicationId);
    
    const response = makeAuthenticatedRequest(
      '/applications/' + applicationId + '/events',
      {
        method: 'get'
      }
    );
    
    return response.items || [];
    
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

/**
 * Add an event to an application.
 * 
 * @param {string} applicationId - Application UUID
 * @param {Object} eventData - Event data
 * @return {Object} Created event
 */
function addApplicationEvent(applicationId, eventData) {
  try {
    console.log('Adding event to application:', applicationId);
    
    const response = makeAuthenticatedRequest(
      '/applications/' + applicationId + '/events',
      {
        method: 'post',
        payload: JSON.stringify(eventData)
      }
    );
    
    return response;
    
  } catch (error) {
    console.error('Error adding event:', error);
    return {
      success: false,
      message: error.message || 'Failed to add event'
    };
  }
}

/**
 * Check backend health.
 * 
 * @return {Object} Health check result
 */
function checkBackendHealth() {
  try {
    // Health endpoint doesn't require authentication
    const url = BACKEND_API_URL.replace('/v1', '') + '/health';
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    }
    
    return {
      status: 'unhealthy',
      error: 'Backend returned status ' + response.getResponseCode()
    };
    
  } catch (error) {
    console.error('Error checking backend health:', error);
    return {
      status: 'unreachable',
      error: error.message
    };
  }
}
```

## ✅ Step 7: Create UI.gs

**Click ➕ "Script file" → Name it "UI" → Replace ALL content with:**

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
            .setText('Sign In with TrackMail')
            .setBackgroundColor('#667eea')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('openAuthPageAction')
            )
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>A new window will open for sign-in. After signing in, you\'ll receive a session code to paste here.</i></font>')
        )
    )
    .addSection(
      CardService.newCardSection()
        .setHeader('Already signed in?')
        .addWidget(
          CardService.newTextInput()
            .setFieldName('sessionHandle')
            .setTitle('Session Handle')
            .setHint('Paste your session handle here')
        )
        .addWidget(
          CardService.newTextButton()
            .setText('Save Session')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('saveSessionHandleAction')
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
    
    emailPreview = '<b>From:</b> ' + sender + '<br>' +
                   '<b>Subject:</b> ' + subject + '<br>' +
                   '<b>Date:</b> ' + date;
  } catch (error) {
    console.error('Error fetching email preview:', error);
    emailPreview = '<font color="#991b1b">Error loading email preview</font>';
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Signed in as: ' + userEmail)
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
            .setText('📌 Track This Application')
            .setBackgroundColor('#667eea')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('trackApplicationAction')
                .setParameters({
                  'messageId': messageId,
                  'accessToken': accessToken
                })
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText('🔍 Test Parsing')
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName('testParsingAction')
                .setParameters({
                  'messageId': messageId,
                  'accessToken': accessToken
                })
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
 * Build success card after successful application tracking.
 * 
 * @param {Object} result - Ingestion result from backend
 * @return {Card} Success card
 */
function buildSuccessCard(result) {
  let message = '✅ Application tracked successfully!';
  
  if (result.duplicate) {
    message = '✅ This email was already tracked.';
  }
  
  let detailText = result.message || '';
  if (result.application_id) {
    detailText += '<br><br><font color="#6b7280"><i>Application ID: ' + result.application_id + '</i></font>';
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Success!')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>' + message + '</b>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText(detailText)
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
 * Build error card when something goes wrong.
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
            .setText('<b>⚠️ Something went wrong</b>')
        )
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
 * Build test results card after testing email parsing.
 * 
 * @param {Object} result - Test result from backend
 * @return {Card} Test results card
 */
function buildTestResultsCard(result) {
  let resultsText = '';
  
  if (result.parsed) {
    resultsText = '<b>Parsing Results:</b><br><br>' +
                  '<b>Company:</b> ' + (result.parsed.company || '<i>Not found</i>') + '<br>' +
                  '<b>Position:</b> ' + (result.parsed.position || '<i>Not found</i>') + '<br>' +
                  '<b>Status:</b> ' + (result.parsed.status || '<i>Not found</i>') + '<br>' +
                  '<b>Confidence:</b> ' + (result.parsed.confidence ? (result.parsed.confidence * 100).toFixed(0) + '%' : '<i>N/A</i>');
    
    if (result.would_create_duplicate) {
      resultsText += '<br><br><font color="#b45309">⚠️ This email was already ingested</font>';
    }
  } else {
    resultsText = '<font color="#991b1b">Failed to parse email</font>';
    if (result.message) {
      resultsText += '<br><br>' + result.message;
    }
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Test Results')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(resultsText)
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<font color="#6b7280"><i>This was a test - no data was saved</i></font>')
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
 * Build authentication success card.
 * 
 * @return {Card} Auth success card
 */
function buildAuthSuccessCard() {
  const userEmail = getUserEmail() || 'Unknown';
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Authentication Successful')
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('<b>✅ Successfully signed in!</b>')
        )
        .addWidget(
          CardService.newTextParagraph()
            .setText('Signed in as: ' + userEmail)
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText('You can now track job application emails. Open any email to get started!')
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Continue')
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
 * Build a card for displaying application details.
 * This could be used for a future feature to browse applications from Gmail.
 * 
 * @param {Object} application - Application object from API
 * @return {Card} Application details card
 */
function buildApplicationDetailsCard(application) {
  let statusColor = '#6b7280'; // default gray
  if (application.status === 'interviewing') statusColor = '#2563eb'; // blue
  else if (application.status === 'offer') statusColor = '#16a34a'; // green
  else if (application.status === 'rejected') statusColor = '#dc2626'; // red
  
  const detailsText = '<b>Company:</b> ' + application.company + '<br>' +
                      '<b>Position:</b> ' + application.position + '<br>' +
                      '<b>Status:</b> <font color="' + statusColor + '">' + application.status + '</font><br>';
  
  let notesWidget = null;
  if (application.notes) {
    notesWidget = CardService.newTextParagraph()
      .setText('<b>Notes:</b><br>' + application.notes);
  }
  
  const section = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph()
        .setText(detailsText)
    );
  
  if (notesWidget) {
    section.addWidget(notesWidget);
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle('📧 TrackMail')
        .setSubtitle('Application Details')
    )
    .addSection(section)
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
```

## ✅ Step 8: Enable Gmail API

1. **Click**: ➕ next to "Services"
2. **Find**: "Gmail API" in the list
3. **Click**: "Add"

## ✅ Step 9: Update Backend URL (IMPORTANT!)

**In Auth.gs, update line 15 with your backend URL:**
```javascript
const BACKEND_API_URL = 'https://your-backend-url.com/v1'; // Replace with your actual backend URL
```

**If you don't have a backend URL yet, you can use:**
```javascript
const BACKEND_API_URL = 'http://localhost:8000/v1'; // For local testing
```

## ✅ Step 10: Deploy

1. **Click**: "Deploy" → "Test deployments"
2. **Click**: "Install"
3. **Authorize** when prompted
4. **New Gmail window opens** with add-on installed

## 🎉 You're Done!

Your Gmail Add-on is now ready to use!

**Test it by:**
1. Opening any email in Gmail
2. Looking for TrackMail icon in right sidebar
3. Clicking it to open the add-on
4. Following the sign-in flow

---

**Need help with any of these steps?** Let me know! 🚀
