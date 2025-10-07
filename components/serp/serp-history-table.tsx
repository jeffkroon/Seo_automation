"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, MoreHorizontal } from "lucide-react"

const historyData = [
  {
    id: "1",
    keyword: "seo automation tools",
    location: "United States",
    device: "Desktop",
    analyzedAt: "2024-01-15 14:30:00",
    resultsCount: 10,
    topDomain: "example.com",
    features: ["Featured Snippet", "Video"],
    status: "completed",
  },
  {
    id: "2",
    keyword: "keyword research software",
    location: "United Kingdom",
    device: "Mobile",
    analyzedAt: "2024-01-15 12:15:00",
    resultsCount: 10,
    topDomain: "competitor.com",
    features: ["Images", "FAQ"],
    status: "completed",
  },
  {
    id: "3",
    keyword: "serp analysis tool",
    location: "Canada",
    device: "Desktop",
    analyzedAt: "2024-01-15 09:45:00",
    resultsCount: 8,
    topDomain: "seotools.com",
    features: ["Reviews"],
    status: "completed",
  },
  {
    id: "4",
    keyword: "content optimization",
    location: "United States",
    device: "Mobile",
    analyzedAt: "2024-01-14 16:20:00",
    resultsCount: 10,
    topDomain: "marketing.example.org",
    features: ["Table", "Video"],
    status: "failed",
  },
]

export function SerpHistoryTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis History ({historyData.length} records)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Analyzed At</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Top Domain</TableHead>
              <TableHead>Features</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyData.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <span className="font-medium text-slate-900">{record.keyword}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{record.location}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{record.device}</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{new Date(record.analyzedAt).toLocaleString()}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-slate-600">{record.resultsCount} results</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-green-600">{record.topDomain}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {record.features.slice(0, 2).map((feature) => (
                      <Badge key={feature} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {record.features.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{record.features.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={record.status === "completed" ? "default" : "destructive"}>{record.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
