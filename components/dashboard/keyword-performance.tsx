import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

const keywords = [
  { keyword: "seo automation", rank: 3, change: 2, volume: 8900 },
  { keyword: "keyword tracking", rank: 7, change: -1, volume: 5400 },
  { keyword: "serp analysis", rank: 12, change: 5, volume: 3200 },
  { keyword: "content optimization", rank: 8, change: 3, volume: 4100 },
  { keyword: "rank monitoring", rank: 15, change: -2, volume: 2800 },
]

export function KeywordPerformance() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Keywords</CardTitle>
        <CardDescription>Best performing keywords this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {keywords.map((keyword) => (
            <div key={keyword.keyword} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-slate-900">{keyword.keyword}</p>
                <p className="text-sm text-slate-500">{keyword.volume.toLocaleString()} searches/mo</p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">#{keyword.rank}</Badge>
                <div className="flex items-center space-x-1">
                  {keyword.change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={`text-xs ${keyword.change > 0 ? "text-green-600" : "text-red-600"}`}>
                    {Math.abs(keyword.change)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
