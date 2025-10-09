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

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate request
    const auth = await assertBearerOrSession(request)
    if (!auth.authenticated) {
      throw Errors.Unauthorized()
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const params = ListApplicationsSchema.parse({
      status: searchParams.get('status'),
      company: searchParams.get('company'),
      q: searchParams.get('q'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    })

    // 3. Build where clause
    const where: Prisma.ApplicationWhereInput = {}

    // Filter by status
    if (params.status) {
      where.status = params.status
    }

    // Filter by company (case-insensitive partial match)
    if (params.company) {
      where.company = {
        contains: params.company,
        mode: 'insensitive',
      }
    }

    // Full-text search (q parameter)
    if (params.q) {
      where.OR = [
        {
          company: {
            contains: params.q,
            mode: 'insensitive',
          },
        },
        {
          title: {
            contains: params.q,
            mode: 'insensitive',
          },
        },
        {
          rawSubject: {
            contains: params.q,
            mode: 'insensitive',
          },
        },
        {
          rawSnippet: {
            contains: params.q,
            mode: 'insensitive',
          },
        },
      ]
    }

    // Date range filter
    if (params.dateFrom || params.dateTo) {
      where.appliedAt = {}
      if (params.dateFrom) {
        where.appliedAt.gte = params.dateFrom
      }
      if (params.dateTo) {
        where.appliedAt.lte = params.dateTo
      }
    }

    // 4. Count total results
    const total = await prisma.application.count({ where })

    // 5. Calculate pagination
    const skip = (params.page - 1) * params.limit
    const totalPages = Math.ceil(total / params.limit)

    // 6. Fetch applications
    const applications = await prisma.application.findMany({
      where,
      skip,
      take: params.limit,
      orderBy: {
        [params.sortBy]: params.sortOrder,
      },
    })

    // 7. Format response
    return NextResponse.json({
      data: applications.map((app) => ({
        id: app.id,
        threadId: app.threadId,
        lastEmailId: app.lastEmailId,
        company: app.company,
        title: app.title,
        jobUrl: app.jobUrl,
        appliedAt: app.appliedAt?.toISOString() || null,
        status: app.status,
        source: app.source,
        confidence: app.confidence,
        atsVendor: app.atsVendor,
        companyDomain: app.companyDomain,
        rawSubject: app.rawSubject,
        rawSnippet: app.rawSnippet,
        createdAt: app.createdAt.toISOString(),
        updatedAt: app.updatedAt.toISOString(),
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

