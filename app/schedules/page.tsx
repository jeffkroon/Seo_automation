import Link from 'next/link'

function resolveBaseUrl() {
  const publicBase = process.env.NEXT_PUBLIC_BASE_URL
  if (publicBase) return publicBase
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:3000'
}

async function fetchSchedules() {
  const res = await fetch(`${resolveBaseUrl()}/api/schedules/latest`, {
    cache: 'no-store',
  }).catch(() => null)

  if (!res || !res.ok) {
    return []
  }

  const body = await res.json()
  return Array.isArray(body.data) ? body.data : []
}

export default async function SchedulesPage() {
  const schedules = await fetchSchedules()

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Schedule overzicht</h1>
          <p className="text-muted-foreground max-w-2xl">
            Bekijk per schedule de laatste gegenereerde content. Gebruik dit overzicht om snel te beoordelen of de workflow
            nog actuele resultaten oplevert.
          </p>
        </div>

        {schedules.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
            Nog geen schedule resultaten ontvangen. Configureer de n8n workflow om de output naar
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5">/api/schedules/record</code> te posten.
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {schedules.map((schedule: any) => (
              <article key={schedule.scheduleId} className="rounded-xl border bg-card/80 backdrop-blur-sm p-6 space-y-4 shadow-sm">
                <header className="space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-foreground">{schedule.keyword || 'Onbekend keyword'}</h2>
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">{schedule.scheduleId}</span>
                  </div>
                  <dl className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {schedule.interval && (
                      <div>
                        <dt className="font-medium text-foreground">Interval</dt>
                        <dd>{schedule.interval}</dd>
                      </div>
                    )}
                    {schedule.status && (
                      <div>
                        <dt className="font-medium text-foreground">Status</dt>
                        <dd className="capitalize">{schedule.status}</dd>
                      </div>
                    )}
                    {schedule.generatedAt && (
                      <div>
                        <dt className="font-medium text-foreground">Laatste run</dt>
                        <dd>{new Date(schedule.generatedAt).toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>
                </header>

                {schedule.article ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-muted-foreground">Laatste artikel</h3>
                    <p className="text-sm leading-relaxed text-foreground">
                      {schedule.article.replace(/[#*_`~>\-\[\]\(\)!]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240)}
                      {schedule.article.length > 240 ? '…' : ''}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen artikel beschikbaar voor dit schedule.</p>
                )}

                <div className="flex items-center justify-end gap-3">
                  <Link
                    href={`/?focusKeyword=${encodeURIComponent(schedule.keyword ?? '')}`}
                    className="text-sm font-medium text-primary hover:text-primary/80"
                  >
                    Nieuwe run starten
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
