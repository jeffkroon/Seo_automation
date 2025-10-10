"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useClientContext } from "@/hooks/use-client-context"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { Plus, X } from "lucide-react"

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
  const [webpageLink, setWebpageLink] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [headings, setHeadings] = useState<string[]>([])
  const [newHeading, setNewHeading] = useState("")
  const [articleType, setArticleType] = useState("informatief")
  const [language, setLanguage] = useState("nl")
  const [country, setCountry] = useState("nl")
  const [intervalDays, setIntervalDays] = useState("1")

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove))
  }

  const addHeading = () => {
    if (newHeading.trim() && !headings.includes(newHeading.trim())) {
      setHeadings([...headings, newHeading.trim()])
      setNewHeading("")
    }
  }

  const removeHeading = (headingToRemove: string) => {
    setHeadings(headings.filter(h => h !== headingToRemove))
  }

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  const handleHeadingKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addHeading()
    }
  }

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
          extraKeywords: keywords,
          extraHeadings: headings,
          articleType,
          language,
          country,
          companyName: selectedClient.naam,
          websiteUrl: webpageLink || selectedClient.website_url || '',
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
    setWebpageLink("")
    setKeywords([])
    setNewKeyword("")
    setHeadings([])
    setNewHeading("")
    setArticleType("informatief")
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="focusKeyword">Focus Keyword *</Label>
              <Input
                id="focusKeyword"
                placeholder="bijv. digitale marketing"
                value={focusKeyword}
                onChange={(e) => setFocusKeyword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webpageLink">Website Link *</Label>
              <Input
                id="webpageLink"
                placeholder="https://example.com"
                value={webpageLink}
                onChange={(e) => setWebpageLink(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Extra Keywords (optioneel)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Voeg keyword toe en druk Enter"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                disabled={isLoading}
              />
              <Button 
                type="button" 
                onClick={addKeyword} 
                variant="outline" 
                size="icon"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      className="ml-1 hover:text-destructive"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Extra Koppen (optioneel)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Voeg kop toe en druk Enter"
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                onKeyPress={handleHeadingKeyPress}
                disabled={isLoading}
              />
              <Button 
                type="button" 
                onClick={addHeading} 
                variant="outline" 
                size="icon"
                disabled={isLoading}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {headings.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {headings.map((heading) => (
                  <Badge key={heading} variant="secondary" className="gap-1">
                    {heading}
                    <button
                      type="button"
                      onClick={() => removeHeading(heading)}
                      className="ml-1 hover:text-destructive"
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Taal *</Label>
              <Select value={language} onValueChange={setLanguage} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederlands</SelectItem>
                  <SelectItem value="en">Engels</SelectItem>
                  <SelectItem value="de">Duits</SelectItem>
                  <SelectItem value="fr">Frans</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Land *</Label>
              <Select value={country} onValueChange={setCountry} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Nederland</SelectItem>
                  <SelectItem value="be">België</SelectItem>
                  <SelectItem value="de">Duitsland</SelectItem>
                  <SelectItem value="fr">Frankrijk</SelectItem>
                  <SelectItem value="gb">Verenigd Koninkrijk</SelectItem>
                  <SelectItem value="us">Verenigde Staten</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="articleType">Type Artikel *</Label>
              <Select value={articleType} onValueChange={setArticleType} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informatief">Informatief</SelectItem>
                  <SelectItem value="transactioneel">Transactioneel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Informatief: educatief. Transactioneel: verkoopgericht
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intervalDays">Generatie Interval *</Label>
            <Select value={intervalDays} onValueChange={setIntervalDays} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Dagelijks</SelectItem>
                <SelectItem value="2">Om de 2 dagen</SelectItem>
                <SelectItem value="3">Om de 3 dagen</SelectItem>
                <SelectItem value="7">Wekelijks</SelectItem>
                <SelectItem value="14">Tweewekelijks</SelectItem>
                <SelectItem value="30">Maandelijks</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Hoe vaak moet er nieuw content gegenereerd worden?
            </p>
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

