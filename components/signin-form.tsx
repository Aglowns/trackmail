'use client'

import { signIn, getSession } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Github, Chrome, Loader2 } from 'lucide-react'

export function SignInForm() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSignIn = async (provider: string) => {
    setIsLoading(provider)
    try {
      await signIn(provider, { callbackUrl: '/' })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-white mb-2">
          Get Started
        </h2>
        <p className="text-purple-200 text-sm">
          Choose your preferred sign-in method
        </p>
      </div>

      <div className="space-y-4">
        <Button
          variant="outline"
          className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
          onClick={() => handleSignIn('google')}
          disabled={isLoading === 'google'}
        >
          {isLoading === 'google' ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-5 w-5" />
          )}
          {isLoading === 'google' ? 'Signing in...' : 'Continue with Google'}
        </Button>
        
        <Button
          variant="outline"
          className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-sm transition-all duration-200 hover:scale-[1.02]"
          onClick={() => handleSignIn('github')}
          disabled={isLoading === 'github'}
        >
          {isLoading === 'github' ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Github className="mr-2 h-5 w-5" />
          )}
          {isLoading === 'github' ? 'Signing in...' : 'Continue with GitHub'}
        </Button>
      </div>

      <div className="text-center">
        <p className="text-purple-200 text-xs">
          By signing in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}
