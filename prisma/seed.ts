/**
 * Database Seeding Script
 * 
 * Populates the database with sample data for development.
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data (optional - comment out for production)
  await prisma.event.deleteMany()
  await prisma.inboxMessage.deleteMany()
  await prisma.application.deleteMany()

  // Seed applications
  const app1 = await prisma.application.create({
    data: {
      threadId: 'thread_sample_001',
      lastEmailId: 'email_sample_001',
      company: 'Google',
      title: 'Senior Software Engineer',
      jobUrl: 'https://careers.google.com/jobs/12345',
      appliedAt: new Date('2025-01-10'),
      status: 'APPLIED',
      source: 'GMAIL',
      confidence: 'HIGH',
      atsVendor: 'greenhouse',
      companyDomain: 'google.com',
      rawSubject: 'Application Received - Senior Software Engineer',
      rawSnippet: 'Thank you for applying to Google...',
    },
  })

  const app2 = await prisma.application.create({
    data: {
      threadId: 'thread_sample_002',
      lastEmailId: 'email_sample_002',
      company: 'Meta',
      title: 'Frontend Engineer',
      jobUrl: 'https://www.metacareers.com/jobs/54321',
      appliedAt: new Date('2025-01-12'),
      status: 'INTERVIEWING',
      source: 'GMAIL',
      confidence: 'HIGH',
      atsVendor: 'lever',
      companyDomain: 'meta.com',
      rawSubject: 'Interview Scheduled - Frontend Engineer',
      rawSnippet: 'We would like to schedule an interview...',
    },
  })

  const app3 = await prisma.application.create({
    data: {
      threadId: 'thread_sample_003',
      lastEmailId: 'email_sample_003',
      company: 'Stripe',
      title: 'Full Stack Engineer',
      appliedAt: new Date('2025-01-15'),
      status: 'NEW',
      source: 'GMAIL',
      confidence: 'MEDIUM',
      companyDomain: 'stripe.com',
      rawSubject: 'Job Opportunity at Stripe',
    },
  })

  // Seed events
  await prisma.event.create({
    data: {
      applicationId: app1.id,
      type: 'APPLICATION_CREATED',
      message: 'Application created from Gmail',
      metadata: {
        source: 'gmail-addon',
        confidence: 'high',
      },
    },
  })

  await prisma.event.create({
    data: {
      applicationId: app2.id,
      type: 'APPLICATION_CREATED',
      message: 'Application created from Gmail',
      metadata: {
        source: 'gmail-addon',
      },
    },
  })

  await prisma.event.create({
    data: {
      applicationId: app2.id,
      type: 'STATUS_CHANGED',
      message: 'Status changed from APPLIED to INTERVIEWING',
      metadata: {
        oldStatus: 'APPLIED',
        newStatus: 'INTERVIEWING',
      },
    },
  })

  // Seed inbox messages for deduplication
  await prisma.inboxMessage.create({
    data: {
      messageId: 'gmail_msg_001',
      applicationId: app1.id,
    },
  })

  await prisma.inboxMessage.create({
    data: {
      messageId: 'gmail_msg_002',
      applicationId: app2.id,
    },
  })

  console.log('✅ Seeded:')
  console.log('  - 3 applications')
  console.log('  - 3 events')
  console.log('  - 2 inbox messages')
  console.log('')
  console.log('📊 Summary:')
  console.log(`  - Application 1: ${app1.company} - ${app1.status}`)
  console.log(`  - Application 2: ${app2.company} - ${app2.status}`)
  console.log(`  - Application 3: ${app3.company} - ${app3.status}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

