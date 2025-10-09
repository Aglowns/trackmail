/**
 * API client for Vercel backend
 */

import { AppConfig, ApiResponse, Application } from './types';

/**
 * Get configuration from Script Properties
 */
export function getConfig(): AppConfig | null {
  try {
    const props = PropertiesService.getScriptProperties();
    const apiUrl = props.getProperty('VERCEL_API_URL');
    const apiKey = props.getProperty('JOBMAIL_API_KEY');
    const dashboardUrl = props.getProperty('DASHBOARD_URL');
    
    if (!apiUrl || !apiKey) {
      console.error('Missing required configuration: VERCEL_API_URL or JOBMAIL_API_KEY');
      return null;
    }
    
    return {
      VERCEL_API_URL: apiUrl,
      JOBMAIL_API_KEY: apiKey,
      DASHBOARD_URL: dashboardUrl || apiUrl,
    };
  } catch (error) {
    console.error('Error getting config:', error);
    return null;
  }
}

/**
 * Save configuration to Script Properties
 */
export function saveConfig(config: Partial<AppConfig>): boolean {
  try {
    const props = PropertiesService.getScriptProperties();
    
    if (config.VERCEL_API_URL) {
      props.setProperty('VERCEL_API_URL', config.VERCEL_API_URL);
    }
    if (config.JOBMAIL_API_KEY) {
      props.setProperty('JOBMAIL_API_KEY', config.JOBMAIL_API_KEY);
    }
    if (config.DASHBOARD_URL) {
      props.setProperty('DASHBOARD_URL', config.DASHBOARD_URL);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
}

/**
 * Make authenticated request to Vercel API
 */
function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any,
  idempotencyKey?: string
): ApiResponse<T> {
  const config = getConfig();
  if (!config) {
    return { success: false, error: 'Configuration not set. Please configure API settings.' };
  }
  
  const url = `${config.VERCEL_API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${config.JOBMAIL_API_KEY}`,
    'Content-Type': 'application/json',
  };
  
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: method.toLowerCase() as any,
    headers: headers,
    muteHttpExceptions: true,
  };
  
  if (data && (method === 'POST' || method === 'PUT')) {
    options.payload = JSON.stringify(data);
  }
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const code = response.getResponseCode();
    const contentText = response.getContentText();
    
    if (code >= 200 && code < 300) {
      try {
        const json = JSON.parse(contentText);
        return { success: true, data: json };
      } catch (e) {
        return { success: true, data: contentText as any };
      }
    } else {
      let errorMsg = `API error (${code})`;
      try {
        const errorJson = JSON.parse(contentText);
        errorMsg = errorJson.error || errorJson.message || errorMsg;
      } catch (e) {
        errorMsg = contentText || errorMsg;
      }
      
      console.error('API request failed:', method, endpoint, code, errorMsg);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: `Network error: ${error.toString()}` };
  }
}

/**
 * Upsert job application
 */
export function upsertApplication(data: {
  messageId: string;
  threadId: string;
  company: string;
  jobTitle: string;
  jobUrl?: string | null;
  source?: string;
  status?: string;
  appliedAt?: string;
}): ApiResponse<Application> {
  return apiRequest<Application>(
    'POST',
    '/api/applications/upsert',
    data,
    data.messageId // Use messageId as idempotency key
  );
}

/**
 * List all applications
 */
export function listApplications(params?: {
  status?: string;
  source?: string;
  limit?: number;
}): ApiResponse<Application[]> {
  let endpoint = '/api/applications';
  
  if (params) {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('status', params.status);
    if (params.source) queryParams.append('source', params.source);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    
    const queryString = queryParams.toString();
    if (queryString) {
      endpoint += '?' + queryString;
    }
  }
  
  return apiRequest<Application[]>('GET', endpoint);
}

/**
 * Get application by thread ID
 */
export function getApplicationByThread(threadId: string): ApiResponse<Application> {
  return apiRequest<Application>('GET', `/api/applications/by-thread/${threadId}`);
}

/**
 * Update application status
 */
export function updateApplicationStatus(
  applicationId: string,
  status: string
): ApiResponse<Application> {
  return apiRequest<Application>(
    'PUT',
    `/api/applications/${applicationId}/status`,
    { status }
  );
}

/**
 * Test API connection
 */
export function testApiConnection(): ApiResponse<any> {
  return apiRequest('GET', '/api/health');
}

/**
 * URLSearchParams polyfill for Apps Script
 */
class URLSearchParams {
  private params: Record<string, string> = {};
  
  append(key: string, value: string): void {
    this.params[key] = value;
  }
  
  toString(): string {
    return Object.keys(this.params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(this.params[key])}`)
      .join('&');
  }
}

