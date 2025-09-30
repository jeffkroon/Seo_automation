"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CompanyOption {
  id: string
  name: string
}

interface ScheduleFormProps {
  companies: CompanyOption[]
}

export function ScheduleForm({ companies }: ScheduleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [active, setActive] = useState(true)

  const hasCompanies = companies.length > 0

  async function handleSubmit(formData: FormData) {
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
      extraKeywords: formData.get('extraKeywords') || '',
      language,
      country,
      articleType: formData.get('articleType') || '',
      websiteUrl: formData.get('websiteUrl') || '',
      companyName: companyNameInput || derivedCompanyName,
      intervalSeconds: formData.get('intervalSeconds') || '',
      nextRunAt: formData.get('nextRunAt') || undefined,
      active,
    }

    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      console.error('Failed to create schedule', await res.text())
      return
    }

    setActive(true)
    startTransition(() => router.refresh())
  }

  return (
    <form
      className="grid gap-4 rounded-xl border bg-card/80 backdrop-blur-sm p-6"
      onSubmit={async (event) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        await handleSubmit(formData)
        event.currentTarget.reset()
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
          <Input id="extraKeywords" name="extraKeywords" placeholder="scheid met komma's" />
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

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active">Schedule actief</Label>
        </div>
        <Button type="submit" disabled={isPending || !hasCompanies}>
          {isPending ? 'Opslaan…' : 'Schedule opslaan'}
        </Button>
      </div>
    </form>
  )
}
