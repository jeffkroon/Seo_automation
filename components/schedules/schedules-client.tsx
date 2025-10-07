"use client"

import { useState, useEffect } from "react"
import { ScheduleCard } from "@/components/schedules/schedule-card"
import { ScheduleForm } from "@/components/schedules/schedule-form"
import { RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface SchedulesClientProps {
  initialSchedules: any[]
  companies: any[]
}

interface ScheduleCardProps {
  schedule: any
  onRefresh: () => void
}

export function SchedulesClient({ initialSchedules, companies }: SchedulesClientProps) {
  const [schedules, setSchedules] = useState(initialSchedules)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSchedules = async () => {
    try {
      setIsRefreshing(true)
      const response = await apiClient('/api/schedules', { 
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

  return (
    <div className="space-y-6">
      <ScheduleForm companies={companies} onRefresh={fetchSchedules} />

      {schedules.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
          <p className="mb-2">Nog geen schedules aangemaakt.</p>
          <p className="text-sm">Maak hierboven je eerste schedule aan om te beginnen.</p>
        </div>
      ) : (
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
              <ScheduleCard key={schedule.id} schedule={schedule} onRefresh={fetchSchedules} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
