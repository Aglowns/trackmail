import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JobMail - Track Your Job Applications',
  description: 'Automatically track job applications from your Gmail inbox',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

