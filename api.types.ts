/**
 * JobMail API Types & Contracts
 * 
 * Complete TypeScript definitions for all API endpoints.
 * Use these types in both Next.js API routes and Apps Script client.
 * 
 * Version: 1.0
 * Last Updated: October 8, 2025
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export enum ApplicationStatus {
  NEW = "new",
  APPLIED = "applied",
  INTERVIEWING = "interviewing",
  OFFERED = "offered",
  REJECTED = "rejected",
  WITHDRAWN = "withdrawn",
}

export enum ApplicationSource {
  GMAIL = "gmail",
  MANUAL = "manual",
}

export enum ConfidenceLevel {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum EventType {
  EMAIL_PARSED = "email_parsed",
  APPLICATION_CREATED = "application_created",
  APPLICATION_UPDATED = "application_updated",
  STATUS_CHANGED = "status_changed",
  ERROR = "error",
  BATCH_PROCESSED = "batch_processed",
}

export enum ATSVendor {
  GREENHOUSE = "greenhouse",
  LEVER = "lever",
  WORKDAY = "workday",
  TALEO = "taleo",
  ICIMS = "icims",
  JOBVITE = "jobvite",
  ASHBY = "ashby",
  UNKNOWN = "unknown",
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * POST /api/applications/upsert
 * 
 * Idempotent upsert for applications. Uses threadId as unique key.
 * If application exists, updates only if lastEmailId is newer.
 */
export interface UpsertApplicationRequest {
  /** Gmail thread ID (unique identifier) */
  threadId: string;
  
  /** Latest email ID in the thread */
  lastEmailId: string;
  
  /** Company name (required) */
  company: string;
  
  /** Job title (required) */
  title: string;
  
  /** URL to job posting (optional) */
  jobUrl?: string | null;
  
  /** Date when user applied (ISO 8601) */
  appliedAt?: Date | string | null;
  
  /** Application status */
  status: ApplicationStatus;
  
  /** Source of the application data */
  source: ApplicationSource;
  
  /** Parser confidence in extracted data */
  confidence: ConfidenceLevel;
  
  /** Detected ATS vendor (if any) */
  atsVendor?: ATSVendor | string | null;
  
  /** Company domain extracted from email */
  companyDomain?: string | null;
  
  /** Raw email subject line */
  rawSubject?: string | null;
  
  /** Raw email snippet (first 200 chars) */
  rawSnippet?: string | null;
}

/**
 * GET /api/applications
 * 
 * Query parameters for listing applications with filters.
 */
export interface ListApplicationsQuery {
  /** Filter by status */
  status?: ApplicationStatus;
  
  /** Filter by company (partial match, case-insensitive) */
  company?: string;
  
  /** Full-text search across title, company, snippet */
  q?: string;
  
  /** Filter applications applied after this date (ISO 8601) */
  dateFrom?: string;
  
  /** Filter applications applied before this date (ISO 8601) */
  dateTo?: string;
  
  /** Page number (1-indexed) */
  page?: number;
  
  /** Results per page (max 100) */
  limit?: number;
  
  /** Sort field */
  sortBy?: "appliedAt" | "updatedAt" | "createdAt";
  
  /** Sort direction */
  sortOrder?: "asc" | "desc";
}

/**
 * PATCH /api/applications/:id/status
 * 
 * Update application status with optional note.
 */
export interface UpdateStatusRequest {
  /** New status */
  status: ApplicationStatus;
  
  /** Optional note for audit trail */
  notes?: string;
}

/**
 * POST /api/events (optional, for debugging)
 * 
 * Manual event logging endpoint.
 */
export interface CreateEventRequest {
  /** Optional link to application */
  applicationId?: string;
  
  /** Event type */
  type: EventType;
  
  /** Arbitrary JSON metadata */
  metadata?: Record<string, any>;
  
  /** Human-readable message */
  message?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Application entity (full details)
 */
export interface Application {
  /** UUID primary key */
  id: string;
  
  /** Gmail thread ID (unique) */
  threadId: string;
  
  /** Latest email ID processed */
  lastEmailId: string;
  
  /** Company name */
  company: string;
  
  /** Job title */
  title: string;
  
  /** Job posting URL */
  jobUrl: string | null;
  
  /** Date applied (ISO 8601) */
  appliedAt: string | null;
  
  /** Current status */
  status: ApplicationStatus;
  
  /** Data source */
  source: ApplicationSource;
  
  /** Parser confidence */
  confidence: ConfidenceLevel;
  
  /** ATS vendor */
  atsVendor: string | null;
  
  /** Company domain */
  companyDomain: string | null;
  
  /** Email subject line */
  rawSubject: string | null;
  
  /** Email snippet */
  rawSnippet: string | null;
  
  /** Record creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Record last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * Event entity (audit log entry)
 */
export interface Event {
  /** UUID primary key */
  id: string;
  
  /** Linked application ID (optional) */
  applicationId: string | null;
  
  /** Event type */
  type: EventType;
  
  /** JSON metadata */
  metadata: Record<string, any> | null;
  
  /** Human-readable message */
  message: string | null;
  
  /** Event timestamp (ISO 8601) */
  createdAt: string;
}

/**
 * InboxMessage entity (deduplication record)
 */
export interface InboxMessage {
  /** UUID primary key */
  id: string;
  
  /** Gmail message ID (unique) */
  messageId: string;
  
  /** Linked application ID (optional) */
  applicationId: string | null;
  
  /** Processing timestamp (ISO 8601) */
  processedAt: string;
}

/**
 * POST /api/applications/upsert - Response
 */
export interface UpsertApplicationResponse {
  /** Application UUID */
  id: string;
  
  /** Gmail thread ID */
  threadId: string;
  
  /** Company name */
  company: string;
  
  /** Job title */
  title: string;
  
  /** Current status */
  status: ApplicationStatus;
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
  
  /** True if newly created, false if updated */
  isNew: boolean;
}

/**
 * GET /api/applications - Response
 */
export interface ListApplicationsResponse {
  /** Array of applications */
  data: Application[];
  
  /** Pagination metadata */
  pagination: {
    /** Current page (1-indexed) */
    page: number;
    
    /** Results per page */
    limit: number;
    
    /** Total matching records */
    total: number;
    
    /** Total pages */
    totalPages: number;
  };
}

/**
 * GET /api/applications/by-thread/:threadId - Response
 */
export interface GetApplicationByThreadResponse extends Application {
  /** Related events for this application */
  events: Event[];
}

/**
 * PATCH /api/applications/:id/status - Response
 */
export interface UpdateStatusResponse {
  /** Application UUID */
  id: string;
  
  /** New status */
  status: ApplicationStatus;
  
  /** Update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * POST /api/events - Response
 */
export interface CreateEventResponse {
  /** Event UUID */
  id: string;
  
  /** Event type */
  type: EventType;
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponse {
  /** Error message */
  error: string;
  
  /** Machine-readable error code */
  code: string;
  
  /** Additional error details */
  details?: Record<string, any>;
}

/**
 * Common error codes
 */
export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_API_KEY = "INVALID_API_KEY",
  MISSING_AUTH_HEADER = "MISSING_AUTH_HEADER",
  
  // Request errors
  BAD_REQUEST = "BAD_REQUEST",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_FIELD_VALUE = "INVALID_FIELD_VALUE",
  
  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  DUPLICATE_REQUEST = "DUPLICATE_REQUEST",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  
  // Server errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
}

// ============================================================================
// HEADER TYPES
// ============================================================================

/**
 * Required headers for Gmail Add-on requests
 */
export interface GmailAddonHeaders {
  /** Bearer token for authentication */
  Authorization: `Bearer ${string}`;
  
  /** Custom source identifier */
  "X-JobMail-Source": "gmail-addon";
  
  /** Idempotency key (Gmail messageId) */
  "Idempotency-Key": string;
  
  /** Content type */
  "Content-Type": "application/json";
}

/**
 * Optional headers for debugging
 */
export interface DebugHeaders {
  /** Request ID for tracing */
  "X-Request-ID"?: string;
  
  /** Client version */
  "X-Client-Version"?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Pagination helper type
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Date range filter helper
 */
export interface DateRange {
  from?: string; // ISO 8601
  to?: string;   // ISO 8601
}

/**
 * Sort options helper
 */
export interface SortOptions {
  sortBy: "appliedAt" | "updatedAt" | "createdAt";
  sortOrder: "asc" | "desc";
}

// ============================================================================
// TYPE GUARDS & VALIDATORS
// ============================================================================

/**
 * Check if value is valid ApplicationStatus
 */
export function isApplicationStatus(value: any): value is ApplicationStatus {
  return Object.values(ApplicationStatus).includes(value);
}

/**
 * Check if value is valid ConfidenceLevel
 */
export function isConfidenceLevel(value: any): value is ConfidenceLevel {
  return Object.values(ConfidenceLevel).includes(value);
}

/**
 * Check if value is valid EventType
 */
export function isEventType(value: any): value is EventType {
  return Object.values(EventType).includes(value);
}

/**
 * Validate UpsertApplicationRequest
 */
export function validateUpsertRequest(data: any): data is UpsertApplicationRequest {
  return (
    typeof data === "object" &&
    typeof data.threadId === "string" &&
    typeof data.lastEmailId === "string" &&
    typeof data.company === "string" &&
    typeof data.title === "string" &&
    isApplicationStatus(data.status) &&
    isConfidenceLevel(data.confidence)
  );
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * API version
 */
export const API_VERSION = "1.0.0";

/**
 * Default pagination limits
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Rate limits (requests per minute)
 */
export const RATE_LIMITS = {
  GMAIL_ADDON: 100,
  WEB_DASHBOARD: 1000,
  GLOBAL: 10000,
} as const;

/**
 * Idempotency key cache TTL (milliseconds)
 */
export const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

