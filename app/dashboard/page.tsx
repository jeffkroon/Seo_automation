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
import { ScrambleText } from "@/components/ascii-text"

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
    if (hour < 12) return 'morning'
    if (hour < 18) return 'afternoon'
    return 'evening'
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

  const collectAllContext = async () => {
    const ua = navigator.userAgent
    
    // Browser detection
    let browser = 'unknown'
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
    else if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Edg')) browser = 'Edge'
    
    // Device type
    const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua)
    const deviceType = isMobile ? 'mobile' : 'desktop'
    
    // Platform/OS
    let platform = 'unknown'
    if (ua.includes('Win')) platform = 'Windows'
    else if (ua.includes('Mac')) platform = 'macOS'
    else if (ua.includes('Linux')) platform = 'Linux'
    else if (ua.includes('Android')) platform = 'Android'
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS'
    
    // Dark mode
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    
    // Battery status
    let battery = null
    try {
      if ('getBattery' in navigator) {
        const batteryObj = await (navigator as any).getBattery()
        battery = {
          level: Math.round(batteryObj.level * 100),
          charging: batteryObj.charging,
          chargingTime: batteryObj.chargingTime,
          dischargingTime: batteryObj.dischargingTime
        }
      }
    } catch (e) {
      console.log('Battery API not available')
    }
    
    // Returning visitor
    const visitCount = parseInt(localStorage.getItem('dashboardVisitCount') || '0')
    localStorage.setItem('dashboardVisitCount', (visitCount + 1).toString())
    const isReturning = visitCount > 0
    
    // Referrer
    const referrer = document.referrer
    let referrerSource = 'direct'
    if (referrer.includes('google')) referrerSource = 'Google'
    else if (referrer.includes('bing')) referrerSource = 'Bing'
    else if (referrer.includes('facebook')) referrerSource = 'Facebook'
    else if (referrer.includes('linkedin')) referrerSource = 'LinkedIn'
    else if (referrer.includes('twitter') || referrer.includes('x.com')) referrerSource = 'Twitter/X'
    else if (referrer && referrer !== window.location.href) referrerSource = 'another site'
    
    // Time on site (from session start)
    const sessionStart = parseInt(sessionStorage.getItem('sessionStart') || Date.now().toString())
    if (!sessionStorage.getItem('sessionStart')) {
      sessionStorage.setItem('sessionStart', Date.now().toString())
    }
    const timeOnSite = Math.floor((Date.now() - sessionStart) / 1000) // seconds
    
    // Screen resolution
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height
    
    // Viewport size
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Connection info (if available)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    const connectionType = connection?.effectiveType || 'unknown'
    
    // Language
    const language = navigator.language || 'en'
    
    // Timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    
    // Local time
    const now = new Date()
    const localTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    
    // Get location from IP (using a free API)
    let location = null
    try {
      const locationResponse = await fetch('https://ipapi.co/json/')
      if (locationResponse.ok) {
        location = await locationResponse.json()
      }
    } catch (e) {
      console.log('Could not fetch location')
    }
    
    return {
      browser,
      deviceType,
      platform,
      isDarkMode,
      isReturning,
      visitCount,
      referrerSource,
      timeOnSite,
      screenResolution: `${screenWidth}×${screenHeight}`,
      viewportSize: `${viewportWidth}×${viewportHeight}`,
      connectionType,
      language,
      timezone,
      localTime,
      battery,
      location: location ? {
        city: location.city,
        region: location.region,
        country: location.country_name,
        ip: location.ip
      } : null
    }
  }

  const generateAIGreeting = async (statsData: DashboardStats) => {
    try {
      // Check if we have a cached greeting (less than 5 minutes old)
      const cachedGreeting = localStorage.getItem('aiGreeting')
      const cachedTimestamp = localStorage.getItem('aiGreetingTimestamp')
      
      if (cachedGreeting && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp)
        const fiveMinutes = 5 * 60 * 1000
        
        if (age < fiveMinutes) {
          console.log('Using cached greeting (age:', Math.floor(age / 1000), 'seconds)')
          setAiGreeting(cachedGreeting)
          return
        }
      }
      
      setIsLoadingGreeting(true)
      const timeOfDay = getTimeOfDay()
      const hour = new Date().getHours()
      
      // Collect ALL context
      const context = await collectAllContext()
      
      const response = await apiClient('/api/dashboard/greeting', {
        method: 'POST',
        body: JSON.stringify({
          userEmail: user?.email || '',
          timeOfDay,
          hour,
          stats: statsData,
          context
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiGreeting(data.greeting)
        
        // Cache the greeting
        localStorage.setItem('aiGreeting', data.greeting)
        localStorage.setItem('aiGreetingTimestamp', Date.now().toString())
      }
    } catch (error) {
      console.error('Error generating greeting:', error)
      // Fallback greeting with basic context
      const timeOfDay = getTimeOfDay()
      const hour = new Date().getHours()
      const emailPrefix = user?.email?.split('@')[0] || 'there'
      const firstName = emailPrefix.split(/[._-]/)[0].charAt(0).toUpperCase() + emailPrefix.split(/[._-]/)[0].slice(1)
      
      // Simple fallback
      const visitCount = parseInt(localStorage.getItem('dashboardVisitCount') || '0')
      const isReturning = visitCount > 1
      
      if (hour >= 22 || hour < 6) {
        setAiGreeting(`${firstName}, working late at ${hour}:00? Dedication level: maximum 🔥`)
      } else {
        setAiGreeting(`Good ${timeOfDay} ${firstName}! 👋 ${isReturning ? 'Welcome back!' : 'Welcome!'} Ready to create content?`)
      }
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
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20"></div>
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent absolute top-0 left-0" style={{animationDirection: 'reverse', animationDuration: '0.8s'}}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">AI aan het werk...</p>
                <p className="text-sm text-muted-foreground">Je persoonlijke dashboard wordt voorbereid</p>
              </div>
            </div>
          ) : aiGreeting ? (
            <div className="space-y-4">
              <div className="text-2xl font-bold tracking-tight">
                <ScrambleText 
                  text={aiGreeting}
                  speed={[8, 22]}
                  className="text-foreground"
                />
              </div>
              {selectedClient && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <p>Statistieken voor {selectedClient.naam}</p>
                </div>
              )}
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
            <CardTitle className="text-sm font-medium">
              <ScrambleText text="Totaal Artikelen" speed={[5, 15]} delay={600} />
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <ScrambleText text={(stats?.totalArticles || 0).toString()} speed={[4, 12]} delay={700} />
            </div>
            <p className="text-xs text-muted-foreground">
              <ScrambleText text={`${stats?.articlesThisMonth || 0} deze maand`} speed={[4, 10]} delay={800} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <ScrambleText text="Projecten" speed={[5, 15]} delay={650} />
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <ScrambleText text={(stats?.totalProjects || 0).toString()} speed={[4, 12]} delay={750} />
            </div>
            <p className="text-xs text-muted-foreground">
              <ScrambleText text="Actieve projecten" speed={[4, 10]} delay={850} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <ScrambleText text="Clients" speed={[5, 15]} delay={700} />
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <ScrambleText text={(stats?.totalClients || 0).toString()} speed={[4, 12]} delay={800} />
            </div>
            <p className="text-xs text-muted-foreground">
              <ScrambleText text="Totaal aantal clients" speed={[4, 10]} delay={900} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <ScrambleText text="Geplande Content" speed={[5, 15]} delay={750} />
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <ScrambleText text={(stats?.activeSchedules || 0).toString()} speed={[4, 12]} delay={850} />
            </div>
            <p className="text-xs text-muted-foreground">
              <ScrambleText text={`${stats?.articlesThisMonth || 0} deze maand`} speed={[4, 10]} delay={950} />
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
