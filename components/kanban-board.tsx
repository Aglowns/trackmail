'use client'

import { useState, useEffect } from 'react'
import { useApplications } from '@/lib/hooks/use-applications'
import { useUpdateApplicationStatus } from '@/lib/hooks/use-applications'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanColumn } from '@/components/kanban-column'
import { ApplicationCard } from '@/components/application-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Briefcase, TrendingUp, Clock, CheckCircle, XCircle, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const STATUS_CONFIG = {
  interested: {
    title: 'Interested',
    icon: Star,
    color: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50',
    borderColor: 'border-indigo-200/50',
    textColor: 'text-indigo-700',
    gradient: 'from-indigo-500 to-purple-600',
    count: 0,
  },
  applied: {
    title: 'Applied',
    icon: Briefcase,
    color: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50',
    borderColor: 'border-blue-200/50',
    textColor: 'text-blue-700',
    gradient: 'from-blue-500 to-cyan-600',
    count: 0,
  },
  screening: {
    title: 'Screening',
    icon: Clock,
    color: 'bg-gradient-to-br from-amber-50 via-orange-50 to-red-50',
    borderColor: 'border-amber-200/50',
    textColor: 'text-amber-700',
    gradient: 'from-amber-500 to-orange-600',
    count: 0,
  },
  interview: {
    title: 'Interview',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50',
    borderColor: 'border-emerald-200/50',
    textColor: 'text-emerald-700',
    gradient: 'from-emerald-500 to-teal-600',
    count: 0,
  },
  offer: {
    title: 'Offer',
    icon: CheckCircle,
    color: 'bg-gradient-to-br from-green-50 via-emerald-50 to-lime-50',
    borderColor: 'border-green-200/50',
    textColor: 'text-green-700',
    gradient: 'from-green-500 to-emerald-600',
    count: 0,
  },
  rejected: {
    title: 'Rejected',
    icon: XCircle,
    color: 'bg-gradient-to-br from-red-50 via-rose-50 to-pink-50',
    borderColor: 'border-red-200/50',
    textColor: 'text-red-700',
    gradient: 'from-red-500 to-rose-600',
    count: 0,
  },
} as const

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-8 rounded-full" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
        <Briefcase className="w-12 h-12 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet</h3>
      <p className="text-gray-600 text-center max-w-md mb-6">
        Start tracking your job applications by adding them through the Gmail add-on or manually.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm">
          📧 Use Gmail Add-on
        </div>
        <div className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm">
          ➕ Add Manually
        </div>
      </div>
    </div>
  )
}

export function KanbanBoard() {
  const { data, isLoading, error } = useApplications({})
  const updateStatus = useUpdateApplicationStatus()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const [applicationsByStatus, setApplicationsByStatus] = useState<Record<string, any[]>>({})

  useEffect(() => {
    if (data?.data) {
      const grouped = data.data.reduce((acc, app) => {
        const status = app.status || 'interested'
        if (!acc[status]) acc[status] = []
        acc[status].push(app)
        return acc
      }, {} as Record<string, any[]>)

      // Ensure all statuses exist
      Object.keys(STATUS_CONFIG).forEach(status => {
        if (!grouped[status]) grouped[status] = []
      })

      setApplicationsByStatus(grouped)
    }
  }, [data])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const applicationId = active.id as string
    const newStatus = over.id as string

    // Find the application
    let sourceStatus = ''
    let application = null

    for (const [status, apps] of Object.entries(applicationsByStatus)) {
      const app = apps.find(a => a.id === applicationId)
      if (app) {
        sourceStatus = status
        application = app
        break
      }
    }

    if (!application || sourceStatus === newStatus) return

    // Optimistic update
    setApplicationsByStatus(prev => {
      const newState = { ...prev }
      
      // Remove from source
      newState[sourceStatus] = newState[sourceStatus].filter(app => app.id !== applicationId)
      
      // Add to destination
      newState[newStatus] = [...newState[newStatus], { ...application, status: newStatus }]
      
      return newState
    })

    // Update in database
    try {
      await updateStatus.mutateAsync({
        id: applicationId,
        status: newStatus,
      })
    } catch (error) {
      // Revert on error
      setApplicationsByStatus(prev => {
        const newState = { ...prev }
        
        // Remove from destination
        newState[newStatus] = newState[newStatus].filter(app => app.id !== applicationId)
        
        // Add back to source
        newState[sourceStatus] = [...newState[sourceStatus], application]
        
        return newState
      })
    }
  }

  if (isLoading) {
    return <KanbanSkeleton />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error loading applications</h3>
          <p className="text-red-600">{error instanceof Error ? error.message : 'Something went wrong'}</p>
        </div>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return <EmptyState />
  }

  const totalApplications = data.data.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-purple-600/10"></div>
      
      {/* Header */}
      <div className="relative bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Job Applications</h1>
              <p className="text-white/70 mt-1">
                {totalApplications} application{totalApplications !== 1 ? 's' : ''} across all stages
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                  const count = applicationsByStatus[status]?.length || 0
                  const Icon = config.icon
                  return (
                    <div key={status} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <Icon className={`w-4 h-4 text-white`} />
                      <span className="font-medium text-white">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="relative container mx-auto px-6 py-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const applications = applicationsByStatus[status] || []
              const Icon = config.icon
              
              return (
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <KanbanColumn
                    id={status}
                    title={config.title}
                    icon={Icon}
                    color={config.color}
                    borderColor={config.borderColor}
                    textColor={config.textColor}
                    count={applications.length}
                  >
                    <SortableContext
                      items={applications.map(app => app.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {applications.map((application) => (
                          <ApplicationCard
                            key={application.id}
                            application={application}
                            isDragging={false}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </KanbanColumn>
                </motion.div>
              )
            })}
          </div>
        </DndContext>
      </div>
    </div>
  )
}
