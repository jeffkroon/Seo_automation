import { supabaseRest } from '@/lib/supabase-rest'
import { ScheduleForm } from '@/components/schedules/schedule-form'
import { ScheduleCard } from '@/components/schedules/schedule-card'

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
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Schedule overzicht</h1>
          <p className="text-muted-foreground max-w-2xl">
            Beheer je terugkerende artikel-generaties, activeer of pauzeer schedules en bekijk de meest recente output.
          </p>
        </div>

        <ScheduleForm companies={companies} />

        {schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Nog geen schedule resultaten ontvangen. Configureer de n8n workflow om de output naar
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5">/api/schedules/record</code> te posten.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {schedules.map((schedule: any) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
