import { notFound } from 'next/navigation'
import { ApplicationDetails } from '@/components/application-details'
import { Header } from '@/components/header'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import Link from 'next/link'

interface ApplicationPageProps {
  params: Promise<{ id: string }>
}

export default async function ApplicationPage({ params }: ApplicationPageProps) {
  const { id } = await params
  
  try {
    const application = await api.getApplication(id)
    
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Button variant="ghost" asChild className="mb-4">
              <Link href="/">
                ← Back to Applications
              </Link>
            </Button>
          </div>
          
          <ApplicationDetails application={application} />
        </main>
      </div>
    )
  } catch (error) {
    notFound()
  }
}
