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
const FRONTEND_LOGIN_URL = 'https://trackmail-frontend.vercel.app/login'; // Frontend login page
const BACKEND_API_URL = 'https://trackmail-backend1.onrender.com/v1'; // Deployed Backend API URL (Render)
const SUPABASE_URL = 'https://vhbnxzhvbawaqrgcddo6.supabase.co'; // Your Supabase project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYm54emh2YmF3YXFyZ2NkZG82Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxODQ1MzQsImV4cCI6MjA2MTc2MDUzNH0.JV5XHlMaBn3xqXBPnZOiwn7oqlCBMQaUiH4dVEjlKbQ'; // Your Supabase anon key

// Storage keys
const SESSION_HANDLE_KEY = 'jobmail_session_handle';
const CACHED_TOKEN_KEY = 'jobmail_cached_token';
const CACHED_TOKEN_EXPIRES_KEY = 'jobmail_token_expires';
const REFRESH_TOKEN_KEY = 'jobmail_refresh_token';
const INSTALLATION_TOKEN_KEY = 'jobmail_installation_token';
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
 * Save JWT token, refresh token, and user email from Supabase auth.
 * This is called after user signs in on the frontend (ONE TIME SETUP).
 * 
 * @param {string} jwtToken - Supabase JWT access token
 * @param {string} refreshToken - Supabase refresh token (lasts forever)
 * @param {string} userEmail - User's email address
 * @param {number} expiresIn - Token expiry time in seconds (default 3600 = 1 hour)
 */
function saveAuthToken(jwtToken, refreshToken, userEmail, expiresIn) {
  const userProperties = PropertiesService.getUserProperties();
  
  // Save JWT token
  userProperties.setProperty(CACHED_TOKEN_KEY, jwtToken);
  
  // Save refresh token (NEVER EXPIRES - this is the key!)
  userProperties.setProperty(REFRESH_TOKEN_KEY, refreshToken);
  
  // Calculate expiry time (current time + expires_in seconds - 5 minute buffer)
  const expiresInSeconds = expiresIn || 3600; // Default 1 hour
  const expiresAt = new Date().getTime() + (expiresInSeconds * 1000) - 300000; // 5 min buffer
  userProperties.setProperty(CACHED_TOKEN_EXPIRES_KEY, expiresAt.toString());
  
  // Save user email
  userProperties.setProperty(USER_EMAIL_KEY, userEmail);
  
  // Also save as session handle for backward compatibility
  userProperties.setProperty(SESSION_HANDLE_KEY, jwtToken);
  
  console.log('Auth token and refresh token saved for user:', userEmail);
}

/**
 * Clear the stored session handle and cached tokens.
 */
function clearSessionHandle() {
  const userProperties = PropertiesService.getUserProperties();
  userProperties.deleteProperty(SESSION_HANDLE_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_KEY);
  userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
  userProperties.deleteProperty(REFRESH_TOKEN_KEY);
  userProperties.deleteProperty(INSTALLATION_TOKEN_KEY);
  userProperties.deleteProperty(USER_EMAIL_KEY);
  
  console.log('Session cleared (including refresh token)');
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
    const payload = decodeJwtPayload(installationToken) || {};
    const exp = payload.exp ? payload.exp * 1000 : null;
    const now = Date.now();

    // Installation token is valid if:
    // - It has an exp claim AND current time is before expiration (with 5 minute safety buffer)
    // - OR it has no exp claim (assume it's valid - installation tokens last 365 days)
    const isValid = !exp || now < (exp - 5 * 60 * 1000); // 5 minute buffer before actual expiry

    if (isValid) {
      console.log('✅ Using installation token (long-lived, 365-day validity)');
      console.log('Token expires in:', exp ? Math.floor((exp - now) / (1000 * 60 * 60 * 24)) + ' days' : 'N/A');
      
      // Cache user email if available
      if (payload.email) {
        userProperties.setProperty(USER_EMAIL_KEY, payload.email);
      }
      
      // Always return installation token - it's designed to work for a full year
      return installationToken;
    } else {
      console.warn('⚠️ Installation token has expired (after 365 days). User needs to get a new one from Settings.');
      console.warn('Token expired:', new Date(exp).toISOString());
      console.warn('Current time:', new Date(now).toISOString());
      // Don't delete it - user might want to see the error and get a new one
    }
  }

  // PRIORITY 2: Check for cached short-lived access token
  const cachedToken = userProperties.getProperty(CACHED_TOKEN_KEY);
  const expiresAt = userProperties.getProperty(CACHED_TOKEN_EXPIRES_KEY);

  if (cachedToken && expiresAt) {
    const now = Date.now();
    if (now < parseInt(expiresAt, 10)) {
      console.log('✅ Using cached short-lived access token (still valid)');
      return cachedToken;
    }

    // Cached token expired - try to refresh
    console.log('Cached token expired - attempting refresh');
    const refreshToken = userProperties.getProperty(REFRESH_TOKEN_KEY);
    if (refreshToken && refreshToken.length > 20) {
      console.log('Attempting to refresh using stored refresh token...');
      const newToken = refreshAccessToken(refreshToken);
      if (newToken) {
        console.log('✅ Token refreshed successfully');
        return newToken;
      }
    }

    // Clear expired cached token
    userProperties.deleteProperty(CACHED_TOKEN_KEY);
    userProperties.deleteProperty(CACHED_TOKEN_EXPIRES_KEY);
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
    // Tokens available
    const accessToken = getAccessToken();
    const installationToken = PropertiesService.getUserProperties().getProperty(INSTALLATION_TOKEN_KEY);
    console.log('Token availability — access:', !!accessToken, 'installation:', !!installationToken);
    
    const url = BACKEND_API_URL + endpoint;

    // Prefer installation token first (long-lived), then fallback to access token
    const tokensToTry = [];
    if (installationToken) tokensToTry.push(installationToken);
    if (accessToken && accessToken !== installationToken) tokensToTry.push(accessToken);

    // Ensure we try at least one (empty string triggers 401 for clearer error path)
    if (tokensToTry.length === 0) tokensToTry.push('');

    let lastErrorPayload = null;
    for (let i = 0; i < tokensToTry.length; i++) {
      const token = tokensToTry[i];
      const requestOptions = {
        method: options.method || 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
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

      console.log('Making request to:', url, 'with token type:', token && token.startsWith('eyJ') ? 'JWT' : token ? 'other' : 'none');
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
      // Backend returned non-JSON (likely HTML error page or plain text)
      console.error('Failed to parse JSON response:', responseText);
      
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
        return responseData;
      }

      // If unauthorized and we have another token to try, continue loop
      if (statusCode === 401 && i < tokensToTry.length - 1) {
        console.warn('Request unauthorized with current token. Retrying with fallback token...');
        lastErrorPayload = { status: statusCode, message: responseData.error || responseData.message, raw: responseText };
        continue;
      }

      console.error('API request failed:', statusCode, responseData);
      const payload = {
        status: statusCode,
        message: responseData.error || responseData.message || 'Unknown error',
        raw: typeof responseText === 'string' ? responseText.substring(0, 1000) : ''
      };
      throw new Error('API_ERROR::' + JSON.stringify(payload));
    }

    // If we exhausted retries, throw last captured 401
    if (lastErrorPayload) {
      throw new Error('API_ERROR::' + JSON.stringify(lastErrorPayload));
    }
    
    // Fallback generic error
    throw new Error('API_ERROR::' + JSON.stringify({ status: 401, message: 'Authentication required' }));
    
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

