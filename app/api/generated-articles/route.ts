// app/api/generated-articles/route.ts
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
    const clientId = url.searchParams.get('client_id')
    
    // Get generated articles for this company (and optionally client)
    const articles = await supabaseRest<any[]>(
      'generated_articles',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          ...(clientId && { client_id: `eq.${clientId}` }),
          order: 'created_at.desc'
        } 
      },
    )

    return NextResponse.json({ articles: articles || [] })
  } catch (error: any) {
    console.error('Error in GET /api/generated-articles:', error)
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
      client_id,
      focus_keyword,
      title,
      country,
      language,
      article_type,
      additional_keywords,
      additional_headings,
      content_article,
      content_faq,
      generated_at
    } = body

    if (!focus_keyword || !content_article) {
      return NextResponse.json({ error: 'focus_keyword en content_article zijn verplicht' }, { status: 400 })
    }

    // Create generated article
    const articles = await supabaseRest<any[]>(
      'generated_articles',
      {
        method: 'POST',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        body: {
          company_id: companyId,
          member_id: userId,
          client_id: client_id,
          focus_keyword: focus_keyword.trim(),
          title: title?.trim() || focus_keyword.trim(),
          country: country || 'nl',
          language: language || 'nl',
          article_type: article_type || 'informatief',
          additional_keywords: additional_keywords || [],
          additional_headings: additional_headings || [],
          content_article: content_article,
          content_faq: content_faq || null,
          generated_at: generated_at || new Date().toISOString()
        }
      },
    )

    const article = Array.isArray(articles) ? articles[0] : articles
    
    return NextResponse.json({ article }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/generated-articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
