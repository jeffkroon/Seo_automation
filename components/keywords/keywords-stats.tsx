import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Target, Eye } from "lucide-react"

export function KeywordsStats() {
  const stats = [
    {
      title: "Total Keywords",
      value: "1,247",
      change: "+23 this week",
      trend: "up",
      icon: Target,
    },
    {
      title: "Average Position",
      value: "8.3",
      change: "-1.2 from last week",
      trend: "down",
      icon: TrendingUp,
    },
    {
      title: "Top 3 Rankings",
      value: "89",
      change: "+12 this week",
      trend: "up",
      icon: TrendingUp,
    },
    {
      title: "Total Search Volume",
      value: "2.4M",
      change: "+156K this month",
      trend: "up",
      icon: Eye,
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
