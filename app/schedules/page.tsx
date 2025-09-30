import { supabaseRest } from '@/lib/supabase-rest'
import { Header } from '@/components/header'
import { SchedulesClient } from '@/components/schedules/schedules-client'

function resolveBaseUrl() {
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL
  if (publicBase) return publicBase
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

async function fetchSchedules() {
  const res = await fetch(`${resolveBaseUrl()}/api/schedules`, { cache: 'no-store' }).catch(() => null)
  if (!res || !res.ok) return []
  const body = await res.json()
  return Array.isArray(body.data) ? body.data : []
}

export default async function SchedulesPage() {
  const [schedules, companies] = await Promise.all([
    fetchSchedules(),
    supabaseRest<any[]>(
      'companies',
      { searchParams: { select: 'id,name', order: 'name.asc' } },
    ).catch(() => []),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Schedule overzicht</h1>
          <p className="text-muted-foreground max-w-2xl">
            Beheer je terugkerende artikel-generaties, activeer of pauzeer schedules en bekijk de meest recente output.
          </p>
        </div>

        <SchedulesClient initialSchedules={schedules} companies={companies} />
      </main>
    </div>
  )
}
