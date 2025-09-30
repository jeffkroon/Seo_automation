"use client"

import { useState, useEffect } from "react"
import { ScheduleCard } from "@/components/schedules/schedule-card"
import { RefreshCw } from "lucide-react"

interface SchedulesClientProps {
  initialSchedules: any[]
}

export function SchedulesClient({ initialSchedules }: SchedulesClientProps) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSchedules = async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/schedules', { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const newSchedules = Array.isArray(data.data) ? data.data : []
        setSchedules(newSchedules)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchSchedules, 30000)
    return () => clearInterval(interval)
  }, [])

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchSchedules()
  }

  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
        Nog geen schedule resultaten ontvangen. Configureer de n8n workflow om de output naar
        <code className="mx-1 rounded bg-muted px-1.5 py-0.5">/api/schedules/record</code> te posten.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Laatste update: {lastRefresh.toLocaleTimeString()}
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Vernieuwen...' : 'Vernieuwen'}
        </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {schedules.map((schedule: any) => (
          <ScheduleCard key={schedule.id} schedule={schedule} />
        ))}
      </div>
    </div>
  )
}
