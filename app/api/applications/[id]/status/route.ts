/**
 * PATCH /api/applications/:id/status
 * 
 * Update application status with audit logging.
 * Auth: NextAuth session OR Bearer token
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertBearerOrSession } from '@/lib/authz'
import { errorResponse, Errors } from '@/lib/errors'
import { UpdateStatusSchema } from '@/lib/validators'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate request
    const auth = await assertBearerOrSession(request)
    if (!auth.authenticated) {
      throw Errors.Unauthorized()
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const data = UpdateStatusSchema.parse(body)

    // 3. Fetch existing application
    const existing = await prisma.application.findUnique({
      where: { id: params.id },
    })

    if (!existing) {
      throw Errors.NotFound('Application')
    }

    // 4. Update status
    const application = await prisma.application.update({
      where: { id: params.id },
      data: { status: data.status },
    })

    // 5. Log status change event
    await prisma.event.create({
      data: {
        applicationId: application.id,
        type: 'STATUS_CHANGED',
        message: data.notes || `Status changed from ${existing.status} to ${data.status}`,
        metadata: {
          oldStatus: existing.status,
          newStatus: data.status,
          changedBy: auth.userId || 'api',
          source: auth.source,
        },
      },
    })

    // 6. Return response
    return NextResponse.json({
      id: application.id,
      status: application.status,
      updatedAt: application.updatedAt.toISOString(),
    })
  } catch (error) {
    return errorResponse(error)
  }
}

