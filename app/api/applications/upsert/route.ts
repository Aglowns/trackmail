/**
 * POST /api/applications/upsert
 * 
 * Idempotent upsert for job applications.
 * Auth: Bearer token (Gmail Add-on)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { assertBearerToken, getIdempotencyKey } from '@/lib/authz'
import { errorResponse, Errors } from '@/lib/errors'
import { UpsertApplicationSchema } from '@/lib/validators'

/**
 * Get or create a default user for API key authentication
 */
async function getOrCreateApiUser() {
  const apiUserEmail = 'api@jobmail.local'
  
  // Try to find existing API user
  let user = await prisma.user.findUnique({
    where: { email: apiUserEmail }
  })

  // Create API user if doesn't exist
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: apiUserEmail,
        name: 'API User',
        emailVerified: new Date(),
      }
    })
  }

  return user
}

export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const auth = assertBearerToken(request)
    if (!auth.authenticated) {
      throw Errors.Unauthorized()
    }

    // 2. Get or create user for API key
    const user = await getOrCreateApiUser()

    // 3. Parse and validate request body
    const body = await request.json()
    const data = UpsertApplicationSchema.parse(body)

    // 4. Check idempotency (if messageId provided)
    const idempotencyKey = getIdempotencyKey(request)
    const messageId = data.messageId || idempotencyKey

    if (messageId) {
      // Check if this message was already processed for this user
      const existingMessage = await prisma.inboxMessage.findFirst({
        where: { 
          messageId,
          application: {
            userId: user.id
          }
        },
        include: { application: true },
      })

      if (existingMessage && existingMessage.application) {
        // Already processed - return existing application
        return NextResponse.json(
          {
            id: existingMessage.application.id,
            threadId: existingMessage.application.threadId,
            company: existingMessage.application.company,
            title: existingMessage.application.title,
            status: existingMessage.application.status,
            createdAt: existingMessage.application.createdAt.toISOString(),
            updatedAt: existingMessage.application.updatedAt.toISOString(),
            isNew: false,
          },
          { status: 200 }
        )
      }
    }

    // 5. Check if application exists by threadId and userId
    const existingApp = await prisma.application.findFirst({
      where: { 
        threadId: data.threadId,
        userId: user.id
      },
    })

    let application
    let isNew = false

    if (existingApp) {
      // Application exists - only update if lastEmailId is different
      if (existingApp.lastEmailId !== data.lastEmailId) {
        application = await prisma.application.update({
          where: { id: existingApp.id },
          data: {
            lastEmailId: data.lastEmailId,
            company: data.company,
            title: data.title,
            jobUrl: data.jobUrl,
            appliedAt: data.appliedAt,
            status: data.status,
            confidence: data.confidence,
            atsVendor: data.atsVendor,
            companyDomain: data.companyDomain,
            rawSubject: data.rawSubject,
            rawSnippet: data.rawSnippet,
          },
        })

        // Log update event
        await prisma.event.create({
          data: {
            applicationId: application.id,
            type: 'APPLICATION_UPDATED',
            message: `Updated from email ${data.lastEmailId}`,
            metadata: {
              messageId,
              source: 'gmail-addon',
            },
          },
        })
      } else {
        // Same lastEmailId - no update needed (idempotent)
        application = existingApp
      }
    } else {
      // New application - create it
      application = await prisma.application.create({
        data: {
          userId: user.id,
          threadId: data.threadId,
          lastEmailId: data.lastEmailId,
          company: data.company,
          title: data.title,
          jobUrl: data.jobUrl,
          appliedAt: data.appliedAt,
          status: data.status,
          source: data.source,
          confidence: data.confidence,
          atsVendor: data.atsVendor,
          companyDomain: data.companyDomain,
          rawSubject: data.rawSubject,
          rawSnippet: data.rawSnippet,
        },
      })

      isNew = true

      // Log creation event
      await prisma.event.create({
        data: {
          applicationId: application.id,
          type: 'APPLICATION_CREATED',
          message: `Created from email ${data.lastEmailId}`,
          metadata: {
            messageId,
            source: 'gmail-addon',
          },
        },
      })
    }

    // 5. Store InboxMessage for deduplication (if messageId provided)
    if (messageId) {
      await prisma.inboxMessage.upsert({
        where: { messageId },
        create: {
          messageId,
          applicationId: application.id,
        },
        update: {
          applicationId: application.id,
        },
      })
    }

    // 6. Return response
    return NextResponse.json(
      {
        id: application.id,
        threadId: application.threadId,
        company: application.company,
        title: application.title,
        status: application.status,
        createdAt: application.createdAt.toISOString(),
        updatedAt: application.updatedAt.toISOString(),
        isNew,
      },
      { status: isNew ? 201 : 200 }
    )
  } catch (error) {
    return errorResponse(error)
  }
}

