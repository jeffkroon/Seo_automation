import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, TrendingUp, FileText, Target } from "lucide-react"

const activities = [
  {
    type: "rank_update",
    message: "Keyword 'seo tools' moved to position 5",
    time: "2 minutes ago",
    icon: TrendingUp,
    color: "text-green-600",
  },
  {
    type: "content",
    message: "New content draft created for 'keyword research'",
    time: "1 hour ago",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    type: "keyword",
    message: "Added 15 new keywords to tracking",
    time: "3 hours ago",
    icon: Target,
    color: "text-purple-600",
  },
  {
    type: "rank_update",
    message: "Weekly rank report generated",
    time: "1 day ago",
    icon: Clock,
    color: "text-slate-600",
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates and changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`p-1 rounded-full ${activity.color}`}>
                <activity.icon className="h-3 w-3" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">{activity.message}</p>
                <p className="text-xs text-slate-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
