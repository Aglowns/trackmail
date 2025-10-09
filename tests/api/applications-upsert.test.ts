/**
 * Tests for POST /api/applications/upsert
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/applications/upsert/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

describe('POST /api/applications/upsert', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockApplication = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    threadId: 'thread_123',
    lastEmailId: 'email_123',
    company: 'Test Company',
    title: 'Software Engineer',
    jobUrl: 'https://example.com/job',
    appliedAt: new Date('2025-01-01'),
    status: 'APPLIED',
    source: 'GMAIL',
    confidence: 'HIGH',
    atsVendor: 'greenhouse',
    companyDomain: 'example.com',
    rawSubject: 'Job Application Received',
    rawSnippet: 'Thank you for applying...',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  it('should create new application with Bearer token', async () => {
    // Mock Prisma calls
    vi.mocked(prisma.inboxMessage.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.application.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.application.create).mockResolvedValue(mockApplication as any)
    vi.mocked(prisma.event.create).mockResolvedValue({} as any)
    vi.mocked(prisma.inboxMessage.upsert).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/applications/upsert', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId: 'thread_123',
        lastEmailId: 'email_123',
        company: 'Test Company',
        title: 'Software Engineer',
        status: 'APPLIED',
        source: 'GMAIL',
        confidence: 'HIGH',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.isNew).toBe(true)
    expect(data.company).toBe('Test Company')
  })

  it('should return 401 without Bearer token', async () => {
    const request = new NextRequest('http://localhost:3000/api/applications/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    
    expect(response.status).toBe(401)
  })

  it('should be idempotent with same threadId and lastEmailId', async () => {
    // Mock existing application
    vi.mocked(prisma.application.findUnique).mockResolvedValue(mockApplication as any)

    const request = new NextRequest('http://localhost:3000/api/applications/upsert', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId: 'thread_123',
        lastEmailId: 'email_123',
        company: 'Test Company',
        title: 'Software Engineer',
        status: 'APPLIED',
        source: 'GMAIL',
        confidence: 'HIGH',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isNew).toBe(false)
    expect(vi.mocked(prisma.application.update)).not.toHaveBeenCalled()
  })

  it('should update application with new lastEmailId', async () => {
    const existingApp = { ...mockApplication, lastEmailId: 'email_old' }
    vi.mocked(prisma.application.findUnique).mockResolvedValue(existingApp as any)
    vi.mocked(prisma.application.update).mockResolvedValue({
      ...mockApplication,
      lastEmailId: 'email_new',
    } as any)
    vi.mocked(prisma.event.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost:3000/api/applications/upsert', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threadId: 'thread_123',
        lastEmailId: 'email_new',
        company: 'Test Company',
        title: 'Software Engineer',
        status: 'APPLIED',
        source: 'GMAIL',
        confidence: 'HIGH',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isNew).toBe(false)
    expect(vi.mocked(prisma.application.update)).toHaveBeenCalled()
  })

  it('should handle validation errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/applications/upsert', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required fields
        threadId: 'thread_123',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.code).toBe('VALIDATION_ERROR')
  })
})

