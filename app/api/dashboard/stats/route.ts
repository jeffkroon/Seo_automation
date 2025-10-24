import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is required' }, { status: 400 })
    }

    // Get query params for client filtering
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    // Build base search params
    const baseParams: Record<string, string> = {
      company_id: `eq.${companyId}`
    }

    // For viewers: filter by client
    if (userRole === 'viewer' && clientId) {
      baseParams.client_id = `eq.${clientId}`
    } else if (clientId) {
      baseParams.client_id = `eq.${clientId}`
    }

    // Fetch all data in parallel
    const [articles, projects, clients, schedules] = await Promise.all([
      // Total articles
      supabaseRest<any[]>('generated_articles', {
        headers: { 'x-company-id': companyId },
        searchParams: baseParams
      }),
      
      // Total projects (per client if clientId provided)
      supabaseRest<any[]>('projects', {
        headers: { 'x-company-id': companyId },
        searchParams: clientId ? { ...baseParams } : { company_id: `eq.${companyId}` }
      }),
      
      // Total clients (only for non-viewers)
      userRole !== 'viewer' ? supabaseRest<any[]>('clients', {
        headers: { 'x-company-id': companyId },
        searchParams: { company_id: `eq.${companyId}` }
      }) : Promise.resolve([]),
      
      // Total schedules (per client if clientId provided)
      supabaseRest<any[]>('schedules', {
        headers: { 'x-company-id': companyId },
        searchParams: clientId ? { 
          ...baseParams,
          status: 'eq.scheduled'
        } : { 
          company_id: `eq.${companyId}`,
          status: 'eq.scheduled'
        }
      })
    ])

    // Calculate statistics
    const totalArticles = articles?.length || 0
    const totalProjects = projects?.length || 0
    const totalClients = clients?.length || 0
    const totalSchedules = schedules?.length || 0

    // Recent articles (last 10)
    const recentArticles = articles
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10) || []

    // Articles by month (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    
    const articlesByMonth = articles?.reduce((acc: any, article: any) => {
      const date = new Date(article.created_at)
      if (date >= sixMonthsAgo) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        acc[monthKey] = (acc[monthKey] || 0) + 1
      }
      return acc
    }, {}) || {}

    // Articles by type
    const articlesByType = articles?.reduce((acc: any, article: any) => {
      const type = article.article_type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {}) || {}

    // Articles this month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const articlesThisMonth = articles?.filter((article: any) => 
      new Date(article.created_at) >= firstDayOfMonth
    ).length || 0

    return NextResponse.json({
      stats: {
        totalArticles,
        totalProjects,
        totalClients,
        activeSchedules: totalSchedules, // Rename for frontend compatibility
        articlesThisMonth
      },
      recentArticles,
      articlesByMonth,
      articlesByType
    })
  } catch (error: any) {
    console.error('Error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

