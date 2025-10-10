/**
 * React Query hooks for applications data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, type Application, type ApplicationsFilters, type ApplicationsResponse } from '@/lib/api'
import { toast } from 'sonner'

// Query keys
export const applicationKeys = {
  all: ['applications'] as const,
  lists: () => [...applicationKeys.all, 'list'] as const,
  list: (filters: ApplicationsFilters) => [...applicationKeys.lists(), filters] as const,
  details: () => [...applicationKeys.all, 'detail'] as const,
  detail: (id: string) => [...applicationKeys.details(), id] as const,
}

// Get applications with filters
export function useApplications(filters: ApplicationsFilters = {}) {
  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => api.getApplications(filters),
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true, // Continue when tab is hidden
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 3, // Retry failed requests
    retryDelay: 1000, // Wait 1 second between retries
    networkMode: 'online', // Only refetch when online
  })
}

// Get single application
export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => api.getApplication(id),
    enabled: !!id,
  })
}

// Update application status with optimistic updates
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: applicationKeys.lists() })
      
      // Snapshot previous value
      const previousApplications = queryClient.getQueriesData({
        queryKey: applicationKeys.lists()
      })
      
      // Optimistically update all application lists
      queryClient.setQueriesData(
        { queryKey: applicationKeys.lists() },
        (old: ApplicationsResponse | undefined) => {
          if (!old) return old
          
          return {
            ...old,
            data: old.data.map((app) =>
              app.id === id ? { ...app, status } : app
            )
          }
        }
      )
      
      // Optimistically update single application if in cache
      queryClient.setQueryData(
        applicationKeys.detail(id),
        (old: Application | undefined) => {
          if (!old) return old
          return { ...old, status }
        }
      )
      
      return { previousApplications }
    },
    onSuccess: (updatedApplication) => {
      // Update the application in the cache with server response
      queryClient.setQueryData(
        applicationKeys.detail(updatedApplication.id),
        updatedApplication
      )
      
      // Show success toast
      toast.success(`Status updated to ${updatedApplication.status}`, {
        duration: 3000,
      })
    },
    onError: (error, { id, status }, context) => {
      // Revert optimistic updates on error
      if (context?.previousApplications) {
        context.previousApplications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      
      toast.error('Failed to update status')
      console.error('Update status error:', error)
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: applicationKeys.lists(),
      })
    },
  })
}
