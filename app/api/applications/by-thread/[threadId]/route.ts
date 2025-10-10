/**
 * GET /api/applications/by-thread/:threadId
 * 
 * Get single application by Gmail thread ID with related events.
 * Auth: NextAuth session OR Bearer token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertBearerOrSession } from '@/lib/authz'
import { errorResponse, Errors } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  try {
    // 1. Authenticate request
    const auth = await assertBearerOrSession(request)
    if (!auth.authenticated) {
      throw Errors.Unauthorized()
    }

    // 2. Fetch application with events (using compound unique key)
    const application = await prisma.application.findFirst({
      where: { 
        threadId: params.threadId,
        userId: auth.userId
      },
      include: {
        events: {
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit to last 50 events
        },
      },
    })

    if (!application) {
      throw Errors.NotFound('Application')
    }

    // 3. Format response
    return NextResponse.json({
      id: application.id,
      threadId: application.threadId,
      lastEmailId: application.lastEmailId,
      company: application.company,
      title: application.title,
      jobUrl: application.jobUrl,
      appliedAt: application.appliedAt?.toISOString() || null,
      status: application.status,
      source: application.source,
      confidence: application.confidence,
      atsVendor: application.atsVendor,
      companyDomain: application.companyDomain,
      rawSubject: application.rawSubject,
      rawSnippet: application.rawSnippet,
      createdAt: application.createdAt.toISOString(),
      updatedAt: application.updatedAt.toISOString(),
      events: application.events.map((event) => ({
        id: event.id,
        type: event.type,
        message: event.message,
        metadata: event.metadata,
        createdAt: event.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

