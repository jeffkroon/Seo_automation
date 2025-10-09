"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Archive, Search, Calendar, FileText, Download, Eye, Trash2, Filter } from "lucide-react"
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
          {filteredArticles.map((article) => (
            <Card key={article.id} className="group hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant={article.article_type === 'transactioneel' ? 'default' : 'secondary'} className="text-xs">
                    {article.article_type || 'Onbekend'}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(article.created_at), 'dd MMM yyyy', { locale: nl })}
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight line-clamp-2">
                  {article.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                  <Search className="h-3 w-3" />
                  {article.focus_keyword}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Content indicators */}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {article.content_article && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Artikel
                    </div>
                  )}
                  {article.content_faq && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      FAQ
                    </div>
                  )}
                  {article.language && (
                    <Badge variant="outline" className="text-xs">
                      {article.language.toUpperCase()}
                    </Badge>
                  )}
                  {article.country && (
                    <Badge variant="outline" className="text-xs">
                      {article.country}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadArticle(article)}
                    className="w-full"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteArticle(article.id)}
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Verwijder
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

