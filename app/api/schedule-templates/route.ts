// app/api/schedule-templates/route.ts
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
    
    if (!clientId) {
      return NextResponse.json({ error: 'client_id parameter is verplicht' }, { status: 400 })
    }

    // Get schedule templates for this client
    const templates = await supabaseRest<any[]>(
      'schedule_templates',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          client_id: `eq.${clientId}`,
          order: 'created_at.desc'
        } 
      },
    )

    return NextResponse.json({ templates: templates || [] })
  } catch (error: any) {
    console.error('Error in GET /api/schedule-templates:', error)
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
      title, 
      description, 
      focus_keyword, 
      extra_keywords, 
      extra_headings, 
      article_type, 
      language, 
      country, 
      website_url, 
      client_id 
    } = body

    if (!title || !focus_keyword || !client_id) {
      return NextResponse.json({ error: 'Title, focus_keyword en client_id zijn verplicht' }, { status: 400 })
    }

    // Create schedule template
    const templates = await supabaseRest<any[]>(
      'schedule_templates',
      {
        method: 'POST',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        body: {
          company_id: companyId,
          client_id: client_id,
          created_by: userId,
          title: title.trim(),
          description: description?.trim() || null,
          focus_keyword: focus_keyword.trim(),
          extra_keywords: extra_keywords || [],
          extra_headings: extra_headings || [],
          article_type: article_type || 'informatief',
          language: language || 'nl',
          country: country || 'nl',
          website_url: website_url?.trim() || null
        }
      },
    )

    const template = Array.isArray(templates) ? templates[0] : templates

    return NextResponse.json({ template }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/schedule-templates:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}