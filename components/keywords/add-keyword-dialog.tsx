"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddKeywordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddKeywordDialog({ open, onOpenChange }: AddKeywordDialogProps) {
  const [keywords, setKeywords] = useState("")
  const [project, setProject] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle keyword addition logic here
    console.log("Adding keywords:", keywords.split("\n").filter(Boolean))
    onOpenChange(false)
    setKeywords("")
    setProject("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Keywords</DialogTitle>
          <DialogDescription>Add new keywords to track their rankings and performance.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                    <SelectItem value="blog">Tech Blog</SelectItem>
                    <SelectItem value="local">Local Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Textarea
                  id="keywords"
                  placeholder="Enter keywords (one per line)&#10;seo automation&#10;keyword research&#10;rank tracking"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  rows={8}
                  required
                />
                <p className="text-sm text-slate-500">Enter one keyword per line</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Keywords</Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-bulk">Project</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce Store</SelectItem>
                    <SelectItem value="blog">Tech Blog</SelectItem>
                    <SelectItem value="local">Local Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Import File</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <Input type="file" accept=".csv,.txt" className="hidden" id="file-upload" />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <p className="text-sm text-slate-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-slate-500">CSV or TXT files only</p>
                    </div>
                  </Label>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button>Import Keywords</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
