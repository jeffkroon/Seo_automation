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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Clock, Target, FileText, BarChart3, MoreHorizontal, Trash2, Pause, Play, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Schedule {
  id: string
  focus_keyword: string
  extra_keywords?: string[]
  extra_headings?: string[]
  article_type: string
  interval_seconds: number
  active: boolean
  last_run_at?: string
  next_run_at?: string
  created_at: string
  website_url?: string
  language?: string
  country?: string
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
    
    if (days > 0) return `Elke ${days} dag${days > 1 ? 'en' : ''}`
    if (hours > 0) return `Elke ${hours} uur`
    return `Elke ${seconds / 60} minuten`
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Weet je zeker dat je deze scheduler wilt verwijderen?')) return

    try {
      const response = await apiClient(`/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: "Scheduler is verwijderd!"
        })
        fetchSchedules()
      } else {
        toast({
          title: "Fout",
          description: "Kon scheduler niet verwijderen.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis.",
        variant: "destructive"
      })
    }
  }

  const handleToggleSchedule = async (scheduleId: string, currentActive: boolean) => {
    try {
      const response = await apiClient(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentActive })
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: `Scheduler ${!currentActive ? 'geactiveerd' : 'gepauzeerd'}!`
        })
        fetchSchedules()
      } else {
        toast({
          title: "Fout",
          description: "Kon scheduler niet updaten.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error toggling schedule:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis.",
        variant: "destructive"
      })
    }
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

      <SchedulerStats schedules={schedules} />

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
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{schedule.focus_keyword}</h3>
                            <Badge variant={schedule.active ? "default" : "secondary"}>
                              {schedule.active ? "Actief" : "Gepauzeerd"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {schedule.article_type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Interval:</span>{" "}
                              <span className="font-medium">{formatInterval(schedule.interval_seconds)}</span>
                            </div>
                            {schedule.website_url && (
                              <div>
                                <span className="text-muted-foreground">Website:</span>{" "}
                                <span className="font-medium text-xs">{schedule.website_url}</span>
                              </div>
                            )}
                            {schedule.language && (
                              <div>
                                <span className="text-muted-foreground">Taal:</span>{" "}
                                <span className="font-medium uppercase">{schedule.language}</span>
                              </div>
                            )}
                            {schedule.country && (
                              <div>
                                <span className="text-muted-foreground">Land:</span>{" "}
                                <span className="font-medium uppercase">{schedule.country}</span>
                              </div>
                            )}
                          </div>

                          {schedule.extra_keywords && schedule.extra_keywords.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Extra Keywords:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {schedule.extra_keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {schedule.extra_headings && schedule.extra_headings.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Extra Koppen:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {schedule.extra_headings.map((heading, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {heading}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-1">
                            {schedule.last_run_at && (
                              <span>Laatst: {new Date(schedule.last_run_at).toLocaleString('nl-NL')}</span>
                            )}
                            {schedule.next_run_at && (
                              <span>Volgende: {new Date(schedule.next_run_at).toLocaleString('nl-NL')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={schedule.active}
                          onCheckedChange={() => handleToggleSchedule(schedule.id, schedule.active)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleSchedule(schedule.id, schedule.active)}>
                              {schedule.active ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pauzeren
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Activeren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteSchedule(schedule.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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