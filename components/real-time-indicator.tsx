'use client'

import { useState, useEffect } from 'react'
import { useSmartPolling } from '@/lib/hooks/use-smart-polling'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Activity } from 'lucide-react'

export function RealTimeIndicator() {
  const { isActive, isOnline } = useSmartPolling()
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-400'
    if (!isActive) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusText = () => {
    if (!isOnline) return 'Offline'
    if (!isActive) return 'Background'
    return 'Live'
  }

  const getStatusIcon = () => {
    if (!isOnline) return WifiOff
    if (!isActive) return Activity
    return Wifi
  }

  const StatusIcon = getStatusIcon()

  return (
    <motion.div 
      className="flex items-center space-x-2 text-sm"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`}
        animate={{ 
          scale: isOnline && isActive ? [1, 1.2, 1] : 1,
          opacity: isOnline && isActive ? [1, 0.7, 1] : 1
        }}
        transition={{ 
          duration: 2,
          repeat: isOnline && isActive ? Infinity : 0
        }}
      />
      
      <StatusIcon className={`w-3 h-3 ${getStatusColor()}`} />
      
      <span className={`font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      <span className="text-white/50 text-xs">
        • Updated {Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago
      </span>
    </motion.div>
  )
}
