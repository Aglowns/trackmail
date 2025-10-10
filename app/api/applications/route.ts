/**
 * GET /api/applications
 * 
 * List applications with filtering, search, and pagination.
 * Auth: NextAuth session OR Bearer token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertBearerOrSession } from '@/lib/authz'
import { errorResponse, Errors } from '@/lib/errors'
import { ListApplicationsSchema } from '@/lib/validators'
import { Prisma } from '@prisma/client'

/**
 * Get or create a default user for API access
 */
async function getOrCreateDefaultUser() {
  const defaultUserEmail = 'demo@jobmail.local'
  
  // Try to find existing default user
  let user = await prisma.user.findUnique({
    where: { email: defaultUserEmail }
  })

  // Create default user if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultUserEmail,
        name: 'Demo User',
        emailVerified: new Date(),
      }
    })
  }

  return user
}

export async function GET(request: NextRequest) {
  try {
    // 1. Try to get authentication (allow both session and bearer)
    const auth = await assertBearerOrSession(request)
    
    // For now, allow access even without auth (will use default user)
    let userId = auth.userId
    if (!userId) {
      // Create or get default user for API access
      const defaultUser = await getOrCreateDefaultUser()
      userId = defaultUser.id
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = ListApplicationsSchema.parse({
      status: searchParams.get('status') || undefined,
      company: searchParams.get('company') || undefined,
      q: searchParams.get('q') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    // 3. Build database query with user context
    const where: Prisma.ApplicationWhereInput = {
      userId: userId, // Only show user's applications
    }

    // Apply filters
    if (params.status) {
      where.status = params.status as any
    }

    if (params.company) {
      where.company = {
        contains: params.company,
        mode: 'insensitive',
      }
    }

    if (params.q) {
      where.OR = [
        { company: { contains: params.q, mode: 'insensitive' } },
        { title: { contains: params.q, mode: 'insensitive' } },
        { rawSubject: { contains: params.q, mode: 'insensitive' } },
        { rawSnippet: { contains: params.q, mode: 'insensitive' } },
      ]
    }

    // Apply date filters
    if (params.dateFrom || params.dateTo) {
      where.appliedAt = {}
      if (params.dateFrom) {
        where.appliedAt.gte = new Date(params.dateFrom)
      }
      if (params.dateTo) {
        where.appliedAt.lte = new Date(params.dateTo)
      }
    }

    // Build orderBy
    const orderBy: Prisma.ApplicationOrderByWithRelationInput = {}
    orderBy[params.sortBy] = params.sortOrder

    // Execute query
    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      }),
      prisma.application.count({ where })
    ])

    const paginatedApplications = applications

    // 4. Format response
    return NextResponse.json({
      data: paginatedApplications,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: total,
        totalPages: Math.ceil(total / params.limit),
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return errorResponse(error)
  }
}

