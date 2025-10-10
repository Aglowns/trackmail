'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ExternalLink, 
  Calendar, 
  Building2, 
  MapPin,
  Clock,
  MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface ApplicationCardProps {
  application: any
  isDragging?: boolean
}

export function ApplicationCard({ application, isDragging = false }: ApplicationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: application.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getStatusColor = (status: string) => {
    const colors = {
      interested: 'bg-blue-100 text-blue-800',
      applied: 'bg-purple-100 text-purple-800',
      screening: 'bg-yellow-100 text-yellow-800',
      interview: 'bg-orange-100 text-orange-800',
      offer: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getSourceIcon = (source: string) => {
    const icons = {
      LinkedIn: '💼',
      Greenhouse: '🌱',
      Indeed: '🔍',
      Email: '📧',
      Glassdoor: '🏢',
      Workday: '💻',
    }
    return icons[source as keyof typeof icons] || '📋'
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        className={cn(
          'cursor-grab active:cursor-grabbing transition-all duration-300 group backdrop-blur-xl border-2 shadow-xl',
          'bg-white/10 border-white/20 hover:bg-white/20 hover:shadow-2xl hover:border-white/30',
          (isDragging || isSortableDragging) && 'shadow-3xl rotate-2 scale-105 z-50 bg-white/30 border-white/40'
        )}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm leading-tight mb-1 line-clamp-2">
                {application.company}
              </h4>
              <p className="text-xs text-white/70 line-clamp-2">
                {application.title}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation()
                // Handle menu
              }}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </div>

          {/* Source Badge */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="text-xs">{getSourceIcon(application.source)}</span>
              <span className="text-xs text-white/80">{application.source}</span>
            </div>
            <Badge className={cn('text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0')}>
              {application.status}
            </Badge>
          </div>

          {/* Applied Date */}
          <div className="flex items-center space-x-1 mb-3">
            <Clock className="h-3 w-3 text-white/60" />
            <span className="text-xs text-white/60">
              {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/20">
            <div className="flex items-center space-x-2">
              {application.jobUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  asChild
                >
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 bg-white/10 hover:bg-white/20 text-white border-white/20"
                asChild
              >
                <Link href={`/apps/${application.id}`}>
                  <Building2 className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            
            <div className="text-xs text-white/50">
              ID: {application.id.slice(-6)}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
