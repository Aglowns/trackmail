import { DashboardLayout } from '@/components/dashboard-layout'
import { Suspense } from 'react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardLayout />
    </Suspense>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      {/* Header Skeleton */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
              <div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg border">
          <div className="p-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}