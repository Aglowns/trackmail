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
const FRONTEND_LOGIN_URL = 'https://jobmail-frontend.vercel.app/login'; // Frontend login page
const BACKEND_API_URL = 'https://trackmail-backend1.onrender.com/v1'; // Deployed Backend API URL (Render)
const SUPABASE_URL = 'https://vhbnxzhvbawaqrgcddo6.supabase.co'; // Your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYm54emh2YmF3YXFyZ2NkZG82Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxODQ1MzQsImV4cCI6MjA2MTc2MDUzNH0.JV5XHlMaBn3xqXBPnZOiwn7oqlCBMQaUiH4dVEjlKbQ'; // Your Supabase anon key

// Storage keys
const API_KEY_KEY = 'jobmail_api_key';  // Simple API key (never expires)
const USER_EMAIL_KEY = 'jobmail_user_email';

/**
 * Get the frontend login URL where users can sign in.
 * 
 * @return {string} Frontend login URL
 */
function getFrontendLoginUrl() {
  return FRONTEND_LOGIN_URL + '?source=gmail-addon';
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
 * Get the stored API key.
 * 
 * @return {string|null} API key or null if not found
 */
function getApiKey() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(API_KEY_KEY);
}

/**
 * Get the stored session handle (deprecated - use getApiKey instead).
 * 
 * @return {string|null} Session handle or null if not found
 */
function getSessionHandle() {
  const userProperties = PropertiesService.getUserProperties();
  return userProperties.getProperty(API_KEY_KEY);  // Return API key for backward compatibility
}

/**
 * Save a session handle to user properties (deprecated - use saveApiKey instead).
 * 
 * @param {string} sessionHandle - The session handle to save
 */
function saveSessionHandle(sessionHandle) {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.setProperty(API_KEY_KEY, sessionHandle);  // Save as API key
  
  console.log('Session handle saved as API key');
}

/**
 * Save API key and user email.
 * This is called after user pastes their API key from the Settings page.
 * 
 * @param {string} apiKey - API key from Settings page
 * @param {string} userEmail - User's email address (optional, can be extracted later)
 */
function saveApiKey(apiKey, userEmail) {
  const userProperties = PropertiesService.getUserProperties();
  
  // Save API key (never expires!)
  userProperties.setProperty(API_KEY_KEY, apiKey);
  
  // Save user email if provided
  if (userEmail) {
    userProperties.setProperty(USER_EMAIL_KEY, userEmail);
  }
  
  console.log('✅ API key saved successfully');
  console.log('API key never expires - no refresh needed!');
}

/**
 * Clear the stored API key and user data.
 */
function clearSessionHandle() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty(API_KEY_KEY);
  userProperties.deleteProperty(USER_EMAIL_KEY);
  
  console.log('✅ API key cleared - user needs to paste a new one');
}

/**
 * Get a valid access token (JWT from Supabase).
 * 
 * PRIORITY ORDER:
 * 1. Installation token (365-day long-lived) - ALWAYS USE THIS FIRST if available
 * 2. Cached short-lived access token (if still valid)
 * 3. Refresh short-lived token using refresh token (if available)
 * 4. Return null (user needs to re-authenticate)
 * 
 * @return {string|null} Access token or null if authentication fails
 */
function getAccessToken() {
  const userProperties = PropertiesService.getUserProperties();
  
  // PRIORITY 1: Check for installation token first (long-lived, designed to last 365 days)
  const installationToken = userProperties.getProperty(INSTALLATION_TOKEN_KEY);
  if (installationToken) {
    try {
      const payload = decodeJwtPayload(installationToken) || {};
      const exp = payload.exp ? payload.exp * 1000 : null;
      const now = Date.now();

      // Installation token is valid if:
      // - It has an exp claim AND current time is before expiration (with 1 hour safety buffer)
      // - OR it has no exp claim (assume it's valid - installation tokens last 365 days)
      const isValid = !exp || now < (exp - 60 * 60 * 1000); // 1 hour buffer before actual expiry

      if (isValid) {
        const daysUntilExpiry = exp ? Math.floor((exp - now) / (1000 * 60 * 60 * 24)) : null;
        console.log('✅ Using installation token (long-lived, 365-day validity)');
        console.log('Token expires in:', daysUntilExpiry !== null ? daysUntilExpiry + ' days' : 'N/A (no expiry)');
        console.log('Token type:', payload.type || 'unknown');
        console.log('Token issued:', payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A');
        
        // Cache user email if available
        if (payload.email) {
          userProperties.setProperty(USER_EMAIL_KEY, payload.email);
        }
        
        // Always return installation token - it's designed to work for a full year
        return installationToken;
      } else {
        const expiredDaysAgo = exp ? Math.floor((now - exp) / (1000 * 60 * 60 * 24)) : 0;
        console.warn('⚠️ Installation token has expired.');
        console.warn('Token expired:', new Date(exp).toISOString(), '(' + expiredDaysAgo + ' days ago)');
        console.warn('Current time:', new Date(now).toISOString());
        console.warn('⚠️ User needs to get a fresh installation token from Settings page.');
        // Don't delete it - user might want to see the error and get a new one
      }
    } catch (decodeError) {
      console.error('❌ Failed to decode installation token:', decodeError);
      console.error('⚠️ Installation token may be corrupted. User should get a fresh one from Settings.');
      // Continue to fallback tokens
    }
  }

  // PRIORITY 2: Check for cached short-lived access token
  const cachedToken = userProperties.getProperty(CACHED_TOKEN_KEY);
  const expiresAt = userProperties.getProperty(CACHED_TOKEN_EXPIRES_KEY);

  if (cachedToken && expiresAt) {
    const now = Date.now();
    const expiryTime = parseInt(expiresAt, 10);
    const timeUntilExpiry = expiryTime - now;
    
    // Check if token is still valid (with 5 minute buffer)
    if (now < expiryTime - (5 * 60 * 1000)) {
      console.log('✅ Using cached short-lived access token (still valid)');
      console.log('Token expires in:', Math.floor(timeUntilExpiry / (1000 * 60)), 'minutes');
      return cachedToken;
    }
    
    // Token is expiring soon (within 5 minutes) or already expired - proactively refresh
    console.log('⚠️ Cached token expiring soon or expired - proactively refreshing');
    console.log('Time until expiry:', Math.floor(timeUntilExpiry / 1000), 'seconds');
    
    const refreshToken = userProperties.getProperty(REFRESH_TOKEN_KEY);
    if (refreshToken && refreshToken.length > 20) {
      console.log('Attempting proactive refresh using stored refresh token...');
      const newToken = refreshAccessToken(refreshToken);
      if (newToken) {
        console.log('✅ Token proactively refreshed before expiry');
        return newToken;
      } else {
        console.warn('⚠️ Proactive refresh failed - token may still work for a bit');
        // Return the cached token anyway - it might still work for a few more minutes
        // The automatic refresh in makeAuthenticatedRequest will handle 401 errors
        return cachedToken;
      }
    }

    // Clear expired cached token if we can't refresh
    if (timeUntilExpiry < -(60 * 60 * 1000)) { // Only clear if expired more than 1 hour ago
      console.warn('Token expired more than 1 hour ago - clearing');
      userProperties.deleteProperty(CACHED_TOKEN_KEY);
      userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
    } else {
      // Return the token anyway - let makeAuthenticatedRequest handle the refresh
      console.log('Returning token - will auto-refresh on 401 if needed');
      return cachedToken;
    }
  }

  // PRIORITY 3: Try refresh token directly (if no cached token exists)
  const refreshToken = userProperties.getProperty(REFRESH_TOKEN_KEY);
  if (refreshToken && refreshToken.length > 20) {
    console.log('Attempting to get new token using refresh token...');
    const newToken = refreshAccessToken(refreshToken);
    if (newToken) {
      console.log('✅ Got new token via refresh token');
      return newToken;
    }
  }

  // PRIORITY 4: No valid tokens available
  console.log('❌ No valid access token found - authentication required');
  return null;
}

/**
 * Refresh the access token using the refresh token.
 * This is called automatically when the access token expires.
 * 
 * @param {string} refreshToken - Supabase refresh token
 * @return {string|null} New access token or null if refresh fails
 */
function refreshAccessToken(refreshToken) {
  try {
    console.log('Refreshing access token...');
    
    // Call Supabase auth API to refresh the token
    const url = SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token';
    
    const payload = {
      refresh_token: refreshToken
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    console.log('Calling Supabase refresh API...');
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Refresh response status:', statusCode);
    console.log('Refresh response body:', responseText);
    
    if (statusCode !== 200) {
      console.error('Token refresh failed:', statusCode, responseText);
      return null;
    }
    
    const data = JSON.parse(responseText);
    
    if (!data.access_token) {
      console.error('No access token in refresh response');
      return null;
    }
    
    // Save the new tokens and user email
  const userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty(CACHED_TOKEN_KEY, data.access_token);
    
    // Update refresh token if a new one is provided
    if (data.refresh_token) {
      userProperties.setProperty(REFRESH_TOKEN_KEY, data.refresh_token);
    }
    
    // Save user email from the token response
    if (data.user && data.user.email) {
      userProperties.setProperty(USER_EMAIL_KEY, data.user.email);
    }
    
    // Calculate new expiry time
    const expiresInSeconds = data.expires_in || 3600;
    const expiresAt = new Date().getTime() + (expiresInSeconds * 1000) - 300000;
    userProperties.setProperty(CACHED_TOKEN_EXPIRES_KEY, expiresAt.toString());
    
    console.log('Token refresh successful for user:', data.user ? data.user.email : 'unknown');
    return data.access_token;
    
  } catch (error) {
    console.error('Error refreshing token:', error);
    console.error('Error stack:', error.stack);
    return null;
  }
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
  const storedEmail = userProperties.getProperty(USER_EMAIL_KEY);

  if (storedEmail) {
    return storedEmail;
  }

  const candidateTokens = [
    userProperties.getProperty(CACHED_TOKEN_KEY),
    userProperties.getProperty(SESSION_HANDLE_KEY),
    userProperties.getProperty(INSTALLATION_TOKEN_KEY),
  ];

  for (const token of candidateTokens) {
    if (!token || !token.startsWith('eyJ')) {
      continue;
    }

    const payload = decodeJwtPayload(token);
    if (!payload) {
      continue;
    }

    const derivedEmail = payload.email
      || payload.user_email
      || (payload.user_metadata && payload.user_metadata.email)
      || (payload.sub && payload.sub.indexOf('@') > -1 ? payload.sub : null);

    if (derivedEmail) {
      userProperties.setProperty(USER_EMAIL_KEY, derivedEmail);
      return derivedEmail;
    }
  }

  try {
    const activeUserEmail = Session.getActiveUser().getEmail();
    if (activeUserEmail) {
      userProperties.setProperty(USER_EMAIL_KEY, activeUserEmail);
      return activeUserEmail;
    }
  } catch (error) {
    console.log('Unable to read active user email (expected in limited scopes):', error);
  }

  return null;
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payloadBytes = Utilities.base64DecodeWebSafe(parts[1]);
    const payloadJson = Utilities.newBlob(payloadBytes).getDataAsString();
    return JSON.parse(payloadJson);
  } catch (error) {
    console.error('Failed to decode JWT payload:', error);
    return null;
  }
}

/**
 * Test the current authentication status.
 * 
 * @return {Object} Test result with status and details
 */
function testAuthentication() {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      authenticated: false,
      message: 'No API key found. Please paste your API key from Settings.'
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
/**
 * Make an authenticated request to the backend API using API key.
 * 
 * Much simpler than JWT tokens - just send the API key in X-API-Key header!
 * 
 * @param {string} endpoint - API endpoint (e.g., '/ingest/email')
 * @param {Object} options - Request options (method, payload, etc.)
 * @return {Object} API response data
 */
function makeAuthenticatedRequest(endpoint, options) {
  console.log('Making authenticated request to:', endpoint);
  
  try {
    // Get API key (simple - just one key, no expiration!)
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error('API_ERROR::' + JSON.stringify({
        status: 401,
        message: 'API key required. Please paste your API key from Settings.',
      }));
    }
    
    const url = BACKEND_API_URL + endpoint;
    
    console.log('Using API key authentication');
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'X-API-Key': apiKey,  // Simple header - no Bearer token needed!
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
    const response = UrlFetchApp.fetch(url, requestOptions);
    const responseText = response.getContentText();
    const statusCode = response.getResponseCode();
    
    console.log('Response status:', statusCode);
    console.log('Response body:', responseText.substring(0, 200));
    
    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      // Backend returned non-JSON (likely HTML error page or plain text)
      console.error('Failed to parse JSON response:', responseText.substring(0, 200));
      
      // Try to extract useful error information
      let errorMessage = 'Server error';
      if (responseText.includes('500') || responseText.includes('Internal Server Error')) {
        errorMessage = 'Internal server error. Please try again later.';
      } else if (responseText.includes('502') || responseText.includes('Bad Gateway')) {
        errorMessage = 'Backend service unavailable. Please try again in a few moments.';
      } else if (responseText.includes('503') || responseText.includes('Service Unavailable')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (responseText.length > 0) {
        // Try to extract first line or meaningful text
        const lines = responseText.split('\n').filter(line => line.trim().length > 0);
        if (lines.length > 0 && lines[0].length < 200) {
          errorMessage = lines[0].substring(0, 100);
        }
      }
      
      responseData = { 
        error: errorMessage,
        message: errorMessage,
        raw: responseText.substring(0, 500) // Limit raw text length
      };
    }
    
    if (statusCode >= 200 && statusCode < 300) {
      // Success!
      return responseData;
    }

    // Error response
    console.error('❌ API request failed:', statusCode);
    console.error('Error message:', responseData.error || responseData.message || responseData.detail);
    
    const payload = {
      status: statusCode,
      message: responseData.error || responseData.message || responseData.detail || 'Unknown error',
      raw: typeof responseText === 'string' ? responseText.substring(0, 1000) : ''
    };
    throw new Error('API_ERROR::' + JSON.stringify(payload));
    
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

