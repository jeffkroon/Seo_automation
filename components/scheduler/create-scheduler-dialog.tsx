"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface CreateSchedulerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSchedulerDialog({ open, onOpenChange }: CreateSchedulerDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [schedule, setSchedule] = useState("")
  const [projects, setProjects] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [description, setDescription] = useState("")

  const schedulePresets = [
    { label: "Every hour", value: "0 * * * *" },
    { label: "Daily at 6 AM", value: "0 6 * * *" },
    { label: "Daily at 9 AM", value: "0 9 * * *" },
    { label: "Weekly (Mondays)", value: "0 9 * * 1" },
    { label: "Weekly (Fridays)", value: "0 9 * * 5" },
    { label: "Monthly (1st)", value: "0 9 1 * *" },
    { label: "Custom", value: "custom" },
  ]

  const taskTypes = [
    { label: "Rank Tracking", value: "rank_tracking", description: "Monitor keyword positions" },
    { label: "SERP Analysis", value: "serp_analysis", description: "Analyze search results" },
    { label: "Content Generation", value: "content_generation", description: "Generate SEO content" },
    { label: "Competitor Analysis", value: "competitor_analysis", description: "Track competitor rankings" },
    { label: "Keyword Research", value: "keyword_research", description: "Discover new keywords" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle scheduler creation logic here
    console.log("Creating scheduler:", { name, type, schedule, projects, isActive, description })
    onOpenChange(false)
    // Reset form
    setName("")
    setType("")
    setSchedule("")
    setProjects([])
    setIsActive(true)
    setDescription("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Schedule</DialogTitle>
          <DialogDescription>Set up automated SEO tasks to run on a schedule.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Daily Rank Tracking"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Task Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  {taskTypes.map((taskType) => (
                    <SelectItem key={taskType.value} value={taskType.value}>
                      {taskType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {type && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Task Configuration</CardTitle>
                <CardDescription>{taskTypes.find((t) => t.value === type)?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Projects</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select projects to include" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                      <SelectItem value="blog">Tech Blog</SelectItem>
                      <SelectItem value="local">Local Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "rank_tracking" && (
                  <div className="space-y-2">
                    <Label>Search Engines</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked />
                        <span className="text-sm">Google</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" />
                        <span className="text-sm">Bing</span>
                      </label>
                    </div>
                  </div>
                )}

                {type === "serp_analysis" && (
                  <div className="space-y-2">
                    <Label>Analysis Depth</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select depth" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top10">Top 10 Results</SelectItem>
                        <SelectItem value="top20">Top 20 Results</SelectItem>
                        <SelectItem value="top50">Top 50 Results</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            <Label htmlFor="schedule">Schedule</Label>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger>
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedulePresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {schedule === "custom" && (
              <div className="mt-2">
                <Input placeholder="Enter cron expression (e.g., 0 6 * * *)" />
                <p className="text-xs text-slate-500 mt-1">Use cron format: minute hour day month weekday</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add notes about this schedule..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="active">Start schedule immediately</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Schedule</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
