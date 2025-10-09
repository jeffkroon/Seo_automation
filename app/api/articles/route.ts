// app/api/articles/route.ts
import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Authentication headers missing' }, { status: 400 })
    }

    const body = await req.json()
    const { 
      client_id,
      focus_keyword,
      title,
      article,
      faqs,
      country,
      language,
      article_type,
      additional_keywords,
      additional_headings,
      job_id
    } = body

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is verplicht' }, { status: 400 })
    }

    if (!focus_keyword || !focus_keyword.trim()) {
      return NextResponse.json({ error: 'Focus keyword is verplicht' }, { status: 400 })
    }

    // Verify client belongs to user's company
    const clients = await supabaseRest<any[]>(
      'clients',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          id: `eq.${client_id}`,
          company_id: `eq.${companyId}`
        } 
      },
    )

    if (!clients || clients.length === 0) {
      return NextResponse.json({ error: 'Client niet gevonden of geen toegang' }, { status: 404 })
    }

    const client = clients[0]

    // Validate that we have at least article or FAQ
    if (!article?.trim() && !faqs?.trim()) {
      return NextResponse.json({ error: 'Geen content om op te slaan' }, { status: 400 })
    }

    // Save article and FAQ in single row with separate columns
    const articleData = {
      company_id: companyId,
      member_id: userId,
      client_id: client_id,
      focus_keyword: focus_keyword.trim(),
      title: title?.trim() || focus_keyword.trim(),
      content_article: article?.trim() || null,
      content_faq: faqs?.trim() || null,
      country: country?.trim() || null,
      language: language?.trim() || null,
      article_type: article_type?.trim() || null,
      additional_keywords: additional_keywords || [],
      additional_headings: additional_headings || [],
      job_id: job_id || null,
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/generated_articles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(articleData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error saving article:', errorText)
      return NextResponse.json({ error: 'Failed to save article' }, { status: 500 })
    }

    const savedArticle = await response.json()

    return NextResponse.json({
      article: Array.isArray(savedArticle) ? savedArticle[0] : savedArticle,
      message: `Artikel opgeslagen voor ${client.naam}`
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
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

    return NextResponse.json({ articles: articles || [] })
  } catch (error: any) {
    console.error('Error in GET /api/articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'X-Company-Id and X-User-Id headers are required' }, { status: 400 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Article ID is verplicht' }, { status: 400 })
    }

    // Delete the article (with company_id check for security)
    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/generated_articles?id=eq.${id}&company_id=eq.${companyId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error deleting article:', errorText)
      return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Artikel verwijderd' }, { status: 200 })
  } catch (error: any) {
    console.error('Error in DELETE /api/articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
