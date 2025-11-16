/**
 * Backend API Communication
 * 
 * This file contains functions for communicating with the JobMail backend API.
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
    console.log('Email data being sent:', JSON.stringify(emailData));
    
    const response = makeAuthenticatedRequest('/ingest/email', {
      method: 'post',
      payload: emailData  // Don't stringify here - let makeAuthenticatedRequest handle it
    });
    
    console.log('Ingest response:', JSON.stringify(response));
    
    // Ensure response has proper structure
    if (response && typeof response === 'object') {
      // Preserve the success property if it exists (may be false for non-job emails)
      // Only default to true if success is undefined
      if (response.success === undefined) {
        response.success = true;
      }
      return response;
    } else {
      // If response is not an object, wrap it
      return {
        success: true,
        message: 'Application tracked successfully',
        response: response
      };
    }
    
  } catch (error) {
    console.error('Error ingesting email:', error);

    // Try to extract structured API error if provided by makeAuthenticatedRequest
    let apiError = null;
    try {
      const msg = String(error && error.message ? error.message : '');
      if (msg.startsWith('API_ERROR::')) {
        apiError = JSON.parse(msg.substring('API_ERROR::'.length));
      }
    } catch (e) {
      // ignore parse errors
    }
    
    // Check if it's a timeout or connection error
    if (error.message.includes('timeout') || error.message.includes('connection') || error.message.includes('unavailable')) {
      return {
        success: false,
        message: 'Backend service is temporarily unavailable. Please try again in a few moments.',
        error_type: 'service_unavailable'
      };
    }
    
    // Check if it's an authentication error
    if (error.message.includes('Authentication') || error.message.includes('401')) {
      return {
        success: false,
        message: 'Authentication expired. Please sign in again.',
        error_type: 'auth_expired'
      };
    }
    
    // Check if it's a 403 Forbidden (limit exceeded) error
    if ((apiError && apiError.status === 403) || error.message.includes('403') || error.message.includes('limit_exceeded')) {
      // Try to extract limit_exceeded error details
      let limitError = null;
      
      // First, check if detail is already a structured object
      if (apiError && apiError.detail && typeof apiError.detail === 'object') {
        if (apiError.detail.error === 'limit_exceeded') {
          limitError = apiError.detail;
        }
      }
      
      // If not found, try parsing from raw response
      if (!limitError && apiError && apiError.raw) {
        try {
          const rawJson = JSON.parse(apiError.raw);
          if (rawJson.detail && typeof rawJson.detail === 'object' && rawJson.detail.error === 'limit_exceeded') {
            limitError = rawJson.detail;
          } else if (rawJson.detail && typeof rawJson.detail === 'string') {
            // Try to parse detail string that might contain JSON
            try {
              const detailObj = JSON.parse(rawJson.detail);
              if (detailObj.error === 'limit_exceeded') {
                limitError = detailObj;
              }
            } catch (e) {
              // Check if detail string contains limit_exceeded info
              if (rawJson.detail.includes('limit_exceeded')) {
                // Try to extract structured data from string representation
                const errorMatch = rawJson.detail.match(/\{'error':\s*'limit_exceeded'[^}]*\}/);
                if (errorMatch) {
                  try {
                    // Convert Python dict format to JSON
                    const jsonStr = errorMatch[0].replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false');
                    limitError = JSON.parse(jsonStr);
                  } catch (e2) {
                    // Fallback: extract fields using regex
                    limitError = {
                      error: 'limit_exceeded',
                      message: rawJson.detail.match(/message['"]:\s*['"]([^'"]+)['"]/)?.[1] || "You've reached your application limit",
                      upgrade_required: true,
                      current_count: parseInt(rawJson.detail.match(/current_count['"]:\s*(\d+)/)?.[1] || '25'),
                      limit: parseInt(rawJson.detail.match(/limit['"]:\s*(\d+)/)?.[1] || '25')
                    };
                  }
                }
              }
            }
          }
        } catch (e) {
          // If parsing fails, check error message for limit_exceeded
          if (error.message.includes('limit_exceeded')) {
            const msg = error.message;
            limitError = {
              error: 'limit_exceeded',
              message: msg.match(/message['"]:\s*['"]([^'"]+)['"]/)?.[1] || "You've reached your application limit",
              upgrade_required: true,
              current_count: parseInt(msg.match(/current_count['"]:\s*(\d+)/)?.[1] || '25'),
              limit: parseInt(msg.match(/limit['"]:\s*(\d+)/)?.[1] || '25')
            };
          }
        }
      }
      
      if (limitError) {
        return {
          success: false,
          error: 'limit_exceeded',
          error_type: 'limit_exceeded',
          detail: limitError,
          message: limitError.message || "You've reached your application limit"
        };
      }
      
      // Regular 403 error
      return {
        success: false,
        message: apiError ? (apiError.message || 'Access forbidden') : 'Access forbidden',
        error_type: 'forbidden',
        detail: apiError ? (apiError.detail || apiError.raw) : error.message
      };
    }
    
    // Check if it's a 500 server error
    if ((apiError && apiError.status === 500) || error.message.includes('500') || error.message.includes('Server error')) {
      // Extract the actual backend error message from the raw response
      let backendErrorMessage = 'Server error occurred. Please try again in a few moments.';
      
      if (apiError && apiError.raw) {
        try {
          // Try to parse the raw response as JSON
          const rawJson = JSON.parse(apiError.raw);
          if (rawJson.detail) {
            backendErrorMessage = rawJson.detail;
          }
        } catch (e) {
          // If not JSON, check if it's a plain error message
          if (apiError.raw.length < 500) {
            backendErrorMessage = apiError.raw;
          }
        }
      } else if (apiError && apiError.message) {
        backendErrorMessage = apiError.message;
      }
      
      return {
        success: false,
        message: backendErrorMessage,
        error_type: 'server_error',
        detail: apiError ? (apiError.detail || apiError.message) : error.message,
        raw_response: apiError ? apiError.raw : undefined
      };
    }
    
    return {
      success: false,
      message: apiError ? apiError.message : (error.message || 'Failed to ingest email'),
      error_type: 'general_error',
      detail: apiError ? (apiError.detail || apiError.raw) : error.message,
      raw_response: apiError ? apiError.raw : undefined
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
    console.log('Email data being sent:', JSON.stringify(emailData));
    
    const response = makeAuthenticatedRequest('/ingest/email/test', {
      method: 'post',
      payload: emailData  // Don't stringify here - let makeAuthenticatedRequest handle it
    });
    
    console.log('Test response:', JSON.stringify(response));
    return response;
    
  } catch (error) {
    console.error('Error testing email parsing:', error);
    
    // If backend fails, try local parsing as fallback
    console.log('Backend parsing failed, trying local parsing...');
    try {
      const localResult = quickEmailParsing(
        emailData.html_body || '', 
        emailData.subject || '', 
        emailData.sender || ''
      );
      
      return {
        success: true,
        parsed: localResult,
        message: 'Parsed locally (backend unavailable)',
        method: 'Local_Fallback'
      };
    } catch (localError) {
      console.error('Local parsing also failed:', localError);
    }
    
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
      payload: applicationData  // Don't stringify here
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
      payload: updateData  // Don't stringify here
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
        payload: eventData  // Don't stringify here
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

/**
 * Check subscription status for the current user.
 * Uses caching to avoid repeated API calls (cached for 5 minutes).
 * 
 * @return {Object} Subscription status with plan details and features
 */
function checkSubscriptionStatus() {
  const CACHE_KEY = 'subscription_status_cache';
  const CACHE_EXPIRY_KEY = 'subscription_status_cache_expiry';
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  
  try {
    const userProperties = PropertiesService.getUserProperties();
    const cached = userProperties.getProperty(CACHE_KEY);
    const cacheExpiry = userProperties.getProperty(CACHE_EXPIRY_KEY);
    
    // Return cached data if still valid
    if (cached && cacheExpiry) {
      const now = Date.now();
      const expiry = parseInt(cacheExpiry);
      if (now < expiry) {
        console.log('✅ Using cached subscription status');
        return JSON.parse(cached);
      }
    }
    
    console.log('Fetching fresh subscription status...');
    
    const response = makeAuthenticatedRequest('/subscription/status', {
      method: 'get'
    });
    
    // Cache the response
    if (response && !response.error) {
      userProperties.setProperty(CACHE_KEY, JSON.stringify(response));
      userProperties.setProperty(CACHE_EXPIRY_KEY, String(Date.now() + CACHE_DURATION_MS));
      console.log('✅ Cached subscription status for 5 minutes');
    }
    
    console.log('Subscription status:', JSON.stringify(response));
    return response;
    
  } catch (error) {
    console.error('Error checking subscription status:', error);
    
    // Try to return cached data even if expired (better than nothing)
    try {
      const userProperties = PropertiesService.getUserProperties();
      const cached = userProperties.getProperty(CACHE_KEY);
      if (cached) {
        console.log('⚠️ Using expired cache due to error');
        return JSON.parse(cached);
      }
    } catch (e) {
      // Ignore cache errors
    }
    
    // Return default free tier on error
    return {
      plan: 'free',
      features: {
        max_applications: 25,
        auto_tracking: false,
        unlimited_applications: false,
        advanced_analytics: false,
        export_data: false
      },
      error: error.message || 'Failed to check subscription status'
    };
  }
}

/**
 * Test function to debug API calls
 * This can be called manually to test the backend integration
 */
function testBackendConnection() {
  console.log('Testing backend connection...');
  
  // Test health endpoint
  const health = checkBackendHealth();
  console.log('Health check:', health);
  
  // Test authentication
  const token = getAccessToken();
  console.log('Access token available:', !!token);
  
  return {
    health: health,
    authenticated: !!token
  };
}

