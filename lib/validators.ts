/**
 * Zod Validation Schemas
 * 
 * Input validation for all API endpoints using Zod.
 */

import { z } from 'zod'

// ============================================================================
// ENUMS (matching Prisma schema)
// ============================================================================

export const ApplicationStatusSchema = z.enum([
  'interested',
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
])

export const ApplicationSourceSchema = z.enum([
  'LinkedIn',
  'Greenhouse',
  'Indeed',
  'Email',
  'Glassdoor',
  'Workday',
  'GMAIL',
  'MANUAL'
])

export const ConfidenceLevelSchema = z.enum(['HIGH', 'MEDIUM', 'LOW'])

export const EventTypeSchema = z.enum([
  'EMAIL_PARSED',
  'APPLICATION_CREATED',
  'APPLICATION_UPDATED',
  'STATUS_CHANGED',
  'ERROR',
  'BATCH_PROCESSED',
])

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

/**
 * POST /api/applications/upsert
 */
export const UpsertApplicationSchema = z.object({
  threadId: z.string().min(1).max(255),
  lastEmailId: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  title: z.string().min(1).max(500),
  jobUrl: z.string().url().nullable().optional(),
  appliedAt: z.coerce.date().nullable().optional(),
  status: ApplicationStatusSchema,
  source: ApplicationSourceSchema,
  confidence: ConfidenceLevelSchema,
  atsVendor: z.string().max(100).nullable().optional(),
  companyDomain: z.string().max(255).nullable().optional(),
  rawSubject: z.string().nullable().optional(),
  rawSnippet: z.string().nullable().optional(),
  // Optional: messageId for deduplication
  messageId: z.string().max(255).nullable().optional(),
})

export type UpsertApplicationInput = z.infer<typeof UpsertApplicationSchema>

/**
 * GET /api/applications (query params)
 */
export const ListApplicationsSchema = z.object({
  status: z.string().optional().transform(val => val === 'all' ? undefined : val),
  company: z.string().optional(),
  q: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['appliedAt', 'updatedAt', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

export type ListApplicationsInput = z.infer<typeof ListApplicationsSchema>

/**
 * PATCH /api/applications/:id/status
 */
export const UpdateStatusSchema = z.object({
  status: ApplicationStatusSchema,
  notes: z.string().optional(),
})

export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>

/**
 * POST /api/events
 */
export const CreateEventSchema = z.object({
  applicationId: z.string().uuid().nullable().optional(),
  type: EventTypeSchema,
  metadata: z.record(z.any()).nullable().optional(),
  message: z.string().nullable().optional(),
})

export type CreateEventInput = z.infer<typeof CreateEventSchema>

// ============================================================================
// UTILITY VALIDATORS
// ============================================================================

/**
 * Validate UUID format
 */
export const UuidSchema = z.string().uuid()

/**
 * Validate Gmail thread ID format
 */
export const ThreadIdSchema = z.string().min(1).max(255)

