'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

interface Event {
  id: string
  applicationId: string
  type: string
  status?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const EVENT_TYPES = {
  created: { label: 'Application Created', icon: CheckCircle, color: 'text-green-600' },
  status_change: { label: 'Status Updated', icon: Clock, color: 'text-blue-600' },
  note: { label: 'Note Added', icon: Calendar, color: 'text-gray-600' },
} as const

const STATUS_ICONS = {
  applied: CheckCircle,
  screening: Clock,
  interview: Clock,
  offer: CheckCircle,
  rejected: XCircle,
} as const

function TimelineEvent({ event }: { event: Event }) {
  const eventType = EVENT_TYPES[event.type as keyof typeof EVENT_TYPES] || EVENT_TYPES.note
  const Icon = eventType.icon
  
  return (
    <div className="relative flex items-start space-x-3">
      <div className="flex-shrink-0">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-gray-100')}>
          <Icon className={cn('h-4 w-4', eventType.color)} />
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">
            {eventType.label}
          </p>
          
          {event.status && (
            <Badge variant="outline" className="text-xs">
              {event.status}
            </Badge>
          )}
        </div>
        
        {event.notes && (
          <p className="mt-1 text-sm text-gray-600">
            {event.notes}
          </p>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start space-x-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyTimeline() {
  return (
    <div className="text-center py-8">
      <Clock className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">No timeline events</h3>
      <p className="mt-1 text-sm text-gray-500">
        Timeline events will appear here as your application progresses.
      </p>
    </div>
  )
}

interface TimelineProps {
  applicationId: string
}

export function Timeline({ applicationId }: TimelineProps) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['events', applicationId],
    queryFn: () => api.getApplicationEvents(applicationId),
    staleTime: 30 * 1000, // 30 seconds
  })

  if (isLoading) {
    return <TimelineSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h3 className="text-sm font-medium text-red-900">Error loading timeline</h3>
        <p className="mt-1 text-sm text-red-500">
          {error instanceof Error ? error.message : 'Something went wrong'}
        </p>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return <EmptyTimeline />
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <TimelineEvent key={event.id} event={event} />
      ))}
    </div>
  )
}
