/**
 * Vitest Setup
 * 
 * Global test setup and environment configuration.
 */

import { beforeAll, afterAll, vi } from 'vitest'

// Mock environment variables
beforeAll(() => {
  process.env.JOBMAIL_API_KEY = 'test_api_key_12345'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
  process.env.NEXTAUTH_SECRET = 'test_secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
})

// Mock Prisma Client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    event: {
      create: vi.fn(),
    },
    inboxMessage: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}))

// Mock NextAuth
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}))

afterAll(() => {
  vi.clearAllMocks()
})

