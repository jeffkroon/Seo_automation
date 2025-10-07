import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, Target, BarChart3 } from "lucide-react"

const activeJobs = [
  {
    id: "1",
    name: "Rank Tracking - E-commerce",
    type: "rank_tracking",
    progress: 75,
    status: "running",
    startTime: "2024-01-15 14:30:00",
    estimatedCompletion: "2 minutes",
  },
  {
    id: "2",
    name: "SERP Analysis - Tech Blog",
    type: "serp_analysis",
    progress: 45,
    status: "running",
    startTime: "2024-01-15 14:25:00",
    estimatedCompletion: "5 minutes",
  },
  {
    id: "3",
    name: "Keyword Research",
    type: "keyword_research",
    progress: 100,
    status: "completed",
    startTime: "2024-01-15 14:20:00",
    estimatedCompletion: "Completed",
  },
]

const getTypeIcon = (type: string) => {
  switch (type) {
    case "rank_tracking":
      return Target
    case "serp_analysis":
      return BarChart3
    default:
      return Clock
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "running":
      return "bg-blue-100 text-blue-800"
    case "completed":
      return "bg-green-100 text-green-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function ActiveJobs() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Jobs</CardTitle>
        <CardDescription>Currently running tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeJobs.map((job) => {
            const TypeIcon = getTypeIcon(job.type)
            return (
              <div key={job.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className="h-4 w-4 text-slate-600" />
                    <span className="text-sm font-medium text-slate-900">{job.name}</span>
                  </div>
                  <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                </div>

                {job.status === "running" && (
                  <div className="space-y-2">
                    <Progress value={job.progress} className="h-2" />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{job.progress}% complete</span>
                      <span>ETA: {job.estimatedCompletion}</span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-400">Started: {new Date(job.startTime).toLocaleString()}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
