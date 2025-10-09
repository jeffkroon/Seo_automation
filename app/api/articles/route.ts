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
      meta_title,
      meta_description,
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

    // Save article and FAQ as separate sections
    const sectionsToSave: any[] = []

    // Add article section if exists
    if (article && article.trim()) {
      sectionsToSave.push({
        company_id: companyId,
        member_id: userId,
        client_id: client_id,
        section_type: 'article',
        focus_keyword: focus_keyword.trim(),
        title: title?.trim() || meta_title?.trim() || focus_keyword.trim(),
        content: article.trim(),
        meta_title: meta_title?.trim() || null,
        meta_description: meta_description?.trim() || null,
        country: country?.trim() || null,
        language: language?.trim() || null,
        article_type: article_type?.trim() || null,
        additional_keywords: additional_keywords || [],
        additional_headings: additional_headings || [],
        job_id: job_id || null,
        sequence: 1
      })
    }

    // Add FAQ section if exists
    if (faqs && faqs.trim()) {
      sectionsToSave.push({
        company_id: companyId,
        member_id: userId,
        client_id: client_id,
        section_type: 'faq',
        focus_keyword: focus_keyword.trim(),
        title: `Veelgestelde Vragen - ${title?.trim() || focus_keyword.trim()}`,
        content: faqs.trim(),
        meta_title: meta_title?.trim() || null,
        meta_description: meta_description?.trim() || null,
        country: country?.trim() || null,
        language: language?.trim() || null,
        article_type: article_type?.trim() || null,
        additional_keywords: additional_keywords || [],
        additional_headings: additional_headings || [],
        job_id: job_id || null,
        sequence: 2
      })
    }

    if (sectionsToSave.length === 0) {
      return NextResponse.json({ error: 'Geen content om op te slaan' }, { status: 400 })
    }

    // Save all sections separately (Supabase REST API accepts arrays for bulk insert)
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
      body: JSON.stringify(sectionsToSave)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error saving sections:', errorText)
      return NextResponse.json({ error: 'Failed to save sections' }, { status: 500 })
    }

    const savedSections = await response.json()

    return NextResponse.json({ 
      sections: savedSections,
      count: sectionsToSave.length,
      message: `${sectionsToSave.length} sectie(s) opgeslagen voor ${client.naam}` 
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    
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

    // Filter by client if provided
    if (clientId) {
      searchParamsObj.client_id = `eq.${clientId}`
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
