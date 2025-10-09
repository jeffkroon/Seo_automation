"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Folder, Building2, Calendar, TrendingUp, Clock } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"
import { useClientContext } from "@/hooks/use-client-context"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

interface DashboardStats {
  totalArticles: number
  totalProjects: number
  totalClients: number
  activeSchedules: number
  articlesThisMonth: number
}

interface RecentArticle {
  id: string
  title: string
  focus_keyword: string
  article_type: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { selectedClient } = useClientContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentArticles, setRecentArticles] = useState<RecentArticle[]>([])
  const [articlesByMonth, setArticlesByMonth] = useState<Record<string, number>>({})
  const [articlesByType, setArticlesByType] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [aiGreeting, setAiGreeting] = useState<string>('')
  const [isLoadingGreeting, setIsLoadingGreeting] = useState(false)

  // Redirect viewers to archive
  useEffect(() => {
    if (user?.role === 'viewer') {
      router.push('/dashboard/archive')
    }
  }, [user, router])

  useEffect(() => {
    if (user?.role !== 'viewer') {
      fetchDashboardData()
    }
  }, [selectedClient, user])

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morgen'
    if (hour < 18) return 'middag'
    return 'avond'
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const clientParam = selectedClient?.id ? `?client_id=${selectedClient.id}` : ''
      const response = await apiClient(`/api/dashboard/stats${clientParam}`)
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentArticles(data.recentArticles || [])
        setArticlesByMonth(data.articlesByMonth || {})
        setArticlesByType(data.articlesByType || {})
        
        // Generate AI greeting after stats are loaded
        generateAIGreeting(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateAIGreeting = async (statsData: DashboardStats) => {
    try {
      setIsLoadingGreeting(true)
      const timeOfDay = getTimeOfDay()
      
      const response = await apiClient('/api/dashboard/greeting', {
        method: 'POST',
        body: JSON.stringify({
          userEmail: user?.email || '',
          timeOfDay,
          stats: statsData
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiGreeting(data.greeting)
      }
    } catch (error) {
      console.error('Error generating greeting:', error)
      // Fallback greeting with name extraction
      const timeOfDay = getTimeOfDay()
      const emailPrefix = user?.email?.split('@')[0] || 'daar'
      const firstName = emailPrefix.split(/[._-]/)[0].charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)
      setAiGreeting(`Goed${timeOfDay} ${firstName}! 👋 Klaar om vandaag weer geweldige content te maken?`)
    } finally {
      setIsLoadingGreeting(false)
    }
  }

  // Don't render for viewers (they get redirected)
  if (user?.role === 'viewer') {
    return null
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Prepare month data for chart
  const monthLabels = Object.keys(articlesByMonth).sort()
  const maxArticles = Math.max(...Object.values(articlesByMonth), 1)

  return (
    <div className="p-6 space-y-6">
      {/* AI Greeting Card */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardContent className="pt-6">
          {isLoadingGreeting ? (
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-lg text-muted-foreground">Persoonlijke boodschap aan het genereren...</p>
            </div>
          ) : aiGreeting ? (
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xl font-medium leading-relaxed">
                  {aiGreeting}
                </p>
                {selectedClient && (
                  <p className="text-sm text-muted-foreground mt-2">
                    📊 Bekijk je statistieken voor {selectedClient.naam}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Welkom terug! 👋</h2>
                <p className="text-muted-foreground mt-1">
                  Overzicht van je content generatie en projecten
                  {selectedClient && ` voor ${selectedClient.naam}`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totaal Artikelen</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalArticles || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.articlesThisMonth || 0} deze maand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projecten</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Actieve projecten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClients || 0}</div>
            <p className="text-xs text-muted-foreground">
              Totaal aantal clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actieve Schedulers</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSchedules || 0}</div>
            <p className="text-xs text-muted-foreground">
              Geplande taken
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Articles by Month Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Artikelen per Maand</CardTitle>
            <CardDescription>Laatste 6 maanden</CardDescription>
          </CardHeader>
          <CardContent>
            {monthLabels.length > 0 ? (
              <div className="space-y-4">
                {monthLabels.map((month) => {
                  const count = articlesByMonth[month]
                  const percentage = (count / maxArticles) * 100
                  const [year, monthNum] = month.split('-')
                  const monthName = format(new Date(parseInt(year), parseInt(monthNum) - 1), 'MMMM yyyy', { locale: nl })
                  
                  return (
                    <div key={month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{monthName}</span>
                        <span className="text-muted-foreground">{count} artikelen</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen artikelen gegenereerd
              </div>
            )}
          </CardContent>
        </Card>

        {/* Articles by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Artikelen per Type</CardTitle>
            <CardDescription>Verdeling informatief vs transactioneel</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(articlesByType).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(articlesByType).map(([type, count]) => {
                  const total = Object.values(articlesByType).reduce((a, b) => a + b, 0)
                  const percentage = ((count / total) * 100).toFixed(1)
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant={type === 'informatief' ? 'default' : 'secondary'}>
                            {type === 'informatief' ? 'Informatief' : 
                             type === 'transactioneel' ? 'Transactioneel' : 
                             'Onbekend'}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">{count} ({percentage}%)</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen artikelen gegenereerd
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Articles */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Gegenereerde Artikelen</CardTitle>
          <CardDescription>Laatste 10 artikelen</CardDescription>
        </CardHeader>
        <CardContent>
          {recentArticles.length > 0 ? (
            <div className="space-y-3">
              {recentArticles.map((article) => (
                <div 
                  key={article.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{article.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {article.focus_keyword}
                        </Badge>
                        {article.article_type && (
                          <Badge variant="secondary" className="text-xs">
                            {article.article_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(article.created_at), 'dd MMM', { locale: nl })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nog geen artikelen gegenereerd</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
