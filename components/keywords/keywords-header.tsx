"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Upload, Download, Search } from "lucide-react"
import { useState } from "react"
import { AddKeywordDialog } from "./add-keyword-dialog"
import Link from "next/link"

export function KeywordsHeader() {
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <h1 className="text-lg font-semibold text-slate-900">Keywords</h1>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search keywords..." className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Keywords
            </Button>
          </div>
        </div>
      </div>

      <AddKeywordDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </header>
  )
}
