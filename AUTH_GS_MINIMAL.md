# Minimal Clean Auth.gs File

**Replace ALL content in your `Auth.gs` file with this minimal version:**

```javascript
/**
 * Authentication and Session Management for TrackMail Gmail Add-on
 */

// Configuration
const AUTH_BRIDGE_URL = 'https://trackmail-production.up.railway.app';
const BACKEND_API_URL = 'http://localhost:8000/v1';

// Storage keys
const SESSION_HANDLE_KEY = 'trackmail_session_handle';
const CACHED_TOKEN_KEY = 'trackmail_cached_token';
const CACHED_TOKEN_EXPIRES_KEY = 'trackmail_token_expires';
const USER_EMAIL_KEY = 'trackmail_user_email';

/**
 * Get the Auth Bridge URL
 */
function getAuthBridgeUrl() {
  return AUTH_BRIDGE_URL;
}

/**
 * Get the backend API URL
 */
function getBackendApiUrl() {
  return BACKEND_API_URL;
}

/**
 * Get the stored session handle
 */
function getSessionHandle() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(SESSION_HANDLE_KEY);
}

/**
 * Save a session handle to user properties
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
 * Clear the stored session handle and cached tokens
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
 * Get a valid access token
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
 * Fetch a new access token from the Auth Bridge
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
      console.error('Session expired or invalid');
      clearSessionHandle();
      return null;
    }
    
    if (statusCode === 429) {
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
    
    // Calculate expiry time
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
 * Get the signed-in user's email
 */
function getUserEmail() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(USER_EMAIL_KEY);
}

/**
 * Test the current authentication status
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
 * Make an authenticated API call to the backend
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

## 🔧 **Steps to Fix:**

1. **Open your `Auth.gs` file** in Apps Script
2. **Select ALL content** (Ctrl+A)
3. **Delete everything**
4. **Copy and paste** the code above
5. **Save the file**

## ⚠️ **Important: Update Backend URL**

**Line 7**: Change this to your actual backend URL:
```javascript
const BACKEND_API_URL = 'https://your-backend-url.com/v1';
```

**If you don't have a backend yet**, keep it as:
```javascript
const BACKEND_API_URL = 'http://localhost:8000/v1';
```

This minimal version should work without any syntax errors! 🚀
