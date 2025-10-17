// app/api/schedule-articles/route.ts
import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const url = new URL(req.url)
    const scheduleId = url.searchParams.get('schedule_id')
    
    if (!scheduleId) {
      return NextResponse.json({ error: 'schedule_id parameter is verplicht' }, { status: 400 })
    }

    // Get schedule articles for this schedule
    const articles = await supabaseRest<any[]>(
      'schedule_articles',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          schedule_id: `eq.${scheduleId}`,
          order: 'created_at.desc'
        } 
      },
    )

    return NextResponse.json({ articles: articles || [] })
  } catch (error: any) {
    console.error('Error in GET /api/schedule-articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Authentication headers missing' }, { status: 400 })
    }

    const body = await req.json()
    const { 
      schedule_id,
      keyword,
      article,
      faqs,
      meta_title,
      meta_description
    } = body

    if (!schedule_id || !article) {
      return NextResponse.json({ error: 'schedule_id en article zijn verplicht' }, { status: 400 })
    }

    // Create schedule article
    const articles = await supabaseRest<any[]>(
      'schedule_articles',
      {
        method: 'POST',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        body: {
          schedule_id: schedule_id,
          keyword: keyword?.trim() || null,
          article: article,
          faqs: faqs || null,
          meta_title: meta_title?.trim() || null,
          meta_description: meta_description?.trim() || null
        }
      },
    )

    const scheduleArticle = Array.isArray(articles) ? articles[0] : articles
    
    return NextResponse.json({ article: scheduleArticle }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/schedule-articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
