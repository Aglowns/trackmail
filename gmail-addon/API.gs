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

