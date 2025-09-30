"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, RefreshCw } from "lucide-react"

interface ScheduleCardProps {
  schedule: any
}

function formatPreview(markdown?: string, length = 220) {
  if (!markdown) return ''
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`~>\-\[\]\(\)!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= length) return text
  return `${text.slice(0, length).trim()}…`
}

export function ScheduleCard({ schedule }: ScheduleCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

 const latest = schedule.latestArticle ?? null
  const preview = latest?.article ? formatPreview(latest.article) : null
  const intervalHours = schedule.interval_seconds
    ? Math.max(schedule.interval_seconds / 3600, 0.1)
    : null
  const lastRun = schedule.last_run_at || latest?.generated_at

  async function toggleActive(value: boolean) {
    await fetch(`/api/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: value }),
    })

    startTransition(() => router.refresh())
  }

  return (
    <Card className="border bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="capitalize">
              {schedule.active ? 'actief' : 'inactief'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {schedule.id}
          </span>
        </div>
        <CardTitle className="text-xl">
          {schedule.focus_keyword || schedule.keyword || 'Onbekend keyword'}
        </CardTitle>
        <dl className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground">Interval</dt>
            <dd>{intervalHours ? `${intervalHours.toFixed(1)} uur` : '–'}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Land / Taal</dt>
            <dd>{schedule.country?.toUpperCase()} · {schedule.language?.toUpperCase()}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Laatste run</dt>
            <dd>{lastRun ? new Date(lastRun).toLocaleString() : '–'}</dd>
          </div>
        </dl>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch id={`active-${schedule.id}`} checked={!!schedule.active} onCheckedChange={toggleActive} disabled={isPending} />
            <label htmlFor={`active-${schedule.id}`}>Schedule actief</label>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              const params = new URLSearchParams({ focusKeyword: schedule.focus_keyword || schedule.keyword || '' })
              router.push(`/?${params.toString()}`)
            }}
          >
            <RefreshCw className="h-4 w-4" /> Nieuwe run
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Laatste artikel</h3>
          {preview ? (
            <p className="text-sm leading-relaxed text-foreground">{preview}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Nog geen artikel ontvangen.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
