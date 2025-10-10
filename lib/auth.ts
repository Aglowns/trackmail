/**
 * NextAuth Configuration
 * 
 * Handles user authentication for the web dashboard.
 * Supports GitHub and Google OAuth providers with database persistence.
 */

import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GithubProvider from 'next-auth/providers/github'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // GitHub OAuth (placeholder for now)
    GithubProvider({
      clientId: process.env.GITHUB_ID || "temp_github_id",
      clientSecret: process.env.GITHUB_SECRET || "temp_github_secret",
    }),

    // Google OAuth (placeholder for now)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "temp_google_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "temp_google_secret",
    }),
  ],

  // Session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // JWT secret
  secret: process.env.NEXTAUTH_SECRET,

  // Custom pages
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Callbacks
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          userId: user.id,
        }
      }
      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.userId,
        },
      }
    },
  },

  // Debug in development
  debug: process.env.NODE_ENV === 'development',
}

