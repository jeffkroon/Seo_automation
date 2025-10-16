"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, CalendarDays, Plus, Edit, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Target, FileText, GripVertical, Eye, X, Download } from "lucide-react"
import { useClientContext } from "@/hooks/use-client-context"
import { useAuth } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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

interface RedditTemplate {
  id: string
  title: string
  description?: string
  search_type: string
  keyword?: string
  max_results?: number
  date_range?: string
  created_at: string
}

interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  isCurrentMonth: boolean
  isToday: boolean
}

export function ContentCalendar() {
  const { selectedClient } = useClientContext()
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([])
  const [redditTemplates, setRedditTemplates] = useState<RedditTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<any>(null)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)
  const [draggedTemplate, setDraggedTemplate] = useState<ScheduleTemplate | RedditTemplate | null>(null)
  
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

  const fetchEvents = async () => {
    if (!selectedClient) return
    
    try {
      setIsLoading(true)
      const response = await apiClient(`/api/calendar/events?client_id=${selectedClient.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setEvents(data.events || [])
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
      
      const dateStr = date.toISOString().split('T')[0]
      const dayEvents = events.filter(event => event.scheduled_date === dateStr)
      
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
      // Check if it's a Reddit template or Schedule template
      if (draggedTemplate && 'search_type' in draggedTemplate) {
        // Reddit template - cast to RedditTemplate
        const redditTemplate = draggedTemplate as RedditTemplate
        const redditData = {
          title: redditTemplate.title,
          description: redditTemplate.description,
          scheduled_date: dateStr,
          scheduled_time: '09:00',
          search_type: redditTemplate.search_type,
          keyword: redditTemplate.keyword,
          max_results: redditTemplate.max_results,
          date_range: redditTemplate.date_range,
          client_id: selectedClient.id,
          company_id: user?.companyId
        }

        const response = await apiClient('/api/reddit-events', {
          method: 'POST',
          body: JSON.stringify(redditData)
        })

        if (response.ok) {
          toast({
            title: "Succes",
            description: `Reddit analyse gepland voor ${date.toLocaleDateString('nl-NL')}!`
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
      } else {
        // Schedule template - cast to ScheduleTemplate
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
            description: `Content event gepland voor ${date.toLocaleDateString('nl-NL')}!`
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
    if (!selectedClient || !title.trim() || !focusKeyword.trim()) {
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
    if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) return

    try {
      const response = await apiClient(`/api/schedule-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: "Succes",
          description: "Template verwijderd!"
        })
        fetchScheduleTemplates()
      } else {
        toast({
          title: "Fout",
          description: "Kon template niet verwijderen",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast({
        title: "Fout",
        description: "Er ging iets mis bij het verwijderen",
        variant: "destructive"
      })
    }
  }

  const handleViewArticle = async (event: CalendarEvent) => {
    if (!event.generated_article_id) {
      toast({
        title: "Geen artikel gevonden",
        description: "Dit event heeft nog geen gegenereerd artikel",
        variant: "destructive"
      })
      return
    }

    try {
      // Fetch the article details
      const response = await apiClient(`/api/articles/${event.generated_article_id}`)
      if (response.ok) {
        const article = await response.json()
        setSelectedArticle(article)
        setSidePanelOpen(true)
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
    setArticleType("informatief")
    setLanguage("nl")
    setCountry("nl")
    setWebsiteUrl("")
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
          <h3 className="text-lg font-semibold mb-2">Selecteer een Client</h3>
          <p className="text-muted-foreground">
            Selecteer eerst een client om de content kalender te bekijken.
          </p>
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
              {/* Day headers */}
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={cn(
                    "min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                    !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                    day.isToday && "bg-primary/10 border-primary"
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
                          "p-1 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity",
                          getStatusColor(event.status)
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(event.status)}
                          <span className="truncate flex-1">{event.title}</span>
                          {event.status === 'completed' && event.generated_article_id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewArticle(event)
                              }}
                              className="ml-1 p-0.5 hover:bg-white/20 rounded"
                              title="Bekijk artikel"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          )}
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
                        onClick={() => handleTemplateClick(template)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
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
                      <div className="prose max-w-none">
                        {selectedArticle.content_article}
                      </div>
                    </div>
                  </div>
                )}

                {selectedArticle.content_faq && (
                  <div className="space-y-3">
                    <h4 className="font-medium">FAQ Content</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="prose max-w-none">
                        {selectedArticle.content_faq}
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