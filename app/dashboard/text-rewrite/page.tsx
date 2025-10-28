"use client"

import { useState, useEffect, useMemo } from "react"
import type { Components } from "react-markdown"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Calendar, FileText, Filter, RefreshCw, ArrowLeft, Loader2, X, Save } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import HtmlSection from "@/components/HtmlSection"
import { cn } from "@/lib/utils"
import { useClientContext } from "@/hooks/use-client-context"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

type SectionKind = "article" | "faq" | "meta"

interface ArticleSection {
  id: string
  html: string
  title: string
  kind: SectionKind
  sequence: number
}

interface ArticleForRewrite {
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
  generated_at: string
  age_days: number
  age_category: 'fresh' | 'warning' | 'stale'
}

export default function TextRewritePage() {
  const { selectedClient } = useClientContext()
  const router = useRouter()
  const [articles, setArticles] = useState<ArticleForRewrite[]>([])
  const [filteredArticles, setFilteredArticles] = useState<ArticleForRewrite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [ageFilter, setAgeFilter] = useState<string>("all")
  const [rewritingIds, setRewritingIds] = useState<Set<string>>(new Set())
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [selectedRewriteResult, setSelectedRewriteResult] = useState<ArticleSection[] | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<ArticleForRewrite | null>(null)
  const [rewriteResults, setRewriteResults] = useState<Map<string, ArticleSection[]>>(new Map())
  const [jobToArticleId, setJobToArticleId] = useState<Map<string, string>>(new Map())

  // Markdown components - exact zoals archive page
  const markdownComponents = useMemo<Components>(() => ({
    h1: ({ node, className, ...props }) => (
      <h1 {...props} className={cn("text-2xl font-bold mb-4 text-foreground", className)} />
    ),
    h2: ({ node, className, ...props }) => (
      <h2 {...props} className={cn("text-xl font-semibold mb-3 mt-6 text-foreground", className)} />
    ),
    h3: ({ node, className, ...props }) => (
      <h3 {...props} className={cn("text-lg font-semibold mb-2 mt-4 text-foreground", className)} />
    ),
    h4: ({ node, className, ...props }) => (
      <h4 {...props} className={cn("text-base font-semibold mb-2 mt-4 text-foreground", className)} />
    ),
    p: ({ node, className, ...props }) => (
      <p {...props} className={cn("mb-4 leading-relaxed text-foreground", className)} />
    ),
    ul: ({ node, className, ...props }) => (
      <ul {...props} className={cn("mb-4 ml-6 list-disc space-y-2 text-foreground", className)} />
    ),
    ol: ({ node, className, ...props }) => (
      <ol {...props} className={cn("mb-4 ml-6 list-decimal space-y-2 text-foreground", className)} />
    ),
    li: ({ node, className, ...props }) => (
      <li {...props} className={cn("leading-relaxed text-foreground", className)} />
    ),
    blockquote: ({ node, className, ...props }) => (
      <blockquote {...props} className={cn("border-l-4 border-primary/40 pl-4 italic text-muted-foreground mb-4", className)} />
    ),
    strong: ({ node, className, ...props }) => (
      <strong {...props} className={cn("font-semibold text-foreground", className)} />
    ),
    em: ({ node, className, ...props }) => (
      <em {...props} className={cn("italic text-foreground", className)} />
    ),
    a: ({ node, className, ...props }) => (
      <a {...props} className={cn("text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/80 hover:decoration-primary", className)} target={props.target ?? "_blank"} rel={props.rel ?? "noopener noreferrer"} />
    ),
    code: ({ node, className, ...props }) => {
      const isInline = !className?.includes('language-')
      return isInline ? (
        <code {...props} className={cn("bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground", className)} />
      ) : (
        <code {...props} className={cn("block bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono text-foreground", className)} />
      )
    },
    pre: ({ node, className, ...props }) => (
      <pre {...props} className={cn("bg-muted p-4 rounded-lg overflow-x-auto mb-4", className)} />
    ),
    table: ({ node, className, ...props }) => (
      <div className="overflow-x-auto mb-4">
        <table {...props} className={cn("min-w-full border-collapse border border-border", className)} />
      </div>
    ),
    th: ({ node, className, ...props }) => (
      <th {...props} className={cn("border border-border bg-muted px-4 py-2 text-left font-semibold text-foreground", className)} />
    ),
    td: ({ node, className, ...props }) => (
      <td {...props} className={cn("border border-border px-4 py-2 text-foreground", className)} />
    ),
  }), [])

  const markdownClass = "prose prose-sm max-w-none dark:prose-invert" // jobId -> article.id mapping

  useEffect(() => {
    if (selectedClient) {
      fetchArticles()
    }
  }, [selectedClient])

  useEffect(() => {
    filterArticles()
  }, [articles, searchQuery, ageFilter])

  const fetchArticles = async () => {
    if (!selectedClient) return

    try {
      setIsLoading(true)
      const response = await apiClient(`/api/articles-for-rewrite?client_id=${selectedClient.id}`)

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

  const filterArticles = () => {
    let filtered = [...articles]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.focus_keyword.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Age filter
    if (ageFilter !== "all") {
      filtered = filtered.filter(article => article.age_category === ageFilter)
    }

    setFilteredArticles(filtered)
  }

  const handleRewrite = async (article: ArticleForRewrite) => {
    if (!article.content_article && !article.content_faq) {
      toast({
        title: "Geen content",
        description: "Dit artikel heeft geen content om te herschrijven.",
        variant: "destructive",
      })
      return
    }

    setRewritingIds(prev => new Set(prev).add(article.id))

    try {
      const response = await apiClient('/api/rewrite-article', {
        method: 'POST',
        body: JSON.stringify({
          article: article.content_article,
          faq: article.content_faq,
          keyword: article.focus_keyword,
          article_type: article.article_type || 'informatief'
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store jobId -> articleId mapping
        if (data.jobId) {
          setJobToArticleId(prev => new Map(prev).set(data.jobId, article.id))
          
          // Start polling
          pollForRewriteResults(data.jobId, article.id)
          
          toast({
            title: "Artikel wordt herschreven",
            description: `Het artikel "${article.title}" wordt nu herschreven door AI.`,
          })
        } else {
          // No jobId - remove loading state
          setRewritingIds(prev => {
            const next = new Set(prev)
            next.delete(article.id)
            return next
          })
          toast({
            title: "Herschrijven gestart",
            description: `Het artikel "${article.title}" wordt nu herschreven.`,
          })
        }
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fout bij herschrijven')
      }
    } catch (error: any) {
      // Remove loading state on error
      setRewritingIds(prev => {
        const next = new Set(prev)
        next.delete(article.id)
        return next
      })
      toast({
        title: "Herschrijven mislukt",
        description: error.message || "Er is een fout opgetreden bij het herschrijven.",
        variant: "destructive",
      })
    }
    // Note: we don't remove loading state in finally block
    // Loading state will be removed by pollForRewriteResults when polling completes
  }

  const pollForRewriteResults = async (jobId: string, articleId: string) => {
    let lastVersion = -1
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return

      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            console.log(`Job ${jobId} not found - stopping polling`)
            setRewritingIds(prev => {
              const next = new Set(prev)
              next.delete(articleId)
              return next
            })
            isPolling = false
            return
          }
          throw new Error(`Status check failed: ${response.status}`)
        }

        const job = await response.json()
        console.log(`🔄 Polling rewrite job ${jobId}:`, {
          status: job.status,
          isComplete: job.isComplete,
          error: job.error,
          resultsCount: job.results?.length || 0,
        })

        // Stop polling if error
        if (job.status === "error") {
          console.error(`❌ Rewrite job ${jobId} failed:`, job.error)
          setRewritingIds(prev => {
            const next = new Set(prev)
            next.delete(articleId)
            return next
          })
          isPolling = false
          
          toast({
            title: "Herschrijven mislukt",
            description: job.error || "Onbekende fout van de workflow",
            variant: "destructive",
          })
          return
        }

        // Process new results
        if (typeof job.resultsVersion === "number" && 
            job.resultsVersion !== lastVersion && 
            job.results && 
            job.results.length > 0) {
          lastVersion = job.resultsVersion

          const sections: ArticleSection[] = job.results.flatMap((result: any, index: number) => {
            const entries: ArticleSection[] = []

            if (result?.article) {
              entries.push({
                id: `${jobId}-${index}-article`,
                html: String(result.article).trim(),
                title: result.metaTitle?.trim() || `Herschreven artikel`,
                kind: "article",
                sequence: 1,
              })
            }

            return entries
          })

          if (sections.length > 0) {
            // Store results
            setRewriteResults(prev => new Map(prev).set(articleId, sections))
            
            // Stop loading
            setRewritingIds(prev => {
              const next = new Set(prev)
              next.delete(articleId)
              return next
            })
            isPolling = false
            
            toast({
              title: "Artikel herschreven!",
              description: "Het artikel is succesvol herschreven door AI.",
            })
            return
          }
        }

        if (job.isComplete) {
          console.log(`✅ Rewrite job ${jobId} complete`)
          setRewritingIds(prev => {
            const next = new Set(prev)
            next.delete(articleId)
            return next
          })
          isPolling = false
          return
        }

        setTimeout(poll, 3000)
        
      } catch (error) {
        console.error("Error polling rewrite results:", error)
        toast({
          title: "Polling error",
          description: error instanceof Error ? error.message : "Onbekende fout",
          variant: "destructive",
        })
        setRewritingIds(prev => {
          const next = new Set(prev)
          next.delete(articleId)
          return next
        })
        isPolling = false
      }
    }

    poll()
  }

  const handleSaveRewrite = async (article: ArticleForRewrite, sections: ArticleSection[]) => {
    try {
      // Extract article and FAQ content
      const articleSection = sections.find(s => s.kind === 'article')
      const faqSection = sections.find(s => s.kind === 'faq')
      
      const response = await apiClient(`/api/articles/${article.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content_article: articleSection?.html || null,
          content_faq: faqSection?.html || null,
          updated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast({
          title: "Artikel overschreven!",
          description: `Het artikel "${article.title}" is succesvol bijgewerkt met de herschreven versie.`,
        })
        
        // Remove rewrite results for this article
        setRewriteResults(prev => {
          const next = new Map(prev)
          next.delete(article.id)
          return next
        })
        
        // Refresh articles
        fetchArticles()
        
        // Close side panel
        setSidePanelOpen(false)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fout bij opslaan')
      }
    } catch (error: any) {
      toast({
        title: "Opslaan mislukt",
        description: error.message || "Er is een fout opgetreden bij het overschrijven.",
        variant: "destructive",
      })
    }
  }

  const getAgeColor = (category: string) => {
    switch (category) {
      case 'fresh':
        return 'bg-green-500'
      case 'warning':
        return 'bg-orange-500'
      case 'stale':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getAgeBadge = (category: string) => {
    switch (category) {
      case 'fresh':
        return <Badge className="bg-green-100 text-green-700 border-green-300">Vers (&lt;2 weken)</Badge>
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-300">Let op (2-4 weken)</Badge>
      case 'stale':
        return <Badge className="bg-red-100 text-red-700 border-red-300">Verouderd (&gt;1 maand)</Badge>
      default:
        return null
    }
  }

  if (!selectedClient) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen client geselecteerd</h2>
            <p className="text-muted-foreground">
              Selecteer een client in de sidebar om artikelen te bekijken die herschreven moeten worden.
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="h-9"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug
          </Button>
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">Tekst Herschrijven</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Age Filter */}
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Alle leeftijden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle leeftijden</SelectItem>
                <SelectItem value="fresh">Vers (&lt;2 weken)</SelectItem>
                <SelectItem value="warning">Let op (2-4 weken)</SelectItem>
                <SelectItem value="stale">Verouderd (&gt;1 maand)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totaal artikelen</p>
                <p className="text-3xl font-bold mt-1">{articles.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Verouderd (&gt;1 maand)</p>
                <p className="text-3xl font-bold mt-1 text-red-600">
                  {articles.filter(a => a.age_category === 'stale').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-red-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Let op (2-4 weken)</p>
                <p className="text-3xl font-bold mt-1 text-orange-600">
                  {articles.filter(a => a.age_category === 'warning').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <div className="h-6 w-6 rounded-full bg-orange-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              {searchQuery || ageFilter !== "all"
                ? "Probeer je filters aan te passen"
                : "Begin met het genereren en opslaan van artikelen"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            return (
              <Card key={article.id} className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <CardHeader className="pb-4">
                  {/* Age Badge */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getAgeColor(article.age_category)}`} />
                      {getAgeBadge(article.age_category)}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                      <Calendar className="h-3 w-3" />
                      {article.age_days} dagen geleden
                    </div>
                  </div>
                  
                  {/* Main Title */}
                  <CardTitle className="text-xl leading-tight line-clamp-2 mb-4 font-bold">
                    {article.title}
                  </CardTitle>
                  
                  {/* Focus Keyword */}
                  <div className="flex items-center gap-2 mb-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Hoofdkeyword</div>
                      <div className="font-bold text-primary text-lg">{article.focus_keyword}</div>
                    </div>
                  </div>

                  {/* Additional Keywords */}
                  {article.additional_keywords && article.additional_keywords.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <div className="text-xs font-medium text-muted-foreground">
                        Aanvullende zoekwoorden
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {article.additional_keywords.slice(0, 3).map((keyword, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                        {article.additional_keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{article.additional_keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Metadata */}
                  <div className="flex gap-2">
                    {article.article_type && (
                      <Badge variant="secondary" className="text-xs">
                        {article.article_type}
                      </Badge>
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

                  {/* Content indicators */}
                  <div className="flex gap-2">
                    {article.content_article && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        Artikel
                      </div>
                    )}
                    {article.content_faq && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                        <FileText className="h-3 w-3" />
                        FAQ
                      </div>
                    )}
                  </div>

                  {/* Date info */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <div>Aangemaakt: {format(new Date(article.created_at), 'dd MMM yyyy', { locale: nl })}</div>
                    {article.updated_at !== article.created_at && (
                      <div>Bewerkt: {format(new Date(article.updated_at), 'dd MMM yyyy', { locale: nl })}</div>
                    )}
                  </div>

                  {/* Loading state during rewrite */}
                  {rewritingIds.has(article.id) && (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-primary/5 rounded-lg border border-primary/20">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-primary">Artikel wordt herschreven...</span>
                    </div>
                  )}

                  {/* Result buttons when rewrite is complete */}
                  {rewriteResults.has(article.id) && !rewritingIds.has(article.id) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const results = rewriteResults.get(article.id)
                          if (results) {
                            setSelectedRewriteResult(results)
                            setSelectedArticle(article)
                            setSidePanelOpen(true)
                          }
                        }}
                        className="w-full h-9 text-sm"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Bekijk
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          const results = rewriteResults.get(article.id)
                          if (results) {
                            handleSaveRewrite(article, results)
                          }
                        }}
                        className="w-full h-9 text-sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Opslaan
                      </Button>
                    </div>
                  )}

                  {/* Rewrite Button - only show if not rewriting and no results yet */}
                  {!rewritingIds.has(article.id) && !rewriteResults.has(article.id) && (
                    <Button
                      onClick={() => handleRewrite(article)}
                      disabled={!article.content_article || rewritingIds.has(article.id)}
                      className="w-full h-10 font-medium"
                      variant="outline"
                    >
                      {rewritingIds.has(article.id) ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Aan het herschrijven...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Herschrijf met AI
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Side Panel for Rewritten Results */}
      {sidePanelOpen && selectedRewriteResult && selectedArticle && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidePanelOpen(false)}
          />
          
          {/* Side Panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-3xl bg-background shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Herschreven: {selectedArticle.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedArticle.focus_keyword}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidePanelOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedRewriteResult.map((section) => (
                  <div key={section.id} className="space-y-3">
                    <div className="flex items-center gap-2 text-lg font-semibold border-b pb-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span>{section.title}</span>
                    </div>
                    <div className="bg-muted/30 p-6 rounded-lg border">
                      {/<\/?[a-z][\s\S]*>/i.test(section.html) ? (
                        <HtmlSection html={section.html} className="prose max-w-none" />
                      ) : (
                        <div className={markdownClass}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {section.html}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t bg-muted/30">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSidePanelOpen(false)}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Sluiten
                  </Button>
                  <Button
                    onClick={() => handleSaveRewrite(selectedArticle!, selectedRewriteResult)}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Overschrijf artikel
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

