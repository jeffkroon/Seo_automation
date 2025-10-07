"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { useState } from "react"

export function KeywordFilters() {
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter((f) => f !== filter))
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Project:</span>
          <Select>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              <SelectItem value="ecommerce">E-commerce Store</SelectItem>
              <SelectItem value="blog">Tech Blog</SelectItem>
              <SelectItem value="local">Local Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Position:</span>
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any position</SelectItem>
              <SelectItem value="top3">Top 3</SelectItem>
              <SelectItem value="top10">Top 10</SelectItem>
              <SelectItem value="top20">Top 20</SelectItem>
              <SelectItem value="beyond20">Beyond 20</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-slate-700">Status:</span>
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Active" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm">
          Clear Filters
        </Button>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-200">
          <span className="text-sm text-slate-600">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge key={filter} variant="secondary" className="flex items-center gap-1">
              {filter}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeFilter(filter)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
