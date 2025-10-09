/**
 * Home Page
 * 
 * Landing page for JobMail web dashboard.
 */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">JobMail</h1>
        <p className="text-xl mb-8">Track your job applications automatically</p>
        
        <div className="space-y-4 max-w-2xl">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">API Status</h2>
            <p className="text-green-600 font-bold">✓ Backend Running</p>
          </div>

          <div className="p-6 border rounded-lg text-left">
            <h3 className="text-xl font-semibold mb-4">Available Endpoints:</h3>
            <ul className="space-y-2 font-mono text-sm">
              <li>POST /api/applications/upsert</li>
              <li>GET /api/applications</li>
              <li>GET /api/applications/by-thread/:threadId</li>
              <li>PATCH /api/applications/:id/status</li>
              <li>POST /api/events</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside text-left space-y-2">
              <li>Set up Neon Postgres database</li>
              <li>Configure environment variables (.env)</li>
              <li>Run database migrations: <code className="bg-gray-100 px-2 py-1 rounded">npx prisma migrate dev</code></li>
              <li>Install Gmail Add-on (Stage 3)</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  )
}

