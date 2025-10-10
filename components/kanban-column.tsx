'use client'

import { useDroppable } from '@dnd-kit/core'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface KanbanColumnProps {
  id: string
  title: string
  icon: LucideIcon
  color: string
  borderColor: string
  textColor: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  title,
  icon: Icon,
  color,
  borderColor,
  textColor,
  count,
  children,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        'h-fit min-h-[600px] transition-all duration-300 backdrop-blur-xl border-2 shadow-2xl',
        'bg-white/10 border-white/20 hover:bg-white/20',
        isOver && 'ring-4 ring-white/30 scale-[1.02] shadow-3xl'
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg text-white">{title}</h3>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'bg-white/20 text-white font-medium border-white/30 backdrop-blur-sm',
              count > 0 && 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            )}
          >
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="min-h-[400px]">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
