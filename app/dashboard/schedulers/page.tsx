"use client"

import { useEffect, useState } from "react"
import { useClientContext } from "@/hooks/use-client-context"
import { apiClient } from "@/lib/api-client"
import { SchedulerStats } from "@/components/scheduler/scheduler-stats"
import { CreateSchedulerDialog } from "@/components/scheduler/create-scheduler-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Clock, Target, FileText, BarChart3, MoreHorizontal } from "lucide-react"

interface Schedule {
  id: string
  focus_keyword: string
  article_type: string
  interval_seconds: number
  active: boolean
  last_run_at?: string
  next_run_at?: string
  created_at: string
}

export default function SchedulersPage() {
  const { selectedClient } = useClientContext()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (selectedClient?.id) {
      fetchSchedules()
    }
  }, [selectedClient])

  const fetchSchedules = async () => {
    if (!selectedClient?.id) return
    
    try {
      setIsLoading(true)
      const response = await apiClient(`/api/schedules?client_id=${selectedClient.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rank_tracking":
        return Target
      case "serp_analysis":
        return BarChart3
      case "content_generation":
        return FileText
      default:
        return Clock
    }
  }

  const formatInterval = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `Every ${days} day${days > 1 ? 's' : ''}`
    if (hours > 0) return `Every ${hours} hour${hours > 1 ? 's' : ''}`
    return `Every ${seconds / 60} minutes`
  }

  if (!selectedClient) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Selecteer een client om schedulers te beheren.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Schedulers</h1>
          <p className="text-muted-foreground">
            Beheer geautomatiseerde SEO taken voor {selectedClient.naam}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Scheduler
        </Button>
      </div>

      <SchedulerStats />

      <Card>
        <CardHeader>
          <CardTitle>Actieve Schedulers</CardTitle>
          <CardDescription>
            {schedules.length} scheduler{schedules.length !== 1 ? 's' : ''} voor {selectedClient.naam}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen schedulers gevonden. Maak je eerste scheduler aan!
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const TypeIcon = getTypeIcon(schedule.article_type)
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-muted rounded-lg">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium">{schedule.focus_keyword}</h3>
                          <Badge variant={schedule.active ? "default" : "secondary"}>
                            {schedule.active ? "Actief" : "Paused"}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            {formatInterval(schedule.interval_seconds)}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            {schedule.last_run_at && (
                              <span>Laatst: {new Date(schedule.last_run_at).toLocaleString('nl-NL')}</span>
                            )}
                            {schedule.next_run_at && (
                              <span>Volgende: {new Date(schedule.next_run_at).toLocaleString('nl-NL')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch checked={schedule.active} />
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateSchedulerDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onScheduleCreated={fetchSchedules}
      />
    </div>
  )
}