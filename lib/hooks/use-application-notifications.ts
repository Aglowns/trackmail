import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { applicationKeys } from './use-applications'
import type { ApplicationsResponse } from '@/lib/api'

/**
 * Hook to show notifications when new applications are detected
 */
export function useApplicationNotifications() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [previousCount, setPreviousCount] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const previousApplicationsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const applicationsData = queryClient.getQueryData(applicationKeys.lists()) as ApplicationsResponse
    
    if (applicationsData?.data) {
      const currentApplications = applicationsData.data
      const currentCount = currentApplications.length
      
      // Initialize on first load
      if (!isInitialized) {
        currentApplications.forEach(app => {
          previousApplicationsRef.current.add(app.id)
        })
        setPreviousCount(currentCount)
        setIsInitialized(true)
        return
      }
      
      // Check for new applications
      if (currentCount > previousCount && previousCount > 0) {
        const newApplications = currentApplications.filter(
          app => !previousApplicationsRef.current.has(app.id)
        )
        
        // Show notifications for new applications
        newApplications.forEach((app) => {
          toast.success(`New application detected!`, {
            description: `${app.company} - ${app.title}`,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => router.push(`/apps/${app.id}`)
            }
          })
          
          // Add to previous applications set
          previousApplicationsRef.current.add(app.id)
        })
      }
      
      // Update previous count and applications set
      setPreviousCount(currentCount)
      
      // Clean up old applications from the set (keep only recent ones)
      const currentAppIds = new Set(currentApplications.map(app => app.id))
      previousApplicationsRef.current = new Set(
        Array.from(previousApplicationsRef.current).filter(id => currentAppIds.has(id))
      )
    }
  }, [queryClient, previousCount, isInitialized, router])

  return {
    isInitialized,
    applicationCount: previousCount
  }
}
