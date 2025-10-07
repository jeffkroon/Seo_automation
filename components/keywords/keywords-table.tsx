"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useState } from "react"

const mockKeywords = [
  {
    id: "1",
    keyword: "seo automation tools",
    project: "E-commerce Store",
    currentRank: 3,
    previousRank: 5,
    searchVolume: 8900,
    difficulty: 65,
    status: "active",
    lastUpdated: "2 hours ago",
  },
  {
    id: "2",
    keyword: "keyword research software",
    project: "Tech Blog",
    currentRank: 7,
    previousRank: 8,
    searchVolume: 5400,
    difficulty: 72,
    status: "active",
    lastUpdated: "4 hours ago",
  },
  {
    id: "3",
    keyword: "serp analysis tool",
    project: "E-commerce Store",
    currentRank: 12,
    previousRank: 17,
    searchVolume: 3200,
    difficulty: 58,
    status: "active",
    lastUpdated: "1 day ago",
  },
  {
    id: "4",
    keyword: "content optimization",
    project: "Local Business",
    currentRank: 8,
    previousRank: 11,
    searchVolume: 4100,
    difficulty: 45,
    status: "paused",
    lastUpdated: "2 days ago",
  },
  {
    id: "5",
    keyword: "rank tracking software",
    project: "Tech Blog",
    currentRank: 15,
    previousRank: 13,
    searchVolume: 2800,
    difficulty: 68,
    status: "active",
    lastUpdated: "6 hours ago",
  },
]

export function KeywordsTable() {
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])

  const getRankTrend = (current: number, previous: number) => {
    if (current < previous) return { icon: TrendingUp, color: "text-green-500", change: previous - current }
    if (current > previous) return { icon: TrendingDown, color: "text-red-500", change: current - previous }
    return { icon: Minus, color: "text-slate-400", change: 0 }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 70) return "bg-red-100 text-red-800"
    if (difficulty >= 50) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Keywords ({mockKeywords.length})</h2>
          {selectedKeywords.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">{selectedKeywords.length} selected</span>
              <Button variant="outline" size="sm">
                Bulk Actions
              </Button>
            </div>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                className="rounded border-slate-300"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedKeywords(mockKeywords.map((k) => k.id))
                  } else {
                    setSelectedKeywords([])
                  }
                }}
              />
            </TableHead>
            <TableHead>Keyword</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Current Rank</TableHead>
            <TableHead>Search Volume</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockKeywords.map((keyword) => {
            const trend = getRankTrend(keyword.currentRank, keyword.previousRank)
            return (
              <TableRow key={keyword.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={selectedKeywords.includes(keyword.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedKeywords([...selectedKeywords, keyword.id])
                      } else {
                        setSelectedKeywords(selectedKeywords.filter((id) => id !== keyword.id))
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{keyword.keyword}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{keyword.project}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-900">#{keyword.currentRank}</span>
                    <div className="flex items-center space-x-1">
                      <trend.icon className={`h-3 w-3 ${trend.color}`} />
                      {trend.change > 0 && <span className={`text-xs ${trend.color}`}>{trend.change}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{keyword.searchVolume.toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <Badge className={getDifficultyColor(keyword.difficulty)}>{keyword.difficulty}%</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={keyword.status === "active" ? "default" : "secondary"}>{keyword.status}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-500">{keyword.lastUpdated}</span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
