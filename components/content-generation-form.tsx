"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wand2, Plus, X } from "lucide-react"

interface ContentGenerationFormProps {
  onGenerate: (data: {
    focusKeyword: string
    country: string
    language: string
    webpageLink: string
    company: string
    additionalKeywords?: string
    additionalHeadings?: string
    articleType?: string
  }) => void
  isLoading: boolean
  initialData?: {
    focusKeyword: string
    country: string
    language: string
    webpageLink: string
    company: string
    additionalKeywords: string
    additionalHeadings: string
    articleType: string
  } | null
}

export function ContentGenerationForm({ onGenerate, isLoading, initialData }: ContentGenerationFormProps) {
  const [formData, setFormData] = useState({
    focusKeyword: initialData?.focusKeyword || "",
    country: initialData?.country || "",
    language: initialData?.language || "",
    webpageLink: initialData?.webpageLink || "",
    company: initialData?.company || "",
    additionalKeywords: initialData?.additionalKeywords || "",
    additionalHeadings: initialData?.additionalHeadings || "",
    articleType: initialData?.articleType || "",
  })
  const [keywords, setKeywords] = useState<string[]>(
    initialData?.additionalKeywords ? initialData.additionalKeywords.split(',').map(k => k.trim()).filter(Boolean) : []
  )
  const [newKeyword, setNewKeyword] = useState("")
  const [headings, setHeadings] = useState<string[]>(
    initialData?.additionalHeadings ? initialData.additionalHeadings.split(',').map(h => h.trim()).filter(Boolean) : []
  )
  const [newHeading, setNewHeading] = useState("")

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        focusKeyword: initialData.focusKeyword || "",
        country: initialData.country || "",
        language: initialData.language || "",
        webpageLink: initialData.webpageLink || "",
        company: initialData.company || "",
        additionalKeywords: initialData.additionalKeywords || "",
        additionalHeadings: initialData.additionalHeadings || "",
        articleType: initialData.articleType || "",
      })
      setKeywords(
        initialData.additionalKeywords ? initialData.additionalKeywords.split(',').map(k => k.trim()).filter(Boolean) : []
      )
      setHeadings(
        initialData.additionalHeadings ? initialData.additionalHeadings.split(',').map(h => h.trim()).filter(Boolean) : []
      )
    }
  }, [initialData])

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...keywords, newKeyword.trim()]
      setKeywords(updatedKeywords)
      setFormData((prev) => ({ ...prev, additionalKeywords: updatedKeywords.join(", ") }))
      setNewKeyword("")
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    const updatedKeywords = keywords.filter(k => k !== keywordToRemove)
    setKeywords(updatedKeywords)
    setFormData((prev) => ({ ...prev, additionalKeywords: updatedKeywords.join(", ") }))
  }

  const addHeading = () => {
    if (newHeading.trim() && !headings.includes(newHeading.trim())) {
      const updatedHeadings = [...headings, newHeading.trim()]
      setHeadings(updatedHeadings)
      setFormData((prev) => ({ ...prev, additionalHeadings: updatedHeadings.join(", ") }))
      setNewHeading("")
    }
  }

  const removeHeading = (headingToRemove: string) => {
    const updatedHeadings = headings.filter(h => h !== headingToRemove)
    setHeadings(updatedHeadings)
    setFormData((prev) => ({ ...prev, additionalHeadings: updatedHeadings.join(", ") }))
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
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="additionalKeywords"
                    placeholder="bijv. SEO tips"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-11 flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    disabled={!newKeyword.trim() || isLoading}
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
                          disabled={isLoading}
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
              <Label htmlFor="additionalHeadings" className="text-sm font-medium">
                Aanvullende Headings
              </Label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    id="additionalHeadings"
                    placeholder="bijv. Wat is digitale marketing?"
                    value={newHeading}
                    onChange={(e) => setNewHeading(e.target.value)}
                    onKeyPress={handleHeadingKeyPress}
                    className="h-11 flex-1"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    onClick={addHeading}
                    disabled={!newHeading.trim() || isLoading}
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
                          disabled={isLoading}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
