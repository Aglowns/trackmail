import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/signin-form'
import { authOptions } from '@/lib/auth'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)
  
  if (session) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* Logo and branding */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <span className="text-2xl font-bold text-purple-600">T</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to Trackmail
          </h1>
          <p className="text-purple-200 text-sm">
            Your intelligent job application tracker
          </p>
        </div>

        {/* Sign-in form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <SignInForm />
        </div>

        {/* Features preview */}
        <div className="mt-8 text-center">
          <p className="text-purple-200 text-sm mb-4">What you'll get:</p>
          <div className="flex justify-center space-x-6 text-purple-200 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              Auto-tracking
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
              Real-time updates
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
              Smart analytics
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
