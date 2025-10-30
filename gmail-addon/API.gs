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
    console.log('Email data being sent:', JSON.stringify(emailData));
    
    const response = makeAuthenticatedRequest('/ingest/email', {
      method: 'post',
      payload: emailData  // Don't stringify here - let makeAuthenticatedRequest handle it
    });
    
    console.log('Ingest response:', JSON.stringify(response));
    
    // Ensure response has proper structure
    if (response && typeof response === 'object') {
      // If response doesn't have success property, add it
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
    
    // Check if it's a 500 server error
    if (error.message.includes('500') || error.message.includes('Server error')) {
      return {
        success: false,
        message: 'Server error occurred. Please try again in a few moments. If this persists, contact support.',
        error_type: 'server_error'
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to ingest email',
      error_type: 'general_error'
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

