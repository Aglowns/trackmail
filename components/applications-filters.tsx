'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Greenhouse', label: 'Greenhouse' },
  { value: 'Indeed', label: 'Indeed' },
  { value: 'Email', label: 'Email' },
  { value: 'Glassdoor', label: 'Glassdoor' },
  { value: 'Workday', label: 'Workday' },
]

export function ApplicationsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [source, setSource] = useState(searchParams.get('source') || 'all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined
  )
  const [dateTo, setDateTo] = useState<Date | undefined>(
    searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined
  )

  const applyFilters = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (status && status !== 'all') params.set('status', status)
    if (source && source !== 'all') params.set('source', source)
    if (dateFrom) params.set('dateFrom', format(dateFrom, 'yyyy-MM-dd'))
    if (dateTo) params.set('dateTo', format(dateTo, 'yyyy-MM-dd'))
    
    router.push(`/?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setSource('all')
    setDateFrom(undefined)
    setDateTo(undefined)
    router.push('/')
  }

  const hasActiveFilters = search || (status && status !== 'all') || (source && source !== 'all') || dateFrom || dateTo

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Company, job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source */}
        <div className="space-y-2">
          <Label>Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-2">
          <Label>From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date To */}
        <div className="space-y-2">
          <Label>To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={applyFilters}>
          <Filter className="h-4 w-4 mr-2" />
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
