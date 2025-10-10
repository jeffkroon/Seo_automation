"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useClientContext } from "@/hooks/use-client-context"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

interface CreateSchedulerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onScheduleCreated?: () => void
}

export function CreateSchedulerDialog({ open, onOpenChange, onScheduleCreated }: CreateSchedulerDialogProps) {
  const { selectedClient } = useClientContext()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  const [focusKeyword, setFocusKeyword] = useState("")
  const [extraKeywords, setExtraKeywords] = useState("")
  const [extraHeadings, setExtraHeadings] = useState("")
  const [articleType, setArticleType] = useState("informative")
  const [language, setLanguage] = useState("nl")
  const [country, setCountry] = useState("nl")
  const [intervalDays, setIntervalDays] = useState("1")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedClient || !user?.companyId) {
      toast({
        title: "Fout",
        description: "Selecteer een client om een scheduler aan te maken.",
        variant: "destructive"
      })
      return
    }

    if (!focusKeyword.trim()) {
      toast({
        title: "Fout",
        description: "Focus keyword is verplicht.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    try {
      const intervalSeconds = parseInt(intervalDays) * 24 * 60 * 60
      
      const response = await apiClient('/api/schedules', {
        method: 'POST',
        body: JSON.stringify({
          companyId: user.companyId,
          clientId: selectedClient.id,
          focusKeyword: focusKeyword.trim(),
          extraKeywords: extraKeywords.split(',').map(k => k.trim()).filter(Boolean),
          extraHeadings: extraHeadings.split(',').map(h => h.trim()).filter(Boolean),
          articleType,
          language,
          country,
          companyName: selectedClient.naam,
          websiteUrl: selectedClient.website_url || '',
          intervalSeconds,
          active: true
        })
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: "Scheduler is aangemaakt!"
        })
        onScheduleCreated?.()
        onOpenChange(false)
        resetForm()
      } else {
        const error = await response.json()
        toast({
          title: "Fout",
          description: error.error || "Kon scheduler niet aanmaken.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating scheduler:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het aanmaken van de scheduler.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFocusKeyword("")
    setExtraKeywords("")
    setExtraHeadings("")
    setArticleType("informative")
    setLanguage("nl")
    setCountry("nl")
    setIntervalDays("1")
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nieuwe Scheduler</DialogTitle>
          <DialogDescription>
            Maak een automatische content scheduler voor {selectedClient?.naam}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="focusKeyword">Focus Keyword *</Label>
            <Input
              id="focusKeyword"
              placeholder="bijv. SEO content schrijven"
              value={focusKeyword}
              onChange={(e) => setFocusKeyword(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraKeywords">Extra Keywords (optioneel)</Label>
            <Textarea
              id="extraKeywords"
              placeholder="Gescheiden door komma's, bijv: content marketing, blog schrijven"
              value={extraKeywords}
              onChange={(e) => setExtraKeywords(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extraHeadings">Extra Koppen (optioneel)</Label>
            <Textarea
              id="extraHeadings"
              placeholder="Gescheiden door komma's, bijv: Voordelen, Tips, Conclusie"
              value={extraHeadings}
              onChange={(e) => setExtraHeadings(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="articleType">Type Artikel</Label>
              <Select value={articleType} onValueChange={setArticleType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informative">Informatief</SelectItem>
                  <SelectItem value="tutorial">Tutorial</SelectItem>
                  <SelectItem value="listicle">Lijstartikel</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intervalDays">Interval (dagen)</Label>
              <Select value={intervalDays} onValueChange={setIntervalDays}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dagelijks</SelectItem>
                  <SelectItem value="7">Wekelijks</SelectItem>
                  <SelectItem value="14">Tweewekelijks</SelectItem>
                  <SelectItem value="30">Maandelijks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Taal</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederland</SelectItem>
                  <SelectItem value="en">Verenigd Koninkrijk</SelectItem>
                  <SelectItem value="us">Verenigde Staten</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Bezig..." : "Scheduler Aanmaken"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

