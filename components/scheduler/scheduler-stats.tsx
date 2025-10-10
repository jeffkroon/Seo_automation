"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react"

interface Schedule {
  id: string
  focus_keyword: string
  active: boolean
  last_run_at?: string
  next_run_at?: string
}

interface SchedulerStatsProps {
  schedules: Schedule[]
}

export function SchedulerStats({ schedules }: SchedulerStatsProps) {
  // Calculate stats from real data
  const activeSchedules = schedules.filter(s => s.active).length
  
  // Count completed today (schedules that ran in last 24 hours)
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const completedToday = schedules.filter(s => {
    if (!s.last_run_at) return false
    const lastRun = new Date(s.last_run_at)
    return lastRun >= todayStart
  }).length

  // Find next scheduled run
  const upcomingSchedules = schedules
    .filter(s => s.active && s.next_run_at)
    .sort((a, b) => {
      const aTime = new Date(a.next_run_at!).getTime()
      const bTime = new Date(b.next_run_at!).getTime()
      return aTime - bTime
    })
  
  const nextRun = upcomingSchedules[0]
  const nextRunTime = nextRun?.next_run_at 
    ? new Date(nextRun.next_run_at).toLocaleTimeString('nl-NL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    : '-'
  const nextRunKeyword = nextRun?.focus_keyword || 'Geen geplande runs'

  const stats = [
    {
      title: "Actieve Schedulers",
      value: activeSchedules.toString(),
      description: "Momenteel actief",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Gedraaid Vandaag",
      value: completedToday.toString(),
      description: "Voltooide taken",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Totaal Schedulers",
      value: schedules.length.toString(),
      description: "Voor deze client",
      icon: AlertCircle,
      color: "text-purple-600",
    },
    {
      title: "Volgende Run",
      value: nextRunTime,
      description: nextRunKeyword.substring(0, 25),
      icon: Calendar,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground truncate">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
