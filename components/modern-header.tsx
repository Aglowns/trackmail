'use client'

import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RealTimeIndicator } from '@/components/real-time-indicator'
import { 
  LogOut, 
  User, 
  Search, 
  Filter, 
  Plus,
  BarChart3,
  Settings,
  Bell
} from 'lucide-react'
import { motion } from 'framer-motion'

export function ModernHeader() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <motion.header 
      className="bg-gradient-to-r from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <motion.div
              className="w-10 h-10 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-white font-bold text-lg">T</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">Trackmail</h1>
              <p className="text-xs text-white/70">Job Application Tracker</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 transition-all duration-300 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-3 bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                <Bell className="h-4 w-4" />
              </Button>
              
              <RealTimeIndicator />
            </div>

            {/* User Menu */}
            {status === 'loading' ? (
              <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {session.user?.name?.charAt(0) || <User className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onSelect={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-white/70 hidden md:inline">Demo Mode</span>
                <Button
                  onClick={() => signIn()}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}
