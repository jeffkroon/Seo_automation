"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { MoreHorizontal, Clock, Target, FileText, BarChart3 } from "lucide-react"

const schedules = [
  {
    id: "1",
    name: "Daily Rank Tracking",
    type: "rank_tracking",
    schedule: "0 6 * * *",
    scheduleText: "Daily at 6:00 AM",
    isActive: true,
    lastRun: "2024-01-15 06:00:00",
    nextRun: "2024-01-16 06:00:00",
    status: "success",
    projects: ["E-commerce Store", "Tech Blog"],
  },
  {
    id: "2",
    name: "Weekly SERP Analysis",
    type: "serp_analysis",
    schedule: "0 9 * * 1",
    scheduleText: "Mondays at 9:00 AM",
    isActive: true,
    lastRun: "2024-01-15 09:00:00",
    nextRun: "2024-01-22 09:00:00",
    status: "success",
    projects: ["Local Business"],
  },
  {
    id: "3",
    name: "Content Generation",
    type: "content_generation",
    schedule: "0 14 * * 3",
    scheduleText: "Wednesdays at 2:00 PM",
    isActive: false,
    lastRun: "2024-01-10 14:00:00",
    nextRun: null,
    status: "paused",
    projects: ["Tech Blog"],
  },
  {
    id: "4",
    name: "Competitor Analysis",
    type: "competitor_analysis",
    schedule: "0 12 1 * *",
    scheduleText: "1st of month at 12:00 PM",
    isActive: true,
    lastRun: "2024-01-01 12:00:00",
    nextRun: "2024-02-01 12:00:00",
    status: "failed",
    projects: ["E-commerce Store"],
  },
]

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

const getStatusColor = (status: string) => {
  switch (status) {
    case "success":
      return "bg-green-100 text-green-800"
    case "failed":
      return "bg-red-100 text-red-800"
    case "paused":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-blue-100 text-blue-800"
  }
}

export function SchedulerList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Jobs</CardTitle>
        <CardDescription>Manage your automated SEO tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const TypeIcon = getTypeIcon(schedule.type)
            return (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <TypeIcon className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium text-slate-900">{schedule.name}</h3>
                      <Badge className={getStatusColor(schedule.status)}>{schedule.status}</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-600">{schedule.scheduleText}</p>
                      <p className="text-xs text-slate-500">Projects: {schedule.projects.join(", ")}</p>
                      <div className="flex items-center space-x-4 text-xs text-slate-400">
                        <span>Last: {new Date(schedule.lastRun).toLocaleString()}</span>
                        {schedule.nextRun && <span>Next: {new Date(schedule.nextRun).toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch checked={schedule.isActive} />
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
