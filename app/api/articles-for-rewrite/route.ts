// app/api/articles-for-rewrite/route.ts
import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

interface ArticleWithAge {
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
  age_category: 'fresh' | 'warning' | 'stale' // <2 weeks, 2-4 weeks, >1 month
}

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    // Build search params
    const searchParamsObj: Record<string, string> = {
      company_id: `eq.${companyId}`,
      order: 'created_at.desc'
    }

    // For viewers: MUST filter by client (their assigned client only)
    if (userRole === 'viewer') {
      if (!clientId) {
        return NextResponse.json({ articles: [] }) // No client = no access
      }
      searchParamsObj.client_id = `eq.${clientId}`
    } else {
      // For non-viewers: optionally filter by client
      if (clientId) {
        searchParamsObj.client_id = `eq.${clientId}`
      }
    }

    const articles = await supabaseRest<any[]>(
      'generated_articles',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: searchParamsObj
      },
    )

    // Calculate age and categorize - use updated_at if available, otherwise created_at
    const now = new Date()
    const articlesWithAge: ArticleWithAge[] = (articles || []).map((article: any) => {
      const referenceDate = article.updated_at ? new Date(article.updated_at) : new Date(article.created_at)
      const ageDays = Math.floor((now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let ageCategory: 'fresh' | 'warning' | 'stale'
      if (ageDays < 14) {
        ageCategory = 'fresh' // Groen: <2 weken
      } else if (ageDays < 30) {
        ageCategory = 'warning' // Oranje: 2-4 weken
      } else {
        ageCategory = 'stale' // Rood: >1 maand
      }

      return {
        ...article,
        age_days: ageDays,
        age_category: ageCategory
      }
    })

    return NextResponse.json({ articles: articlesWithAge })
  } catch (error: any) {
    console.error('Error in GET /api/articles-for-rewrite:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

