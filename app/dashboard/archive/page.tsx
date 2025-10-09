"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Archive, Search, Calendar, FileText, Download, Eye, Trash2, Filter, ChevronDown, ChevronUp, Hash, Tag, X, ExternalLink } from "lucide-react"
import { useClientContext } from "@/hooks/use-client-context"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface SavedArticle {
  id: string
  title: string
  focus_keyword: string
  content_article: string | null
  content_faq: string | null
  article_type: string | null
  country: string | null
  language: string | null
  additional_keywords: string[]
  additional_headings: string[]
  created_at: string
  updated_at: string
}

export default function ArchivePage() {
  const { selectedClient } = useClientContext()
  const [articles, setArticles] = useState<SavedArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<SavedArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null)

  useEffect(() => {
    if (selectedClient) {
      fetchArticles()
    }
  }, [selectedClient])

  useEffect(() => {
    filterAndSortArticles()
  }, [articles, searchQuery, typeFilter, sortBy])

  const fetchArticles = async () => {
    if (!selectedClient) return

    try {
      setIsLoading(true)
      const response = await apiClient(`/api/articles?client_id=${selectedClient.id}`)

      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      } else {
        console.error('Failed to fetch articles')
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortArticles = () => {
    let filtered = [...articles]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.focus_keyword.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(article => article.article_type === typeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "keyword":
          return a.focus_keyword.localeCompare(b.focus_keyword)
        default:
          return 0
      }
    })

    setFilteredArticles(filtered)
  }

  const toggleExpanded = (articleId: string) => {
    setExpandedArticles(prev => {
      const next = new Set(prev)
      if (next.has(articleId)) {
        next.delete(articleId)
      } else {
        next.add(articleId)
      }
      return next
    })
  }

  const openSidePanel = (article: SavedArticle) => {
    setSelectedArticle(article)
    setSidePanelOpen(true)
  }

  const closeSidePanel = () => {
    setSidePanelOpen(false)
    setSelectedArticle(null)
  }

  const downloadArticle = (article: SavedArticle) => {
    const content = `# ${article.title}\n\n${article.content_article || ''}\n\n---\n\n${article.content_faq || ''}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${article.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const createPreview = (content: string, maxLength: number = 150) => {
    if (!content) return "Geen content beschikbaar"
    const cleaned = content.replace(/[#*`]/g, '').trim()
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + '...' : cleaned
  }

  const deleteArticle = async (articleId: string) => {
    if (!confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) return

    try {
      const response = await apiClient(`/api/articles`, {
        method: 'DELETE',
        body: JSON.stringify({ id: articleId })
      })

      if (response.ok) {
        setArticles(prev => prev.filter(a => a.id !== articleId))
        alert('Artikel verwijderd!')
      } else {
        alert('Fout bij verwijderen')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      alert('Fout bij verwijderen')
    }
  }

  if (!selectedClient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen client geselecteerd</h2>
            <p className="text-muted-foreground">
              Selecteer een client in de sidebar om opgeslagen artikelen te bekijken.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Archive className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Content Archief</h1>
            <p className="text-muted-foreground">
              {filteredArticles.length} artikel{filteredArticles.length !== 1 ? 'en' : ''} voor {selectedClient.naam}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Zoeken
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op titel of keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Alle types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle types</SelectItem>
                <SelectItem value="informatief">Informatief</SelectItem>
                <SelectItem value="transactioneel">Transactioneel</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sorteer op..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Nieuwste eerst</SelectItem>
                <SelectItem value="oldest">Oudste eerst</SelectItem>
                <SelectItem value="title">Titel (A-Z)</SelectItem>
                <SelectItem value="keyword">Keyword (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen artikelen gevonden</h2>
            <p className="text-muted-foreground mb-4">
              {searchQuery || typeFilter !== "all"
                ? "Probeer je filters aan te passen"
                : "Begin met het genereren en opslaan van artikelen"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const isExpanded = expandedArticles.has(article.id)
            const articlePreview = article.content_article ? createPreview(article.content_article, 200) : null
            const faqPreview = article.content_faq ? createPreview(article.content_faq, 200) : null
            
            return (
              <Card key={article.id} className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-0 bg-gradient-to-br from-card to-card/80">
                <CardHeader className="pb-4">
                  {/* Header with badge and date */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={article.article_type === 'transactioneel' ? 'default' : 'secondary'} 
                        className="text-xs font-medium px-2 py-1"
                      >
                        {article.article_type || 'Onbekend'}
                      </Badge>
                      {article.language && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          {article.language.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(article.created_at), 'dd MMM yyyy', { locale: nl })}
                    </div>
                  </div>
                  
                  {/* Main Title */}
                  <CardTitle className="text-xl leading-tight line-clamp-2 mb-4 font-bold">
                    {article.title}
                  </CardTitle>
                  
                  {/* Focus Keyword - Prominent */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Hoofdkeyword</div>
                      <div className="font-bold text-primary text-lg">{article.focus_keyword}</div>
                    </div>
                  </div>

                  {/* Additional Keywords - Beautiful tags */}
                  {article.additional_keywords && article.additional_keywords.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Tag className="h-4 w-4" />
                        <span>Aanvullende zoekwoorden</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {article.additional_keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs px-2 py-1 bg-muted/50 hover:bg-muted/70 transition-colors">
                            {keyword}
                          </Badge>
                        ))}
                        {article.additional_keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            +{article.additional_keywords.length - 3} meer
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Headings - Clean list */}
                  {article.additional_headings && article.additional_headings.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Hash className="h-4 w-4" />
                        <span>Aanvullende headers</span>
                      </div>
                      <div className="space-y-1 pl-2">
                        {article.additional_headings.slice(0, 3).map((heading, index) => (
                          <div key={index} className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-primary/50 flex-shrink-0" />
                            {heading}
                          </div>
                        ))}
                        {article.additional_headings.length > 3 && (
                          <div className="text-sm text-muted-foreground/70 italic">
                            +{article.additional_headings.length - 3} meer headers...
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Content indicators - Modern pills */}
                  <div className="flex gap-2">
                    {article.content_article && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        Artikel
                      </div>
                    )}
                    {article.content_faq && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        FAQ
                      </div>
                    )}
                    {article.country && (
                      <div className="px-2 py-1 bg-muted/50 text-muted-foreground rounded-full text-xs font-medium">
                        {article.country}
                      </div>
                    )}
                  </div>

                  {/* View Full Content Button */}
                  {(article.content_article || article.content_faq) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSidePanel(article)}
                      className="w-full h-10 border-dashed hover:border-solid hover:bg-primary/5 transition-all"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      <span className="font-medium">Volledige tekst bekijken</span>
                    </Button>
                  )}

                  {/* Actions - Modern buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadArticle(article)}
                      className="w-full h-9 font-medium hover:bg-primary/5 hover:border-primary/20 transition-all"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteArticle(article.id)}
                      className="w-full h-9 font-medium text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Side Panel for Full Content */}
      {sidePanelOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeSidePanel}
          />
          
          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{selectedArticle.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedArticle.focus_keyword} • {format(new Date(selectedArticle.created_at), 'dd MMM yyyy', { locale: nl })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeSidePanel}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Article Content */}
                {selectedArticle.content_article && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span>Artikel Content</span>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white/50 p-4 rounded-lg border">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedArticle.content_article}
                      </div>
                    </div>
                  </div>
                )}

                {/* FAQ Content */}
                {selectedArticle.content_faq && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>FAQ Content</span>
                    </div>
                    <div className="prose prose-sm max-w-none dark:prose-invert bg-white/50 p-4 rounded-lg border">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedArticle.content_faq}
                      </div>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Type:</span>
                      <div className="mt-1">{selectedArticle.article_type || 'Onbekend'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Land:</span>
                      <div className="mt-1">{selectedArticle.country || 'Niet opgegeven'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Taal:</span>
                      <div className="mt-1">{selectedArticle.language || 'Niet opgegeven'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Aangemaakt:</span>
                      <div className="mt-1">{format(new Date(selectedArticle.created_at), 'dd MMM yyyy HH:mm', { locale: nl })}</div>
                    </div>
                  </div>

                  {/* Additional Keywords */}
                  {selectedArticle.additional_keywords && selectedArticle.additional_keywords.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-muted-foreground">Aanvullende zoekwoorden:</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedArticle.additional_keywords.map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Headings */}
                  {selectedArticle.additional_headings && selectedArticle.additional_headings.length > 0 && (
                    <div className="space-y-2">
                      <span className="font-medium text-muted-foreground">Aanvullende headers:</span>
                      <div className="space-y-1">
                        {selectedArticle.additional_headings.map((heading, index) => (
                          <div key={index} className="text-sm text-muted-foreground">
                            • {heading}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t bg-muted/30">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => downloadArticle(selectedArticle)}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      closeSidePanel()
                      deleteArticle(selectedArticle.id)
                    }}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijder
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

