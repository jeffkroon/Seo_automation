"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Wand2, Plus, X, Trash2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface ContentPiece {
  id: string
  title?: string
  focusKeyword: string
  country: string
  language: string
  webpageLink: string
  company: string
  additionalKeywords: string[]
  additionalHeadings: string[]
  articleType: string
}

interface BatchContentFormProps {
  onGenerateSingle: (contentPiece: ContentPiece) => void
  isLoading: boolean
  loadingPieceIds?: Set<string>
  contentPieces: ContentPiece[]
  onUpdatePieces: (pieces: ContentPiece[]) => void
}

export function BatchContentForm({ onGenerateSingle, isLoading, loadingPieceIds = new Set(), contentPieces, onUpdatePieces }: BatchContentFormProps) {
  const { user } = useAuth()

  const createEmptyPiece = (): ContentPiece => ({
    id: Math.random().toString(36).substr(2, 9),
    title: "",
    focusKeyword: "",
    country: "",
    language: "",
    webpageLink: "",
    company: user?.companyName || "",
    additionalKeywords: [],
    additionalHeadings: [],
    articleType: "",
  })

  const [expandedItems, setExpandedItems] = useState<string[]>([])

  useEffect(() => {
    if (user?.companyName) {
      onUpdatePieces(contentPieces.map((piece) => ({ ...piece, company: user.companyName })))
    }
  }, [user?.companyName])

  // Auto-expand pieces that are loading OR first piece by default
  useEffect(() => {
    console.log('🔄 Accordion expand check:', { 
      loadingPieceIds: Array.from(loadingPieceIds), 
      expandedItems, 
      contentPieces: contentPieces.map(p => ({ id: p.id, title: p.title || p.focusKeyword }))
    })
    
    const itemsToExpand = new Set(expandedItems)
    let hasChanges = false
    
    // Expand all loading pieces
    contentPieces.forEach(piece => {
      if (loadingPieceIds.has(piece.id) && !itemsToExpand.has(piece.id)) {
        console.log(`📂 Auto-expanding loading piece: ${piece.title || piece.focusKeyword} (${piece.id})`)
        itemsToExpand.add(piece.id)
        hasChanges = true
      }
    })
    
    // If no items expanded yet and we have pieces, expand the first one
    if (itemsToExpand.size === 0 && contentPieces.length > 0) {
      console.log(`📂 Auto-expanding first piece: ${contentPieces[0].title || contentPieces[0].focusKeyword}`)
      itemsToExpand.add(contentPieces[0].id)
      hasChanges = true
    }
    
    if (hasChanges) {
      setExpandedItems(Array.from(itemsToExpand))
    }
  }, [loadingPieceIds, contentPieces])

  const addContentPiece = () => {
    const newPiece = createEmptyPiece()
    onUpdatePieces([...contentPieces, newPiece])
    setExpandedItems((prev) => [...prev, newPiece.id])
  }

  const removeContentPiece = (id: string) => {
    if (contentPieces.length === 1) return
    onUpdatePieces(contentPieces.filter((piece) => piece.id !== id))
    setExpandedItems((prev) => prev.filter((itemId) => itemId !== id))
  }

  const updatePiece = (id: string, updates: Partial<ContentPiece>) => {
    onUpdatePieces(contentPieces.map((piece) => (piece.id === id ? { ...piece, ...updates } : piece)))
  }

  const addKeyword = (pieceId: string, keyword: string) => {
    const piece = contentPieces.find((p) => p.id === pieceId)
    if (!piece || !keyword.trim() || piece.additionalKeywords.includes(keyword.trim())) return

    updatePiece(pieceId, {
      additionalKeywords: [...piece.additionalKeywords, keyword.trim()],
    })
  }

  const removeKeyword = (pieceId: string, keyword: string) => {
    const piece = contentPieces.find((p) => p.id === pieceId)
    if (!piece) return

    updatePiece(pieceId, {
      additionalKeywords: piece.additionalKeywords.filter((k) => k !== keyword),
    })
  }

  const addHeading = (pieceId: string, heading: string) => {
    const piece = contentPieces.find((p) => p.id === pieceId)
    if (!piece || !heading.trim() || piece.additionalHeadings.includes(heading.trim())) return

    updatePiece(pieceId, {
      additionalHeadings: [...piece.additionalHeadings, heading.trim()],
    })
  }

  const removeHeading = (pieceId: string, heading: string) => {
    const piece = contentPieces.find((p) => p.id === pieceId)
    if (!piece) return

    updatePiece(pieceId, {
      additionalHeadings: piece.additionalHeadings.filter((h) => h !== heading),
    })
  }


  return (
    <Card className="w-full shadow-sm border">
      <CardHeader className="pb-4 border-b bg-muted/30">
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Content Generator
        </CardTitle>
        <CardDescription className="text-sm">
          Genereer SEO-geoptimaliseerde artikelen met AI. Vul de details in en klik op generate.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="space-y-4">

          <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
            {contentPieces.map((piece, index) => (
              <AccordionItem key={piece.id} value={piece.id} className="border rounded-lg bg-card shadow-sm">
                <AccordionTrigger className="px-3 py-2.5 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center justify-between w-full pr-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs px-2 py-0">
                        #{index + 1}
                      </Badge>
                      <span className="font-medium text-sm text-left">
                        {piece.title || piece.focusKeyword || `Content Piece ${index + 1}`}
                      </span>
                    </div>
                    {contentPieces.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeContentPiece(piece.id)
                        }}
                        disabled={isLoading}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 pt-1">
                  <ContentPieceForm
                    piece={piece}
                    onUpdate={(updates) => updatePiece(piece.id, updates)}
                    onAddKeyword={(keyword) => addKeyword(piece.id, keyword)}
                    onRemoveKeyword={(keyword) => removeKeyword(piece.id, keyword)}
                    onAddHeading={(heading) => addHeading(piece.id, heading)}
                    onRemoveHeading={(heading) => removeHeading(piece.id, heading)}
                    onGenerateSingle={() => onGenerateSingle(piece)}
                    isLoading={isLoading}
                    isPieceLoading={loadingPieceIds.has(piece.id)}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}

interface ContentPieceFormProps {
  piece: ContentPiece
  onUpdate: (updates: Partial<ContentPiece>) => void
  onAddKeyword: (keyword: string) => void
  onRemoveKeyword: (keyword: string) => void
  onAddHeading: (heading: string) => void
  onRemoveHeading: (heading: string) => void
  onGenerateSingle: () => void
  isLoading: boolean
  isPieceLoading: boolean
}

function ContentPieceForm({
  piece,
  onUpdate,
  onAddKeyword,
  onRemoveKeyword,
  onAddHeading,
  onRemoveHeading,
  onGenerateSingle,
  isLoading,
  isPieceLoading,
}: ContentPieceFormProps) {
  const [newKeyword, setNewKeyword] = useState("")
  const [newHeading, setNewHeading] = useState("")

  const handleKeywordAdd = () => {
    if (newKeyword.trim()) {
      onAddKeyword(newKeyword)
      setNewKeyword("")
    }
  }

  const handleHeadingAdd = () => {
    if (newHeading.trim()) {
      onAddHeading(newHeading)
      setNewHeading("")
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={`title-${piece.id}`} className="text-xs font-medium">
          Content Title <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={`title-${piece.id}`}
          placeholder="e.g. Blog Post for Homepage"
          value={piece.title || ""}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="h-9 text-sm"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`focusKeyword-${piece.id}`} className="text-xs font-medium">
            Focus Keyword *
          </Label>
          <Input
            id={`focusKeyword-${piece.id}`}
            placeholder="e.g. digital marketing"
            value={piece.focusKeyword}
            onChange={(e) => onUpdate({ focusKeyword: e.target.value })}
            className="h-9 text-sm"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`country-${piece.id}`} className="text-xs font-medium">
            Country/Region *
          </Label>
          <Select value={piece.country} onValueChange={(value) => onUpdate({ country: value })} disabled={isLoading}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select country" />
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

        <div className="space-y-1.5">
          <Label htmlFor={`language-${piece.id}`} className="text-xs font-medium">
            Language *
          </Label>
          <Select value={piece.language} onValueChange={(value) => onUpdate({ language: value })} disabled={isLoading}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select language" />
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

        <div className="space-y-1.5">
          <Label htmlFor={`articleType-${piece.id}`} className="text-xs font-medium">
            Article Type
          </Label>
          <Select
            value={piece.articleType}
            onValueChange={(value) => onUpdate({ articleType: value })}
            disabled={isLoading}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select article type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="informatief">Informational</SelectItem>
              <SelectItem value="transactioneel">Transactional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`webpageLink-${piece.id}`} className="text-xs font-medium">
          Website URL *
        </Label>
        <Input
          id={`webpageLink-${piece.id}`}
          type="url"
          placeholder="https://yourwebsite.com"
          value={piece.webpageLink}
          onChange={(e) => onUpdate({ webpageLink: e.target.value })}
          className="h-9 text-sm"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`additionalKeywords-${piece.id}`} className="text-xs font-medium">
            Additional Keywords
          </Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id={`additionalKeywords-${piece.id}`}
                placeholder="e.g. SEO tips"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleKeywordAdd())}
                className="h-9 text-sm flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleKeywordAdd}
                disabled={!newKeyword.trim() || isLoading}
                className="h-9 px-3"
                size="sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {piece.additionalKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {piece.additionalKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs py-0 px-2">
                    {keyword}
                    <button
                      type="button"
                      onClick={() => onRemoveKeyword(keyword)}
                      disabled={isLoading}
                      className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`additionalHeadings-${piece.id}`} className="text-xs font-medium">
            Additional Headings
          </Label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input
                id={`additionalHeadings-${piece.id}`}
                placeholder="e.g. What is digital marketing?"
                value={newHeading}
                onChange={(e) => setNewHeading(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleHeadingAdd())}
                className="h-9 text-sm flex-1"
                disabled={isLoading}
              />
              <Button
                type="button"
                onClick={handleHeadingAdd}
                disabled={!newHeading.trim() || isLoading}
                className="h-9 px-3"
                size="sm"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {piece.additionalHeadings.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {piece.additionalHeadings.map((heading, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs py-0 px-2">
                    {heading}
                    <button
                      type="button"
                      onClick={() => onRemoveHeading(heading)}
                      disabled={isLoading}
                      className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Individual Generate Button */}
      <div className="pt-3 border-t">
        <Button
          type="button"
          onClick={onGenerateSingle}
          disabled={isLoading || isPieceLoading || !piece.focusKeyword.trim() || !piece.country.trim() || !piece.language.trim() || !piece.webpageLink.trim() || !piece.company.trim()}
          className="w-full h-9 text-sm font-medium bg-primary hover:bg-primary/90"
        >
          {isPieceLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Generate This Article
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

