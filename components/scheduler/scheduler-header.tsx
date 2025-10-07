"use client"

import { Button } from "@/components/ui/button"
import { Plus, Play, Pause } from "lucide-react"
import { useState } from "react"
import { CreateSchedulerDialog } from "./create-scheduler-dialog"
import Link from "next/link"

export function SchedulerHeader() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <h1 className="text-lg font-semibold text-slate-900">Scheduler</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Pause className="h-4 w-4 mr-2" />
              Pause All
            </Button>
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-2" />
              Resume All
            </Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </div>
        </div>
      </div>

      <CreateSchedulerDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
    </header>
  )
}
