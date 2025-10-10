"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "sonner"
import { SessionProvider } from "next-auth/react"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000, // 5 seconds for real-time feel
        retry: 3,
        retryDelay: 1000,
        refetchOnWindowFocus: true,
        refetchIntervalInBackground: true,
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </SessionProvider>
  )
}
