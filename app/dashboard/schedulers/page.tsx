"use client"

import { useEffect, useState } from "react"
import { useClientContext } from "@/hooks/use-client-context"
import { apiClient } from "@/lib/api-client"
import { SchedulerStats } from "@/components/scheduler/scheduler-stats"
import { CreateSchedulerDialog } from "@/components/scheduler/create-scheduler-dialog"
import { WorkflowMonitor } from "@/components/scheduler/workflow-monitor"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Clock, Target, FileText, BarChart3, MoreHorizontal, Trash2, Pause, Play, Edit, Save, CheckCircle, ChevronDown, ChevronRight, Copy, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import HtmlSection, { sanitizeHtml } from "@/components/HtmlSection"
import { cn } from "@/lib/utils"

interface Schedule {
  id: string
  focus_keyword: string
  extra_keywords?: string[]
  extra_headings?: string[]
  article_type: string
  interval_seconds: number
  active: boolean
  last_run_at?: string
  next_run_at?: string
  created_at: string
  website_url?: string
  language?: string
  country?: string
  latestArticle?: {
    id: string
    article?: string
    faqs?: string
    generated_at: string
  } | null
}

export default function SchedulersPage() {
  const { selectedClient } = useClientContext()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Markdown components (same as article-results)
  const markdownComponents = {
    h1: ({ node, className, ...props }: any) => (
      <h1 {...props} className={cn("text-2xl font-bold mb-4 text-foreground", className)} />
    ),
    h2: ({ node, className, ...props }: any) => (
      <h2 {...props} className={cn("text-xl font-semibold mb-3 text-foreground", className)} />
    ),
    h3: ({ node, className, ...props }: any) => (
      <h3 {...props} className={cn("text-lg font-medium mb-2 text-foreground", className)} />
    ),
    h4: ({ node, className, ...props }: any) => (
      <h4 {...props} className={cn("text-base font-medium mb-2 text-foreground", className)} />
    ),
    p: ({ node, className, ...props }: any) => (
      <p {...props} className={cn("mb-4 text-foreground leading-relaxed", className)} />
    ),
    ul: ({ node, className, ...props }: any) => (
      <ul {...props} className={cn("list-disc list-inside mb-4 space-y-1", className)} />
    ),
    ol: ({ node, className, ...props }: any) => (
      <ol {...props} className={cn("list-decimal list-inside mb-4 space-y-1", className)} />
    ),
    li: ({ node, className, ...props }: any) => (
      <li {...props} className={cn("text-foreground", className)} />
    ),
    blockquote: ({ node, className, ...props }: any) => (
      <blockquote {...props} className={cn("border-l-4 border-primary pl-4 italic mb-4 text-muted-foreground", className)} />
    ),
    strong: ({ node, className, ...props }: any) => (
      <strong {...props} className={cn("font-semibold text-foreground", className)} />
    ),
    em: ({ node, className, ...props }: any) => (
      <em {...props} className={cn("italic text-foreground", className)} />
    ),
    a: ({ node, className, ...props }: any) => (
      <a {...props} className={cn("text-primary hover:underline", className)} />
    ),
    code: ({ node, className, children, ...props }: any) => {
      const isInline = !className?.includes('language-')
      return isInline ? (
        <code {...props} className={cn("bg-muted px-1 py-0.5 rounded text-sm font-mono", className)}>
          {children}
        </code>
      ) : (
        <code {...props} className={cn("block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto", className)}>
          {children}
        </code>
      )
    },
    pre: ({ node, className, ...props }: any) => (
      <pre {...props} className={cn("bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto mb-4", className)} />
    ),
    table: ({ node, className, ...props }: any) => (
      <table {...props} className={cn("w-full border-collapse border border-border mb-4", className)} />
    ),
    th: ({ node, className, ...props }: any) => (
      <th {...props} className={cn("border border-border px-4 py-2 bg-muted font-semibold text-left", className)} />
    ),
    td: ({ node, className, ...props }: any) => (
      <td {...props} className={cn("border border-border px-4 py-2", className)} />
    ),
  }

  // Helper functions
  const transformMarkdown = (markdown: string): string => {
    let cleaned = markdown.replace(/^\s*DO NOT wrap in ```html```\s*/i, "").trim()
    const fenceMatch = cleaned.match(/^```(\w+)?\n([\s\S]*)\n```$/)
    if (fenceMatch) {
      const language = fenceMatch[1]?.toLowerCase()
      if (!language || ["markdown", "md", "html"].includes(language)) {
        cleaned = fenceMatch[2].trim()
      }
    }
    return cleaned
  }

  const createPreview = (markdown: string, maxLength = 220): string => {
    const cleaned = transformMarkdown(markdown)
    const textOnly = cleaned.replace(/<[^>]*>/g, "").replace(/[#*`_~\[\]()]/g, "")
    return textOnly.length > maxLength ? textOnly.substring(0, maxLength) + "..." : textOnly
  }

  const toggleExpanded = (articleId: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(articleId)) {
        newSet.delete(articleId)
      } else {
        newSet.add(articleId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (content: string, articleId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(articleId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const downloadArticle = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (selectedClient?.id) {
      fetchSchedules()
    }
  }, [selectedClient])

  const fetchSchedules = async () => {
    if (!selectedClient?.id) return
    
    try {
      setIsLoading(true)
      const response = await apiClient(`/api/schedules?client_id=${selectedClient.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "rank_tracking":
        return Target
      case "serp_analysis":
        return BarChart3
      case "content_generation":
        return FileText
      default:
        return Clock
    }
  }

  const formatInterval = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `Elke ${days} dag${days > 1 ? 'en' : ''}`
    if (hours > 0) return `Elke ${hours} uur`
    return `Elke ${seconds / 60} minuten`
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    const scheduleName = schedule?.focus_keyword || 'deze scheduler'
    
    if (!confirm(`Weet je zeker dat je "${scheduleName}" wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`)) {
      return
    }

    try {
      const response = await apiClient(`/api/schedules/${scheduleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: `Scheduler "${scheduleName}" succesvol verwijderd`
        })
        fetchSchedules()
      } else {
        const errorData = await response.json()
        toast({
          title: "Fout",
          description: errorData.error || "Fout bij verwijderen scheduler",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
      toast({
        title: "Fout",
        description: "Onbekende fout bij verwijderen scheduler",
        variant: "destructive"
      })
    }
  }

  const handleSaveArticle = async (scheduleId: string, article: string, faqs?: string) => {
    if (!selectedClient) {
      alert('Selecteer eerst een client om het artikel op te slaan')
      return
    }

    if (!article && !faqs) {
      alert('Geen content om op te slaan')
      return
    }

    try {
      setSavingId(scheduleId)
      
      const schedule = schedules.find(s => s.id === scheduleId)
      const articleContent = article ? transformMarkdown(article) : null
      const faqContent = faqs ? transformMarkdown(faqs) : null
      const title = schedule?.focus_keyword || 'Untitled'
      
      // Ensure arrays are properly formatted for PostgreSQL
      const additionalKeywords = Array.isArray(schedule?.extra_keywords) 
        ? schedule.extra_keywords.filter(k => k && k.trim()) 
        : []
      const additionalHeadings = Array.isArray(schedule?.extra_headings) 
        ? schedule.extra_headings.filter(h => h && h.trim()) 
        : []

      const response = await apiClient('/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          client_id: selectedClient.id,
          focus_keyword: title,
          title: title,
          article: articleContent,
          faqs: faqContent,
          meta_title: title,
          country: schedule?.country || 'nl',
          language: schedule?.language || 'nl',
          article_type: schedule?.article_type || 'informatief',
          additional_keywords: additionalKeywords,
          additional_headings: additionalHeadings,
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSavedId(scheduleId)
        setTimeout(() => setSavedId(null), 3000)
        alert(data.message || 'Artikel opgeslagen!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Fout bij opslaan')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Fout bij opslaan artikel')
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleSchedule = async (scheduleId: string, currentActive: boolean) => {
    try {
      const response = await apiClient(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentActive })
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: `Scheduler ${!currentActive ? 'geactiveerd' : 'gepauzeerd'}!`
        })
        fetchSchedules()
      } else {
        toast({
          title: "Fout",
          description: "Kon scheduler niet updaten.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error toggling schedule:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis.",
        variant: "destructive"
      })
    }
  }

  if (!selectedClient) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Selecteer een client om schedulers te beheren.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Schedulers</h1>
          <p className="text-muted-foreground">
            Beheer geautomatiseerde SEO taken voor {selectedClient.naam}
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Scheduler
        </Button>
      </div>

      <SchedulerStats schedules={schedules} />

      <Card>
        <CardHeader>
          <CardTitle>Actieve Schedulers</CardTitle>
          <CardDescription>
            {schedules.length} scheduler{schedules.length !== 1 ? 's' : ''} voor {selectedClient.naam}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Geen schedulers gevonden. Maak je eerste scheduler aan!
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => {
                const TypeIcon = getTypeIcon(schedule.article_type)
                return (
                  <div
                    key={schedule.id}
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="p-2 bg-muted rounded-lg">
                          <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-lg">{schedule.focus_keyword}</h3>
                            <Badge variant={schedule.active ? "default" : "secondary"}>
                              {schedule.active ? "Actief" : "Gepauzeerd"}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {schedule.article_type}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Interval:</span>{" "}
                              <span className="font-medium">{formatInterval(schedule.interval_seconds)}</span>
                            </div>
                            {schedule.website_url && (
                              <div>
                                <span className="text-muted-foreground">Website:</span>{" "}
                                <span className="font-medium text-xs">{schedule.website_url}</span>
                              </div>
                            )}
                            {schedule.language && (
                              <div>
                                <span className="text-muted-foreground">Taal:</span>{" "}
                                <span className="font-medium uppercase">{schedule.language}</span>
                              </div>
                            )}
                            {schedule.country && (
                              <div>
                                <span className="text-muted-foreground">Land:</span>{" "}
                                <span className="font-medium uppercase">{schedule.country}</span>
                              </div>
                            )}
                          </div>

                          {schedule.extra_keywords && Array.isArray(schedule.extra_keywords) && schedule.extra_keywords.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Extra Keywords:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {schedule.extra_keywords.map((keyword, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {schedule.extra_headings && Array.isArray(schedule.extra_headings) && schedule.extra_headings.length > 0 && (
                            <div>
                              <span className="text-xs text-muted-foreground">Extra Koppen:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {schedule.extra_headings.map((heading, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {heading}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Latest Generated Content */}
                          {schedule.latestArticle && (
                            <div className="border-t pt-4 mt-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-muted-foreground">Laatste generatie:</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(schedule.latestArticle.generated_at).toLocaleString('nl-NL')}
                                </span>
                              </div>
                              
                              {/* Article Section */}
                              {schedule.latestArticle.article && (
                                <div className="space-y-3 mb-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-primary" />
                                      Artikel
                                    </h3>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7"
                                      onClick={() => toggleExpanded(`${schedule.id}-article`)}
                                    >
                                      {expandedArticles.has(`${schedule.id}-article`) ? (
                                        <><ChevronDown className="h-3 w-3 mr-1" /> Inklappen</>
                                      ) : (
                                        <><ChevronRight className="h-3 w-3 mr-1" /> Uitklappen</>
                                      )}
                                    </Button>
                                  </div>

                                  <div className="border rounded-lg p-4 bg-background/50">
                                    {expandedArticles.has(`${schedule.id}-article`) ? (
                                      <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                          {transformMarkdown(schedule.latestArticle.article)}
                                        </ReactMarkdown>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {createPreview(schedule.latestArticle.article)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => copyToClipboard(transformMarkdown(schedule.latestArticle!.article!), `${schedule.id}-article`)}
                                    >
                                      {copiedId === `${schedule.id}-article` ? (
                                        <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied!</>
                                      ) : (
                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => downloadArticle(transformMarkdown(schedule.latestArticle!.article!), `${schedule.focus_keyword} - Article`)}
                                    >
                                      <Download className="w-3 h-3 mr-1" /> Download
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {/* FAQ Section */}
                              {schedule.latestArticle.faqs && (
                                <div className="space-y-3 mb-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-primary" />
                                      FAQ
                                    </h3>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-7"
                                      onClick={() => toggleExpanded(`${schedule.id}-faq`)}
                                    >
                                      {expandedArticles.has(`${schedule.id}-faq`) ? (
                                        <><ChevronDown className="h-3 w-3 mr-1" /> Inklappen</>
                                      ) : (
                                        <><ChevronRight className="h-3 w-3 mr-1" /> Uitklappen</>
                                      )}
                                    </Button>
                                  </div>

                                  <div className="border rounded-lg p-4 bg-background/50">
                                    {expandedArticles.has(`${schedule.id}-faq`) ? (
                                      <div className="prose prose-sm max-w-none">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                          {transformMarkdown(schedule.latestArticle.faqs)}
                                        </ReactMarkdown>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {createPreview(schedule.latestArticle.faqs)}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => copyToClipboard(transformMarkdown(schedule.latestArticle!.faqs!), `${schedule.id}-faq`)}
                                    >
                                      {copiedId === `${schedule.id}-faq` ? (
                                        <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied!</>
                                      ) : (
                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => downloadArticle(transformMarkdown(schedule.latestArticle!.faqs!), `${schedule.focus_keyword} - FAQ`)}
                                    >
                                      <Download className="w-3 h-3 mr-1" /> Download
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Save Button */}
                              <Button
                                variant="default"
                                size="sm"
                                className="w-full"
                                onClick={() => handleSaveArticle(
                                  schedule.id, 
                                  schedule.latestArticle!.article!, 
                                  schedule.latestArticle!.faqs
                                )}
                                disabled={savingId === schedule.id || !selectedClient}
                              >
                                {savingId === schedule.id ? (
                                  <>
                                    <Save className="w-4 h-4 mr-2 animate-pulse" />
                                    Opslaan...
                                  </>
                                ) : savedId === schedule.id ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                    Opgeslagen!
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {selectedClient ? `Opslaan voor ${selectedClient.naam}` : 'Selecteer client'}
                                  </>
                                )}
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center space-x-4 text-xs text-muted-foreground pt-1">
                            {schedule.last_run_at && (
                              <span>Laatst: {new Date(schedule.last_run_at).toLocaleString('nl-NL')}</span>
                            )}
                            {schedule.next_run_at && (
                              <span>Volgende: {new Date(schedule.next_run_at).toLocaleString('nl-NL')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch 
                          checked={schedule.active}
                          onCheckedChange={() => handleToggleSchedule(schedule.id, schedule.active)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem 
                              onClick={() => handleToggleSchedule(schedule.id, schedule.active)}
                              className="cursor-pointer"
                            >
                              {schedule.active ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pauzeren
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Activeren
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                // TODO: Implement edit functionality
                                toast({
                                  title: "Info",
                                  description: "Bewerken functionaliteit komt binnenkort beschikbaar"
                                })
                              }}
                              className="cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                // TODO: Implement duplicate functionality
                                toast({
                                  title: "Info", 
                                  description: "Dupliceren functionaliteit komt binnenkort beschikbaar"
                                })
                              }}
                              className="cursor-pointer"
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Dupliceren
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                // TODO: Implement run now functionality
                                toast({
                                  title: "Info",
                                  description: "Nu uitvoeren functionaliteit komt binnenkort beschikbaar"
                                })
                              }}
                              className="cursor-pointer"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Nu uitvoeren
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteSchedule(schedule.id)} 
                              className="text-destructive cursor-pointer focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Monitor */}
      <div className="mt-6">
        <WorkflowMonitor />
      </div>

      <CreateSchedulerDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onScheduleCreated={fetchSchedules}
      />
    </div>
  )
}