/**
 * Type definitions for the Gmail Add-on
 */

// Gmail Add-on Event types
export interface GmailEvent {
  messageMetadata?: {
    accessToken: string;
    messageId: string;
  };
  gmail?: {
    accessToken: string;
    messageId: string;
  };
}

// Parsed email data
export interface ParsedEmail {
  messageId: string;
  threadId: string;
  internalDate: string;
  subject: string;
  from: string;
  bodyText: string;
  links: string[];
}

// Parsed job application fields
export interface ParsedApplication {
  company: string;
  jobTitle: string;
  jobUrl: string | null;
  source: string;
  status: string;
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

// Config stored in Script Properties
export interface AppConfig {
  VERCEL_API_URL: string;
  JOBMAIL_API_KEY: string;
  DASHBOARD_URL: string;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Application {
  id: string;
  messageId: string;
  threadId: string;
  company: string;
  jobTitle: string;
  jobUrl: string | null;
  source: string;
  status: string;
  appliedAt: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

