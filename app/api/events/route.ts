/**
 * POST /api/events
 * 
 * Manual event logging endpoint for debugging and auditing.
 * Auth: Bearer token OR NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertBearerOrSession } from '@/lib/authz'
import { errorResponse, Errors } from '@/lib/errors'
import { CreateEventSchema } from '@/lib/validators'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate request
    const auth = await assertBearerOrSession(request)
    if (!auth.authenticated) {
      throw Errors.Unauthorized()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const data = CreateEventSchema.parse(body)

    // 3. Validate applicationId if provided
    if (data.applicationId) {
      const application = await prisma.application.findUnique({
        where: { id: data.applicationId },
      })

      if (!application) {
        throw Errors.NotFound('Application')
      }
    }

    // 4. Create event
    const event = await prisma.event.create({
      data: {
        applicationId: data.applicationId,
        type: data.type,
        message: data.message,
        metadata: data.metadata as any,
      },
    })

    // 5. Return response
    return NextResponse.json(
      {
        id: event.id,
        type: event.type,
        createdAt: event.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}

