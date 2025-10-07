import { supabaseRest } from '@/lib/supabase-rest'
import { SchedulesClient } from '@/components/schedules/schedules-client'

function resolveBaseUrl() {
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL
  if (publicBase) return publicBase
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

async function fetchSchedules() {
  // For now, we'll skip server-side fetching since we need company context
  // The client-side component will handle the fetch with proper headers
  return []
}

export default async function SchedulersPage() {
  const [schedules, companies] = await Promise.all([
    fetchSchedules(),
    supabaseRest<any[]>(
      'companies',
      { searchParams: { select: 'id,name', order: 'name.asc' } },
    ).catch(() => []),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Schedulers</h1>
          <p className="text-muted-foreground">Manage automated SEO tasks and their execution schedules.</p>
        </div>
      </div>

      <SchedulesClient initialSchedules={schedules} companies={companies} />
    </div>
  )
}