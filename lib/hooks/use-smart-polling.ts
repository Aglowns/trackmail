import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Smart polling hook that adjusts polling based on user activity
 */
export function useSmartPolling() {
  const [isActive, setIsActive] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    // Handle visibility changes (tab switching)
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden
      setIsActive(isVisible)
      
      if (isVisible) {
        // Refetch immediately when user returns to tab
        queryClient.invalidateQueries()
      }
    }

    // Handle window focus/blur
    const handleFocus = () => {
      setIsActive(true)
      queryClient.invalidateQueries()
    }
    
    const handleBlur = () => {
      setIsActive(false)
    }

    // Handle online/offline status
    const handleOnline = () => {
      setIsOnline(true)
      setIsActive(true)
      queryClient.invalidateQueries()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setIsActive(false)
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [queryClient])

  return { isActive, isOnline }
}
