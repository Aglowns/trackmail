/**
 * Tests for GET /api/applications
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/applications/route'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'

describe('GET /api/applications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockApplications = [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      threadId: 'thread_1',
      lastEmailId: 'email_1',
      company: 'Company A',
      title: 'Engineer',
      jobUrl: null,
      appliedAt: new Date('2025-01-01'),
      status: 'APPLIED',
      source: 'GMAIL',
      confidence: 'HIGH',
      atsVendor: null,
      companyDomain: null,
      rawSubject: null,
      rawSnippet: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '223e4567-e89b-12d3-a456-426614174000',
      threadId: 'thread_2',
      lastEmailId: 'email_2',
      company: 'Company B',
      title: 'Designer',
      jobUrl: null,
      appliedAt: new Date('2025-01-02'),
      status: 'INTERVIEWING',
      source: 'GMAIL',
      confidence: 'MEDIUM',
      atsVendor: null,
      companyDomain: null,
      rawSubject: null,
      rawSnippet: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  it('should list applications with Bearer token', async () => {
    vi.mocked(prisma.application.count).mockResolvedValue(2)
    vi.mocked(prisma.application.findMany).mockResolvedValue(mockApplications as any)

    const request = new NextRequest('http://localhost:3000/api/applications', {
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(2)
    expect(data.pagination.total).toBe(2)
  })

  it('should list applications with session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'test@example.com' },
      expires: '2025-12-31',
    } as any)
    vi.mocked(prisma.application.count).mockResolvedValue(2)
    vi.mocked(prisma.application.findMany).mockResolvedValue(mockApplications as any)

    const request = new NextRequest('http://localhost:3000/api/applications')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(2)
  })

  it('should filter by status', async () => {
    vi.mocked(prisma.application.count).mockResolvedValue(1)
    vi.mocked(prisma.application.findMany).mockResolvedValue([mockApplications[0]] as any)

    const request = new NextRequest('http://localhost:3000/api/applications?status=APPLIED', {
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toHaveLength(1)
    expect(vi.mocked(prisma.application.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'APPLIED' }),
      })
    )
  })

  it('should filter by company', async () => {
    vi.mocked(prisma.application.count).mockResolvedValue(1)
    vi.mocked(prisma.application.findMany).mockResolvedValue([mockApplications[0]] as any)

    const request = new NextRequest('http://localhost:3000/api/applications?company=Company%20A', {
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(vi.mocked(prisma.application.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          company: { contains: 'Company A', mode: 'insensitive' },
        }),
      })
    )
  })

  it('should search with q parameter', async () => {
    vi.mocked(prisma.application.count).mockResolvedValue(1)
    vi.mocked(prisma.application.findMany).mockResolvedValue([mockApplications[0]] as any)

    const request = new NextRequest('http://localhost:3000/api/applications?q=engineer', {
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(vi.mocked(prisma.application.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    )
  })

  it('should paginate results', async () => {
    vi.mocked(prisma.application.count).mockResolvedValue(50)
    vi.mocked(prisma.application.findMany).mockResolvedValue(mockApplications as any)

    const request = new NextRequest('http://localhost:3000/api/applications?page=2&limit=10', {
      headers: {
        'Authorization': 'Bearer test_api_key_12345',
      },
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.pagination.page).toBe(2)
    expect(data.pagination.limit).toBe(10)
    expect(data.pagination.totalPages).toBe(5)
    expect(vi.mocked(prisma.application.findMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
      })
    )
  })
})

