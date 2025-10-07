import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react"

export function SchedulerStats() {
  const stats = [
    {
      title: "Active Schedules",
      value: "12",
      description: "Currently running",
      icon: Clock,
      color: "text-blue-600",
    },
    {
      title: "Completed Today",
      value: "47",
      description: "Jobs finished",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      title: "Failed Jobs",
      value: "3",
      description: "Need attention",
      icon: AlertCircle,
      color: "text-red-600",
    },
    {
      title: "Next Run",
      value: "2:30 PM",
      description: "Rank tracking",
      icon: Calendar,
      color: "text-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <p className="text-xs text-slate-500">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
