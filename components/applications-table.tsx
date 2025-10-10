'use client'

import { useSearchParams } from 'next/navigation'
import { useApplications } from '@/lib/hooks/use-applications'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ExternalLink, Calendar, Building2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { cn } from '@/lib/utils'
// import { FixedSizeList as List } from 'react-window'

const STATUS_COLORS = {
  applied: 'bg-blue-100 text-blue-800',
  screening: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-purple-100 text-purple-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const

const CONFIDENCE_COLORS = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-800',
} as const

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn('capitalize', STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800')}>
      {status}
    </Badge>
  )
}

function ConfidenceBadge({ confidence }: { confidence: 'high' | 'medium' | 'low' }) {
  return (
    <Badge className={cn('capitalize', CONFIDENCE_COLORS[confidence])}>
      {confidence}
    </Badge>
  )
}

function ApplicationRow({ application }: { application: any }) {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium text-gray-900">{application.company}</div>
          <div className="flex items-center text-sm text-gray-500">
            <Briefcase className="h-3 w-3 mr-1" />
            {application.jobTitle}
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <StatusBadge status={application.status} />
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-1">
          <Building2 className="h-3 w-3 text-gray-400" />
          <span className="text-sm text-gray-600">{application.source}</span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-3 w-3 mr-1" />
          <span title={format(new Date(application.appliedAt), 'PPP')}>
            {formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true })}
          </span>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2">
          {application.jobUrl && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View job posting"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
          
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/apps/${application.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function TableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Company & Position</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Applied</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-20" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto h-12 w-12 text-gray-400">
        <Briefcase className="h-12 w-12" />
      </div>
      <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
      <p className="mt-1 text-sm text-gray-500">
        Try adjusting your filters or check back later for new applications.
      </p>
    </div>
  )
}

export function ApplicationsTable() {
  const searchParams = useSearchParams()
  
  const filters = {
    search: searchParams.get('search') || undefined,
    status: searchParams.get('status') || undefined,
    source: searchParams.get('source') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  }

  const { data, isLoading, error } = useApplications(filters)

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white">
        <TableSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <div className="text-center">
          <h3 className="text-sm font-medium text-red-900">Error loading applications</h3>
          <p className="mt-1 text-sm text-red-500">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
        </div>
      </div>
    )
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-lg border bg-white">
        <EmptyState />
      </div>
    )
  }

  // For large datasets, use pagination instead of virtualization for now
  // if (data.applications.length > 500) {
  //   return <VirtualizedApplicationsTable applications={data.applications} />
  // }

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Company & Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((application) => (
            <ApplicationRow key={application.id} application={application} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Virtualized table for large datasets (disabled for now)
// function VirtualizedApplicationsTable({ applications }: { applications: any[] }) {
//   const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
//     <div style={style}>
//       <ApplicationRow application={applications[index]} />
//     </div>
//   )

//   return (
//     <div className="rounded-lg border bg-white">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead>Company & Position</TableHead>
//             <TableHead>Status</TableHead>
//             <TableHead>Source</TableHead>
//             <TableHead>Applied</TableHead>
//             <TableHead>Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//       </Table>
//       <div className="h-96">
//         <List
//           height={384} // 96 * 4 (96 = h-96)
//           itemCount={applications.length}
//           itemSize={64} // Approximate row height
//           className="w-full"
//         >
//           {Row}
//         </List>
//       </div>
//     </div>
//   )
// }
