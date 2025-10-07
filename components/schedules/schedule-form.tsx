"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"

interface CompanyOption {
  id: string
  name: string
}

interface ScheduleFormProps {
  companies: CompanyOption[]
  onRefresh?: () => void
}

export function ScheduleForm({ companies, onRefresh }: ScheduleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [active, setActive] = useState(true)
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState("")
  const [headings, setHeadings] = useState<string[]>([])
  const [newHeading, setNewHeading] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  const hasCompanies = companies.length > 0

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...keywords, newKeyword.trim()]
      setKeywords(updatedKeywords)
      setNewKeyword("")
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(k => k !== keywordToRemove)
    setKeywords(updatedKeywords)
  }

  const addHeading = () => {
    if (newHeading.trim() && !headings.includes(newHeading.trim())) {
      const updatedHeadings = [...headings, newHeading.trim()]
      setHeadings(updatedHeadings)
      setNewHeading("")
    }
  }

  const removeHeading = (headingToRemove: string) => {
    const updatedHeadings = headings.filter(h => h !== headingToRemove)
    setHeadings(updatedHeadings)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
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

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true)
    setSubmitMessage(null)

    try {
      const languageRaw = (formData.get('language') || '').toString().trim().toLowerCase()
      const countryRaw = (formData.get('country') || '').toString().trim().toLowerCase()
      const language = languageRaw === 'en' ? 'en' : 'nl'
      const country = countryRaw === 'en' ? 'en' : countryRaw === 'us' ? 'us' : 'nl'

      const companyId = formData.get('companyId')?.toString() || null
      const companyNameInput = formData.get('companyName')?.toString().trim() || ''
      const derivedCompanyName = companyId
        ? companies.find((company) => company.id === companyId)?.name ?? ''
        : ''

      const payload = {
        companyId,
        focusKeyword: formData.get('focusKeyword') || '',
        extraKeywords: keywords.join(', '),
        extraHeadings: headings.join(', '),
        language,
        country,
        articleType: formData.get('articleType') || '',
        websiteUrl: formData.get('websiteUrl') || '',
        companyName: companyNameInput || derivedCompanyName,
        intervalSeconds: formData.get('intervalSeconds') || '',
        nextRunAt: formData.get('nextRunAt') || undefined,
        active,
      }

      console.log('Submitting schedule:', payload)

      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Company-Id': companyId || ''
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error('Failed to create schedule', errorText)
        setSubmitMessage({
          type: 'error',
          text: `Fout bij opslaan: ${errorText}`
        })
        return
      }

      // Success!
      setSubmitMessage({
        type: 'success',
        text: 'Schedule succesvol opgeslagen!'
      })

      // Reset form
      setActive(true)
      setKeywords([])
      setHeadings([])
      setNewKeyword("")
      setNewHeading("")

      // Refresh data
      if (onRefresh) {
        onRefresh()
      } else {
        startTransition(() => router.refresh())
      }

    } catch (error) {
      console.error('Error creating schedule:', error)
      setSubmitMessage({
        type: 'error',
        text: 'Er is een onverwachte fout opgetreden'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card/80 backdrop-blur-sm p-6"
      onSubmit={async (event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        await handleSubmit(formData)
        // Don't reset here - handleSubmit handles the reset
      }}
    >
      {!hasCompanies && (
        <p className="rounded-lg border border-dashed border-amber-400/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
          Er zijn nog geen bedrijven beschikbaar in Supabase. Voeg eerst een record toe aan <code>public.companies</code>
          zodat je het schedule kunt koppelen aan een bedrijf.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyId">Company</Label>
          <Select name="companyId" defaultValue={companies[0]?.id} disabled={!hasCompanies}>
            <SelectTrigger id="companyId">
              <SelectValue placeholder="Selecteer een bedrijf" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="focusKeyword">Focus Keyword</Label>
          <Input id="focusKeyword" name="focusKeyword" placeholder="bijv. kniebrace" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="language">Taal</Label>
          <Select name="language" defaultValue="nl">
            <SelectTrigger id="language">
              <SelectValue placeholder="Selecteer taal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">NL</SelectItem>
              <SelectItem value="en">EN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Land</Label>
          <Select name="country" defaultValue="nl">
            <SelectTrigger id="country">
              <SelectValue placeholder="Selecteer land" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nl">NL</SelectItem>
              <SelectItem value="en">EN</SelectItem>
              <SelectItem value="us">US</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="extraKeywords">Extra zoekwoorden</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id="extraKeywords"
                placeholder="bijv. SEO tips"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="h-11 flex-1"
                disabled={isPending}
              />
              <Button
                type="button"
                onClick={addKeyword}
                disabled={!newKeyword.trim() || isPending}
                className="h-11 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(keyword)}
                      disabled={isPending}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Voeg zoekwoorden één voor één toe met Enter of de + knop
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="extraHeadings">Extra headings</Label>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                id="extraHeadings"
                placeholder="bijv. Wat is digitale marketing?"
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                onKeyPress={handleHeadingKeyPress}
                className="h-11 flex-1"
                disabled={isPending}
              />
              <Button
                type="button"
                onClick={addHeading}
                disabled={!newHeading.trim() || isPending}
                className="h-11 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {headings.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {headings.map((heading, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {heading}
                    <button
                      type="button"
                      onClick={() => removeHeading(heading)}
                      disabled={isPending}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Voeg headings één voor één toe met Enter of de + knop
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="articleType">Artikeltype</Label>
          <Select name="articleType" defaultValue="informatief">
            <SelectTrigger id="articleType">
              <SelectValue placeholder="Selecteer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="informatief">Informatief</SelectItem>
              <SelectItem value="transactioneel">Transactioneel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input id="websiteUrl" name="websiteUrl" placeholder="https://" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyName">Bedrijfsnaam</Label>
          <Input id="companyName" name="companyName" placeholder="Podobrace" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intervalSeconds">Interval (seconden)</Label>
          <Input id="intervalSeconds" name="intervalSeconds" type="number" min={300} defaultValue={86400} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextRunAt">Volgende run (ISO)</Label>
          <Input id="nextRunAt" name="nextRunAt" placeholder="2025-10-01T08:00:00Z" />
        </div>
      </div>

      {submitMessage && (
        <div className={`rounded-lg p-3 text-sm ${
          submitMessage.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {submitMessage.text}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch id="active" checked={active} onCheckedChange={setActive} disabled={isSubmitting} />
          <Label htmlFor="active">Schedule actief</Label>
        </div>
        <Button type="submit" disabled={isSubmitting || !hasCompanies}>
          {isSubmitting ? 'Opslaan…' : 'Schedule opslaan'}
        </Button>
      </div>
    </form>
  )
}
