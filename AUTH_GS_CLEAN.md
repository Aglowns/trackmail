# Clean Auth.gs File

**Replace ALL content in your `Auth.gs` file with this clean version:**

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
const BACKEND_API_URL = 'http://localhost:8000/v1'; // ⚠️ UPDATE THIS with your backend URL

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

## 🔧 How to Fix:

1. **Open your `Auth.gs` file** in Apps Script
2. **Select ALL content** (Ctrl+A or Cmd+A)
3. **Delete everything**
4. **Copy and paste** the clean code above
5. **Save the file**

## ⚠️ Important: Update Backend URL

**Line 16**: Change this line to your actual backend URL:
```javascript
const BACKEND_API_URL = 'https://your-backend-url.com/v1'; // Replace with your backend URL
```

**If you don't have a backend URL yet**, use:
```javascript
const BACKEND_API_URL = 'http://localhost:8000/v1'; // For local testing
```

This should fix the duplicate declaration error! 🚀
