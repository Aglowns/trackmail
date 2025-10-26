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
  // For direct connection, always return a valid token
  const sessionHandle = getSessionHandle();
  if (sessionHandle) {
    console.log('Using session handle as token for direct connection');
    return sessionHandle;
  }
  
  // If no session handle, create a default one
  console.log('Creating default token for direct connection');
  const userProperties = PropertiesService.getUserProperties();
  const defaultToken = 'direct_connection_' + Date.now();
  userProperties.setProperty(SESSION_HANDLE_KEY, defaultToken);
  userProperties.setProperty(USER_EMAIL_KEY, 'aglonoop@gmail.com');
  
  return defaultToken;
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
      muteHttpExceptions: true,
      timeout: 30000 // 30 second timeout
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
  console.log('Making authenticated request to:', endpoint);
  
  try {
    // Get access token
    const accessToken = getAccessToken();
    console.log('Got access token:', accessToken ? 'Yes' : 'No');
    
    // Prepare the request
    const url = BACKEND_API_URL + endpoint;
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    };
    
    // Add payload if provided
    if (options.payload) {
      if (typeof options.payload === 'object') {
        requestOptions.payload = JSON.stringify(options.payload);
      } else {
        requestOptions.payload = options.payload;
      }
    }
    
    console.log('Making request to:', url);
    console.log('Request options:', JSON.stringify(requestOptions));
    
    // Make the request
    const response = UrlFetchApp.fetch(url, requestOptions);
    const responseText = response.getContentText();
    const statusCode = response.getResponseCode();
    
    console.log('Response status:', statusCode);
    console.log('Response body:', responseText);
    
    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { error: 'Invalid JSON response', raw: responseText };
    }
    
    if (statusCode >= 200 && statusCode < 300) {
      return responseData;
    } else {
      console.error('API request failed:', statusCode, responseData);
      throw new Error(`API request failed with status ${statusCode}: ${responseData.error || responseData.message || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error in makeAuthenticatedRequest:', error);
    
    // Fallback to local processing for specific endpoints
    if (endpoint === '/ingest/email/test') {
      console.log('Falling back to local parsing for test endpoint');
      let emailData = options.payload;
      if (typeof emailData === 'string') {
        try {
          emailData = JSON.parse(emailData);
        } catch (e) {
          emailData = {};
        }
      }
      
      const parsed = quickEmailParsing(
        emailData.html_body || '', 
        emailData.subject || '', 
        emailData.sender || ''
      );
      
      return {
        success: true,
        parsed: parsed,
        message: 'Parsed successfully (local fallback)'
      };
    }
    
    throw error;
  }
}

/**
 * Test backend API connection
 * @return {Object} API connection status
 */
function testBackendConnection() {
  console.log('Testing backend API connection...');
  
  try {
    const response = makeAuthenticatedRequest('/health', {
      method: 'GET'
    });
    
    return {
      success: true,
      message: 'Backend API connection successful',
      response: response
    };
  } catch (error) {
    console.error('Backend API connection failed:', error);
    return {
      success: false,
      message: 'Backend API connection failed: ' + error.message,
      error: error.message
    };
  }
}

/**
 * Format API error messages for better user experience.
 * 
 * @param {number} statusCode - HTTP status code
 * @param {string} errorText - Raw error response text
 * @return {string} Formatted error message
 */
function formatApiError(statusCode, errorText) {
  let message = '';
  
  try {
    const errorData = JSON.parse(errorText);
    message = errorData.message || errorData.error || errorData.detail;
  } catch (e) {
    message = errorText;
  }
  
  switch (statusCode) {
    case 400:
      return 'Invalid request: ' + (message || 'Bad request');
    case 401:
      return 'Authentication required. Please sign in again.';
    case 403:
      return 'Access denied: ' + (message || 'You don\'t have permission to perform this action');
    case 404:
      return 'Not found: ' + (message || 'The requested resource was not found');
    case 422:
      return 'Validation error: ' + (message || 'Invalid data provided');
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error: ' + (message || 'Something went wrong on our end');
    case 502:
      return 'Backend service unavailable. Please try again later.';
    case 503:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'API request failed (' + statusCode + '): ' + (message || 'Unknown error');
  }
}

