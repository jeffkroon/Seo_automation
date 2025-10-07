import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, FileText } from "lucide-react"

export function DashboardStats() {
  const stats = [
    {
      title: "Total Keywords",
      value: "1,247",
      change: "+12%",
      trend: "up",
      icon: Target,
    },
    {
      title: "Avg. Ranking",
      value: "8.3",
      change: "-2.1",
      trend: "down",
      icon: TrendingUp,
    },
    {
      title: "Top 10 Rankings",
      value: "342",
      change: "+18%",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Content Drafts",
      value: "23",
      change: "+5",
      trend: "up",
      icon: FileText,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            <div className="flex items-center space-x-1 text-xs">
              {stat.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={stat.trend === "up" ? "text-green-600" : "text-red-600"}>{stat.change}</span>
              <span className="text-slate-500">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
