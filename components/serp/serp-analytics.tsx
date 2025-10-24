"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

const competitorData = [
  { name: "example.com", value: 25, color: "#3b82f6" },
  { name: "competitor.com", value: 20, color: "#10b981" },
  { name: "seotools.com", value: 15, color: "#f59e0b" },
  { name: "Others", value: 40, color: "#6b7280" },
]

const featureData = [
  { feature: "Featured Snippet", count: 1 },
  { feature: "Video", count: 1 },
  { feature: "Images", count: 1 },
  { feature: "FAQ", count: 1 },
  { feature: "Reviews", count: 1 },
]

export function SerpAnalytics() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SERP Overview</CardTitle>
          <CardDescription>Analysis summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Search Volume</span>
              <span className="font-medium">8,900/month</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Competition</span>
              <Badge variant="secondary">Medium</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">CPC</span>
              <span className="font-medium">$2.45</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Difficulty</span>
              <div className="flex items-center space-x-2">
                <Progress value={65} className="w-16 h-2" />
                <span className="text-sm font-medium">65%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Competitors</CardTitle>
          <CardDescription>Domain distribution in top 10</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={competitorData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {competitorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Share"]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {competitorData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SERP Features</CardTitle>
          <CardDescription>Rich results distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={featureData} layout="horizontal">
              <XAxis type="number" hide />
              <YAxis dataKey="feature" type="category" width={80} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opportunities</CardTitle>
          <CardDescription>Content gaps and improvements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-900">Featured Snippet Opportunity</p>
              <p className="text-xs text-orange-700 mt-1">Target FAQ format to compete for position 0</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900">Video Content Gap</p>
              <p className="text-xs text-green-700 mt-1">Add video content to improve engagement</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm font-medium text-yellow-900">Long-tail Keywords</p>
              <p className="text-xs text-yellow-700 mt-1">Target related long-tail variations</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
