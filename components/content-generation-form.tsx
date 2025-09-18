"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2 } from "lucide-react"

interface ContentGenerationFormProps {
  onGenerate: (data: {
    focusKeyword: string
    country: string
    language: string
    webpageLink: string
    company: string
    additionalKeywords?: string
    articleType?: string
  }) => void
  isLoading: boolean
}

export function ContentGenerationForm({ onGenerate, isLoading }: ContentGenerationFormProps) {
  const [formData, setFormData] = useState({
    focusKeyword: "",
    country: "",
    language: "",
    webpageLink: "",
    company: "",
    additionalKeywords: "",
    articleType: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onGenerate(formData)
  }

  const requiredFields = {
    focusKeyword: formData.focusKeyword,
    country: formData.country,
    language: formData.language,
    webpageLink: formData.webpageLink,
    company: formData.company,
  }
  const isFormValid = Object.values(requiredFields).every((value) => value.trim() !== "")

  return (
    <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          <Wand2 className="w-6 h-6 text-primary" />
          SEO Content Parameters
        </CardTitle>
        <CardDescription className="text-base">
          Vul de onderstaande gegevens in om SEO-geoptimaliseerde artikelen te genereren
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="focusKeyword" className="text-sm font-medium">
                Focus Keyword (Focus Zoekwoord) *
              </Label>
              <Input
                id="focusKeyword"
                placeholder="bijv. digitale marketing"
                value={formData.focusKeyword}
                onChange={(e) => setFormData((prev) => ({ ...prev, focusKeyword: e.target.value }))}
                className="h-11"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium">
                Land/Regio *
              </Label>
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecteer land" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Netherlands</SelectItem>
                  <SelectItem value="be">Belgium</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                  <SelectItem value="fr">France</SelectItem>
                  <SelectItem value="gb">United Kingdom</SelectItem>
                  <SelectItem value="us">United States</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-sm font-medium">
                Taal *
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecteer taal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">
                Bedrijfsnaam *
              </Label>
              <Input
                id="company"
                placeholder="bijv. Uw Bedrijf BV"
                value={formData.company}
                onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                className="h-11"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webpageLink" className="text-sm font-medium">
              Website URL *
            </Label>
            <Input
              id="webpageLink"
              type="url"
              placeholder="https://uwwebsite.nl"
              value={formData.webpageLink}
              onChange={(e) => setFormData((prev) => ({ ...prev, webpageLink: e.target.value }))}
              className="h-11"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="additionalKeywords" className="text-sm font-medium">
                Aanvullende Zoekwoorden
              </Label>
              <Input
                id="additionalKeywords"
                placeholder="bijv. SEO tips, marketing strategie, content"
                value={formData.additionalKeywords}
                onChange={(e) => setFormData((prev) => ({ ...prev, additionalKeywords: e.target.value }))}
                className="h-11"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Scheid meerdere zoekwoorden met komma's
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="articleType" className="text-sm font-medium">
                Soort Artikel
              </Label>
              <Select
                value={formData.articleType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, articleType: value }))}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecteer artikel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informatief">Informatief</SelectItem>
                  <SelectItem value="transactioneel">Transactioneel</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Informatief: educatief en informatief. Transactioneel: verkoopgericht
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90 transition-all duration-200"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Artikelen Genereren...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Genereer SEO Artikelen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
