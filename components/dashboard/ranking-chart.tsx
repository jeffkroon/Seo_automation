"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { date: "Jan", avgRank: 12.5, topTen: 45 },
  { date: "Feb", avgRank: 11.8, topTen: 52 },
  { date: "Mar", avgRank: 10.2, topTen: 68 },
  { date: "Apr", avgRank: 9.7, topTen: 74 },
  { date: "May", avgRank: 8.9, topTen: 89 },
  { date: "Jun", avgRank: 8.3, topTen: 95 },
]

export function RankingChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking Trends</CardTitle>
        <CardDescription>Average ranking position over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="avgRank" stroke="#3b82f6" strokeWidth={2} name="Avg Rank" />
            <Line type="monotone" dataKey="topTen" stroke="#10b981" strokeWidth={2} name="Top 10 Count" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
