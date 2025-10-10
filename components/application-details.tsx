'use client'

import { useState } from 'react'
import { useUpdateApplicationStatus } from '@/lib/hooks/use-applications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Timeline } from '@/components/timeline'
import { 
  ExternalLink, 
  Calendar, 
  Building2, 
  Briefcase, 
  MapPin,
  Globe,
  Clock,
  User
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { type Application } from '@/lib/api'

const STATUS_OPTIONS = [
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800',
  screening: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

interface ApplicationDetailsProps {
  application: Application
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const updateStatus = useUpdateApplicationStatus()

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === application.status) return
    
    setIsUpdating(true)
    try {
      await updateStatus.mutateAsync({
        id: application.id,
        status: newStatus,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{application.company}</CardTitle>
                <div className="flex items-center text-lg text-gray-600">
                  <Briefcase className="h-5 w-5 mr-2" />
                  {application.title}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge 
                  className={cn(
                    'text-sm px-3 py-1',
                    STATUS_COLORS[application.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {application.status}
                </Badge>
                
                {application.jobUrl && (
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Job
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">Source: {application.source}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Applied {application.appliedAt ? formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true }) : 'Date unknown'}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Created {format(new Date(application.createdAt), 'PPP')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Updated {format(new Date(application.updatedAt), 'PPP')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Timeline applicationId={application.id} />
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Status Update */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current Status</label>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={cn(
                    'text-sm px-3 py-1',
                    STATUS_COLORS[application.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                  )}
                >
                  {application.status}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Change to</label>
              <Select
                value=""
                onValueChange={handleStatusUpdate}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS
                    .filter(option => option.value !== application.status)
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Application Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Application ID
              </label>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {application.id}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Message ID
              </label>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {application.lastEmailId}
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Thread ID
              </label>
              <p className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {application.threadId}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
