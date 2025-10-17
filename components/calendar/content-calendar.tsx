"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CalendarDays, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Target, FileText, GripVertical, Eye, X, Download, Hash } from "lucide-react"
import { useClientContext } from "@/hooks/use-client-context"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"

interface CalendarEvent {
  id: string
  title: string
  description?: string
  scheduled_date: string
  scheduled_time: string
  status: 'scheduled' | 'generating' | 'completed' | 'failed' | 'cancelled'
  focus_keyword: string
  extra_keywords?: string[]
  extra_headings?: string[]
  article_type: string
  language: string
  country: string
  website_url?: string
  generated_article_id?: string
  generation_error?: string
  created_at: string
  client_id?: string
  company_id?: string
  member_id?: string
}

interface ScheduleTemplate {
  id: string
  title: string
  description?: string
  focus_keyword: string
  extra_keywords?: string[]
  extra_headings?: string[]
  article_type: string
  language: string
  country: string
  website_url?: string
  created_at: string
}

// Markdown components (same as schedulers page)
const markdownComponents: Components = {
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

// Helper function to transform markdown (same as schedulers page)
const transformMarkdown = (markdown: string): string => {
  let cleaned = markdown.replace(/^\s*DO NOT wrap in ```html```\s*/i, "").trim()
  const fenceMatch = cleaned.match(/^```(\w+)?\n([\s\S]*)\n```$/)
  if (fenceMatch) {
    const language = fenceMatch[1]?.toLowerCase()
    if (language === 'html' || language === 'markdown') {
      cleaned = fenceMatch[2].trim()
    }
  }
  return cleaned
}


interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  isCurrentMonth: boolean
  isToday: boolean
}

export function ContentCalendar() {
  const { selectedClient, clients, isLoading: clientsLoading } = useClientContext()
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [draggedTemplate, setDraggedTemplate] = useState<ScheduleTemplate | null>(null)
  
  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [scheduledDate, setScheduledDate] = useState("")
  const [scheduledTime, setScheduledTime] = useState("09:00")
  const [focusKeyword, setFocusKeyword] = useState("")
  const [extraKeywords, setExtraKeywords] = useState<string[]>([])
  const [extraHeadings, setExtraHeadings] = useState<string[]>([])
  const [articleType, setArticleType] = useState("informatief")
  const [language, setLanguage] = useState("nl")
  const [country, setCountry] = useState("nl")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  // Template type and additional fields
  const [templateType, setTemplateType] = useState<"content">("content")
  const [newKeyword, setNewKeyword] = useState("")
  const [newHeading, setNewHeading] = useState("")
  

  // Helper functions for keywords and headings
  const addKeyword = () => {
    if (newKeyword.trim() && !extraKeywords.includes(newKeyword.trim())) {
      setExtraKeywords([...extraKeywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setExtraKeywords(extraKeywords.filter(k => k !== keywordToRemove))
  }

  const addHeading = () => {
    if (newHeading.trim() && !extraHeadings.includes(newHeading.trim())) {
      setExtraHeadings([...extraHeadings, newHeading.trim()])
      setNewHeading("")
    }
  }

  const removeHeading = (headingToRemove: string) => {
    setExtraHeadings(extraHeadings.filter(h => h !== headingToRemove))
  }

  const fetchEvents = async () => {
    if (!selectedClient) return
    
    try {
      setIsLoading(true)
      const response = await apiClient(`/api/calendar/events?client_id=${selectedClient.id}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📅 Events fetched:', data.events?.length || 0, 'events')
        console.log('📅 Events data:', data.events)
        
        // Ensure each event has client_id, company_id, and member_id
        const eventsWithIds = (data.events || []).map((event: any) => ({
          ...event,
          client_id: event.client_id || selectedClient.id,
          company_id: event.company_id || user?.companyId,
          member_id: event.member_id || user?.id
        }))
        
        setEvents(eventsWithIds)
      } else {
        toast({
          title: "Fout",
          description: "Kon kalender events niet ophalen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het ophalen van de kalender",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchScheduleTemplates = async () => {
    if (!selectedClient) return
    
    try {
      const response = await apiClient(`/api/schedule-templates?client_id=${selectedClient.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setScheduleTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching schedule templates:', error)
    }
  }


  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days: CalendarDay[] = []
    const today = new Date()
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      const dayEvents = events.filter(event => event.scheduled_date === dateStr)
      
      // Debug logging for events
      if (dayEvents.length > 0) {
        console.log(`📅 ${dateStr}: ${dayEvents.length} events`, dayEvents)
      }
      
      days.push({
        date,
        events: dayEvents,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString()
      })
    }
    
    return days
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    // Use local date to avoid timezone issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    setScheduledDate(dateStr)
    setIsDialogOpen(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event)
    setTitle(event.title)
    setDescription(event.description || "")
    setScheduledDate(event.scheduled_date)
    setScheduledTime(event.scheduled_time)
    setFocusKeyword(event.focus_keyword)
    setExtraKeywords(event.extra_keywords || [])
    setExtraHeadings(event.extra_headings || [])
    setArticleType(event.article_type)
    setLanguage(event.language)
    setCountry(event.country)
    setWebsiteUrl(event.website_url || "")
    setIsDialogOpen(true)
  }

  const handleTemplateClick = (template: ScheduleTemplate) => {
    setEditingTemplate(template)
    setTitle(template.title)
    setDescription(template.description || "")
    setFocusKeyword(template.focus_keyword)
    setExtraKeywords(template.extra_keywords || [])
    setExtraHeadings(template.extra_headings || [])
    setArticleType(template.article_type)
    setLanguage(template.language)
    setCountry(template.country)
    setWebsiteUrl(template.website_url || "")
    setIsDialogOpen(true)
  }

  const handleDragStart = (e: React.DragEvent, template: ScheduleTemplate) => {
    setDraggedTemplate(template)
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = async (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    
    if (!draggedTemplate || !selectedClient) return

    // Use local date to avoid timezone issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    try {
      // Schedule template
      const scheduleTemplate = draggedTemplate as ScheduleTemplate
      const eventData = {
        title: scheduleTemplate.title,
        description: scheduleTemplate.description,
        scheduled_date: dateStr,
        scheduled_time: '09:00',
        focus_keyword: scheduleTemplate.focus_keyword,
        extra_keywords: scheduleTemplate.extra_keywords,
        extra_headings: scheduleTemplate.extra_headings,
        article_type: scheduleTemplate.article_type,
        language: scheduleTemplate.language,
        country: scheduleTemplate.country,
        website_url: scheduleTemplate.website_url,
        client_id: selectedClient.id,
        company_id: user?.companyId
      }

      const response = await apiClient('/api/calendar/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: `Artikel gepland voor ${date.toLocaleDateString('nl-NL')}!`
        })
        fetchEvents()
      } else {
        const errorData = await response.json()
        toast({
          title: "Fout",
          description: errorData.error || "Er ging iets mis",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating event from template:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het aanmaken van het event",
        variant: "destructive"
      })
    } finally {
      setDraggedTemplate(null)
    }
  }

  const handleSave = async () => {
    console.log('🔍 handleSave called with:', {
      selectedClient,
      title,
      focusKeyword,
      editingEvent,
      editingTemplate
    });
    
    if (!selectedClient) {
      toast({
        title: "Geen client geselecteerd",
        description: "Selecteer eerst een client om een template aan te maken",
        variant: "destructive"
      })
      return
    }

    if (!title.trim() || !focusKeyword.trim()) {
      toast({
        title: "Fout",
        description: "Titel en focus keyword zijn verplicht",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSaving(true)
      
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        focus_keyword: focusKeyword.trim(),
        extra_keywords: extraKeywords,
        extra_headings: extraHeadings,
        article_type: articleType,
        language,
        country,
        website_url: websiteUrl.trim(),
        client_id: selectedClient.id,
        company_id: user?.companyId
      }

      if (editingEvent) {
        // Update existing event
        const response = await apiClient(`/api/calendar/events/${editingEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify(eventData)
        })

        if (response.ok) {
          toast({
            title: "Succes",
            description: "Event bijgewerkt!"
          })
          setIsDialogOpen(false)
          resetForm()
          fetchEvents()
        } else {
          const errorData = await response.json()
          toast({
            title: "Fout",
            description: errorData.error || "Er ging iets mis",
            variant: "destructive"
          })
        }
      } else if (editingTemplate) {
        // Update template
        const response = await apiClient(`/api/schedule-templates/${editingTemplate.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            focus_keyword: focusKeyword.trim(),
            extra_keywords: extraKeywords,
            extra_headings: extraHeadings,
            article_type: articleType,
            language,
            country,
            website_url: websiteUrl.trim(),
            client_id: selectedClient.id,
            company_id: user?.companyId
          })
        })

        if (response.ok) {
          toast({
            title: "Succes",
            description: "Template bijgewerkt!"
          })
          setIsDialogOpen(false)
          resetForm()
          fetchScheduleTemplates()
        } else {
          const errorData = await response.json()
          toast({
            title: "Fout",
            description: errorData.error || "Er ging iets mis",
            variant: "destructive"
          })
        }
      } else {
        // Create new template
        const response = await apiClient('/api/schedule-templates', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            focus_keyword: focusKeyword.trim(),
            extra_keywords: extraKeywords,
            extra_headings: extraHeadings,
            article_type: articleType,
            language,
            country,
            website_url: websiteUrl.trim(),
            client_id: selectedClient.id,
            company_id: user?.companyId
          })
        })

        if (response.ok) {
          toast({
            title: "Succes",
            description: "Template aangemaakt!"
          })
          setIsDialogOpen(false)
          resetForm()
          fetchScheduleTemplates()
        } else {
          const errorData = await response.json()
          toast({
            title: "Fout",
            description: errorData.error || "Er ging iets mis",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het opslaan",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Weet je zeker dat je dit event wilt verwijderen?')) return

    try {
      const response = await apiClient(`/api/calendar/events/${eventId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: "Event verwijderd!"
        })
        fetchEvents()
      } else {
        toast({
          title: "Fout",
          description: "Kon event niet verwijderen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het verwijderen",
        variant: "destructive"
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    console.log('🗑️ Delete template clicked for ID:', templateId)
    
    if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) {
      console.log('❌ User cancelled deletion')
      return
    }

    console.log('✅ User confirmed deletion, proceeding...')

    try {
      console.log('📡 Making DELETE request to:', `/api/schedule-templates/${templateId}`)
      
      const response = await apiClient(`/api/schedule-templates/${templateId}`, {
        method: 'DELETE'
      })

      console.log('📡 DELETE response status:', response.status)
      console.log('📡 DELETE response ok:', response.ok)

      if (response.ok) {
        console.log('✅ Template deleted successfully')
        toast({
          title: "Succes",
          description: "Template verwijderd!"
        })
        fetchScheduleTemplates()
      } else {
        const errorData = await response.json()
        console.error('❌ Delete failed:', errorData)
        toast({
          title: "Fout",
          description: errorData.error || "Kon template niet verwijderen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('❌ Error deleting template:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het verwijderen",
        variant: "destructive"
      })
    }
  }


  const handleViewArticle = async (event: CalendarEvent) => {
    try {
      // Fetch the article details from schedule_articles table using the schedule ID
      const response = await apiClient(`/api/schedule-articles?schedule_id=${event.id}`)
      if (response.ok) {
        const data = await response.json()
        const scheduleArticle = data.articles?.[0]
        
        if (scheduleArticle) {
          // Transform schedule_articles data to match expected format
          const article = {
            id: scheduleArticle.id,
            focus_keyword: event.focus_keyword,
            title: event.title || event.focus_keyword,
            country: event.country,
            language: event.language,
            article_type: event.article_type,
            additional_keywords: event.extra_keywords || [],
            additional_headings: event.extra_headings || [],
            content_article: scheduleArticle.article,
            content_faq: scheduleArticle.faqs,
            generated_at: scheduleArticle.generated_at
          }
          setSelectedArticle(article)
          setSidePanelOpen(true)
        } else {
          toast({
            title: "Geen artikel gevonden",
            description: "Geen artikel gevonden in schedule_articles voor deze schedule",
            variant: "destructive"
          })
        }
      } else {
        toast({
          title: "Fout",
          description: "Kon artikel niet laden",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching article:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het laden van het artikel",
        variant: "destructive"
      })
    }
  }

  const handleSaveToArchive = async (event: CalendarEvent) => {
    try {
      // Fetch the article details from schedule_articles table using the schedule ID
      const response = await apiClient(`/api/schedule-articles?schedule_id=${event.id}`)
      if (!response.ok) {
        toast({
          title: "Fout",
          description: "Kon artikel niet laden uit schedule_articles",
          variant: "destructive"
        })
        return
      }

      const data = await response.json()
      const scheduleArticle = data.articles?.[0]
      
      if (!scheduleArticle) {
        toast({
          title: "Geen artikel gevonden",
          description: "Geen artikel gevonden in schedule_articles voor deze schedule",
          variant: "destructive"
        })
        return
      }
      
      // Create a new article in the archive (generated_articles table)
      const archiveResponse = await apiClient('/api/generated-articles', {
        method: 'POST',
        body: JSON.stringify({
          company_id: event.company_id || user?.companyId,
          member_id: event.member_id || user?.id,
          client_id: event.client_id,
          focus_keyword: event.focus_keyword,
          title: event.title || event.focus_keyword,
          country: event.country,
          language: event.language,
          article_type: event.article_type,
          additional_keywords: event.extra_keywords || [],
          additional_headings: event.extra_headings || [],
          content_article: scheduleArticle.article,
          content_faq: scheduleArticle.faqs,
          generated_at: scheduleArticle.generated_at || new Date().toISOString()
        })
      })

      if (archiveResponse.ok) {
        toast({
          title: "Succes",
          description: "Artikel opgeslagen in content archief!"
        })
      } else {
        const errorData = await archiveResponse.json()
        toast({
          title: "Fout",
          description: errorData.error || "Kon artikel niet opslaan",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving to archive:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het opslaan",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setEditingEvent(null)
    setEditingTemplate(null)
    setTitle("")
    setDescription("")
    setScheduledDate("")
    setScheduledTime("09:00")
    setFocusKeyword("")
    setExtraKeywords([])
    setExtraHeadings([])
    setNewKeyword("")
    setNewHeading("")
    setArticleType("informatief")
    setLanguage("nl")
    setCountry("nl")
    setWebsiteUrl("")
    setTemplateType("content")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'generating':
        return <Clock className="h-3 w-3 text-blue-600" />
      case 'failed':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'cancelled':
        return <AlertCircle className="h-3 w-3 text-gray-600" />
      default:
        return <Clock className="h-3 w-3 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'generating':
        return 'bg-blue-100 text-blue-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    fetchEvents()
    fetchScheduleTemplates()
  }, [selectedClient])

  // Auto-refresh events every 30 seconds to show status updates
  useEffect(() => {
    if (!selectedClient) return

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing calendar events...')
      fetchEvents()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [selectedClient])

  // Real-time updates for schedules
  useEffect(() => {
    if (!selectedClient) return

    console.log('🔔 Setting up real-time subscription for schedules...')
    
    const subscription = supabase
      .channel('schedules-changes')
      .on('postgres_changes', 
        { 
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public', 
          table: 'schedules',
          filter: `client_id=eq.${selectedClient.id}`
        }, 
        (payload) => {
          console.log('📡 Real-time schedule update received:', payload)
          // Refresh events when schedules change
          fetchEvents()
        }
      )
      .subscribe()

    return () => {
      console.log('🔕 Cleaning up real-time subscription...')
      subscription.unsubscribe()
    }
  }, [selectedClient])

  const calendarDays = generateCalendarDays()
  const monthNames = [
    "Januari", "Februari", "Maart", "April", "Mei", "Juni",
    "Juli", "Augustus", "September", "Oktober", "November", "December"
  ]

  if (!selectedClient) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Geen client geselecteerd</h3>
          <p className="text-muted-foreground mb-4">
            Selecteer eerst een client om de content kalender te bekijken.
          </p>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <p><strong>Debug info:</strong></p>
            <p>Clients loaded: {clients.length}</p>
            <p>Loading: {clientsLoading ? 'Yes' : 'No'}</p>
            <p>Selected client: {selectedClient ? 'Client selected' : 'None'}</p>
            {clients.length === 0 && !clientsLoading && (
              <p className="text-red-500 mt-2">
                Geen clients gevonden. Ga naar /dashboard/admin/clients om een client aan te maken.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Content Kalender</h1>
            <p className="text-muted-foreground">
              Plan content voor {selectedClient.naam}
            </p>
          </div>
        </div>
        
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Template
        </Button>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Vandaag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
              >
                →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Kalender laden...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers with full day names */}
              {[
                { short: 'Ma', full: 'Maandag' },
                { short: 'Di', full: 'Dinsdag' },
                { short: 'Wo', full: 'Woensdag' },
                { short: 'Do', full: 'Donderdag' },
                { short: 'Vr', full: 'Vrijdag' },
                { short: 'Za', full: 'Zaterdag' },
                { short: 'Zo', full: 'Zondag' }
              ].map((day) => (
                <div key={day.short} className="p-3 text-center bg-muted rounded-lg">
                  <div className="text-sm font-semibold text-foreground">{day.short}</div>
                  <div className="text-xs text-muted-foreground mt-1">{day.full}</div>
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] p-3 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg",
                    !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                    day.isToday && "bg-primary/10 border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => handleDateClick(day.date)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day.date)}
                >
                  <div className="text-sm font-medium mb-1">
                    {day.date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "p-2 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity bg-white border",
                          getStatusColor(event.status)
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "px-1 py-0.5 rounded text-xs font-medium",
                            event.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            event.status === 'generating' ? 'bg-blue-100 text-blue-800' :
                            event.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          )}>
                            {event.status === 'completed' ? 'PUBLISHED' :
                             event.status === 'generating' ? 'GENERATING' :
                             event.status === 'failed' ? 'FAILED' :
                             'SCHEDULED'}
                          </span>
                          {event.status === 'completed' && (
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewArticle(event)
                                }}
                                className="p-0.5 hover:bg-white/20 rounded"
                                title="Bekijk artikel"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleSaveToArchive(event)
                                }}
                                className="p-0.5 hover:bg-white/20 rounded"
                                title="Opslaan in archief"
                              >
                                <Download className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          {/* Debug info */}
                          {process.env.NODE_ENV === 'development' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Status: {event.status} | Article ID: {event.generated_article_id || 'none'}
                            </div>
                          )}
                        </div>
                        
                        {/* Event Title */}
                        <div className="font-medium text-gray-900 truncate mb-1">
                          {event.title}
                        </div>
                        
                        {/* Event Description/Keyword */}
                        <div className="text-gray-600 text-xs truncate">
                          {event.focus_keyword}
                        </div>
                      </div>
                    ))}
                    
                    {day.events.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{day.events.length - 3} meer
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Schedule Templates
          </CardTitle>
          <CardDescription>
            Sleep templates naar de kalender om content te plannen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduleTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-move hover:shadow-md transition-shadow"
                draggable
                onDragStart={(e) => handleDragStart(e, template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">{template.title}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateClick(template)
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          console.log('🔴 Delete button clicked!')
                          e.stopPropagation()
                          console.log('🔴 Calling handleDeleteTemplate with ID:', template.id)
                          handleDeleteTemplate(template.id)
                        }}
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <strong>Focus:</strong> {template.focus_keyword}
                  </div>
                  {template.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {template.article_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {template.language}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {scheduleTemplates.length === 0 && (
              <div className="col-span-full text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Geen Templates</h3>
                <p className="text-muted-foreground mb-4">
                  Maak je eerste schedule template aan
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Template
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      {/* Event/Template Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Event Bewerken' : 
               editingTemplate ? 'Template Bewerken' : 
               'Nieuwe Schedule Template'}
            </DialogTitle>
            <DialogDescription>
              {editingEvent 
                ? 'Wijzig de details van dit content event.' 
                : editingTemplate
                ? 'Wijzig de details van deze template.'
                : 'Maak een nieuwe schedule template aan die je kunt slepen naar de kalender.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="Bijv. SEO Tips Blog"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="focus-keyword">Focus Keyword *</Label>
                <Input
                  id="focus-keyword"
                  placeholder="Bijv. seo tips"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Template Type Selector - only for new templates */}

            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                placeholder="Extra informatie over deze template..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Extra Keywords and Headings - for content templates and events */}
            {(templateType === "content" || editingEvent) && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="extra-keywords">Extra Keywords</Label>
                  <div className="flex gap-2">
                    <Input
                      id="extra-keywords"
                      placeholder="Voeg extra keyword toe..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" onClick={addKeyword} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {extraKeywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {extraKeywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extra-headings">Extra Headings</Label>
                  <div className="flex gap-2">
                    <Input
                      id="extra-headings"
                      placeholder="Voeg extra heading toe..."
                      value={newHeading}
                      onChange={(e) => setNewHeading(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHeading())}
                    />
                    <Button type="button" onClick={addHeading} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {extraHeadings.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {extraHeadings.map((heading, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="h-1 w-1 rounded-full bg-gray-500 flex-shrink-0" />
                          <span className="flex-1">{heading}</span>
                          <button
                            type="button"
                            onClick={() => removeHeading(heading)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}


            {/* Only show date/time fields for events */}
            {editingEvent && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduled-date">Datum *</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scheduled-time">Tijd</Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Show these fields for content templates and events */}
            {(!editingEvent || editingEvent) && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="article-type">Artikel Type</Label>
                  <Select value={articleType} onValueChange={setArticleType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="informatief">Informatief</SelectItem>
                      <SelectItem value="transactioneel">Transactioneel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="language">Taal</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">Nederland</SelectItem>
                      <SelectItem value="be">België</SelectItem>
                      <SelectItem value="de">Duitsland</SelectItem>
                      <SelectItem value="fr">Frankrijk</SelectItem>
                      <SelectItem value="es">Spanje</SelectItem>
                      <SelectItem value="us">Verenigde Staten</SelectItem>
                      <SelectItem value="uk">Verenigd Koninkrijk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Show website URL for content templates and events */}
            {(!editingEvent || editingEvent) && (
              <div className="space-y-2">
                <Label htmlFor="website-url">Website URL</Label>
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {(editingEvent || editingTemplate) && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDialogOpen(false)
                    if (editingEvent) {
                      handleDelete(editingEvent.id)
                    } else if (editingTemplate) {
                      handleDeleteTemplate(editingTemplate.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Annuleren
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Opslaan...' : 
                 editingEvent ? 'Bijwerken' : 
                 editingTemplate ? 'Bijwerken' : 'Aanmaken'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Side Panel for Article View */}
      {sidePanelOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end">
          <div className="bg-white h-full w-full max-w-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Gegenereerd Artikel</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSidePanelOpen(false)
                  setSelectedArticle(null)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6 overflow-y-auto h-full">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{selectedArticle.title}</h3>
                  <div className="text-sm text-muted-foreground mb-4">
                    {selectedArticle.focus_keyword} • {new Date(selectedArticle.created_at).toLocaleDateString('nl-NL')}
                  </div>
                </div>

                {selectedArticle.content_article && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Artikel Content</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {transformMarkdown(selectedArticle.content_article)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                {selectedArticle.content_faq && (
                  <div className="space-y-3">
                    <h4 className="font-medium">FAQ Content</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                          {transformMarkdown(selectedArticle.content_faq)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Artikel Type:</span>
                    <div className="mt-1">{selectedArticle.article_type || 'Onbekend'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Land:</span>
                    <div className="mt-1">{selectedArticle.country || 'Niet opgegeven'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Taal:</span>
                    <div className="mt-1">{selectedArticle.language || 'Niet opgegeven'}</div>
                  </div>
                  <div>
                    <span className="font-medium">Gegenereerd:</span>
                    <div className="mt-1">{new Date(selectedArticle.created_at).toLocaleString('nl-NL')}</div>
                  </div>
                </div>

                {selectedArticle.additional_keywords && selectedArticle.additional_keywords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Extra Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.additional_keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedArticle.additional_headings && selectedArticle.additional_headings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Extra Headings</h4>
                    <div className="space-y-1">
                      {selectedArticle.additional_headings.map((heading: string, index: number) => (
                        <div key={index} className="text-sm text-gray-700">
                          • {heading}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Download functionality
                      const content = selectedArticle.content_article || ''
                      const blob = new Blob([content], { type: 'text/html' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${selectedArticle.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
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