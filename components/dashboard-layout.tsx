'use client'

import { useState } from 'react'
import { ModernHeader } from '@/components/modern-header'
import { KanbanBoard } from '@/components/kanban-board'
import { ApplicationsTable } from '@/components/applications-table'
import { ApplicationsFilters } from '@/components/applications-filters'
import { RealTimeIndicator } from '@/components/real-time-indicator'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Grid3X3, 
  List, 
  TrendingUp, 
  Calendar,
  Target,
  Users
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSmartPolling } from '@/lib/hooks/use-smart-polling'
import { useApplicationNotifications } from '@/lib/hooks/use-application-notifications'

type ViewMode = 'kanban' | 'table'

export function DashboardLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')
  const [showFilters, setShowFilters] = useState(false)
  
  // Enable smart polling and notifications
  useSmartPolling()
  useApplicationNotifications()

  const stats = [
    { label: 'Total Applications', value: '8', icon: Target, color: 'text-blue-600' },
    { label: 'This Month', value: '8', icon: Calendar, color: 'text-green-600' },
    { label: 'Interview Rate', value: '33%', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Active Jobs', value: '6', icon: Users, color: 'text-orange-600' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20 animate-pulse"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-purple-600/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-pink-600/10"></div>
      
      <ModernHeader />
      
      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer group backdrop-blur-xl bg-white/10 border-white/20 hover:bg-white/20 hover:scale-105">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-1">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {stat.value}
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all duration-300 backdrop-blur-sm">
                        <Icon className={`h-6 w-6 text-white`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* View Controls */}
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white">Applications</h2>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className={cn(
                  "h-8 px-3 transition-all duration-300",
                  viewMode === 'kanban' 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Board
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn(
                  "h-8 px-3 transition-all duration-300",
                  viewMode === 'table' 
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg" 
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                <List className="h-4 w-4 mr-2" />
                Table
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <RealTimeIndicator />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-9 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <ApplicationsFilters />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, x: viewMode === 'kanban' ? -20 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: viewMode === 'kanban' ? -20 : 20 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'kanban' ? (
            <KanbanBoard />
          ) : (
            <ApplicationsTable />
          )}
        </motion.div>
      </main>
    </div>
  )
}
