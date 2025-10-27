// app/api/calendar/events/route.ts
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

    // Get calendar events (schedules) for this client
    const events = await supabaseRest<any[]>(
      'schedules',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          client_id: `eq.${clientId}`,
          order: 'scheduled_date.asc,scheduled_time.asc'
        } 
      },
    )

    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error('Error in GET /api/calendar/events:', error)
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
      scheduled_date, 
      scheduled_time, 
      focus_keyword, 
      extra_keywords, 
      extra_headings, 
      article_type, 
      language, 
      country, 
      website_url, 
      client_id,
      client_name 
    } = body

    if (!title || !focus_keyword || !client_id) {
      return NextResponse.json({ error: 'Title, focus_keyword en client_id zijn verplicht' }, { status: 400 })
    }

    // Create calendar event (schedule) - eenmalig, geen interval
    const eventData = {
      company_id: companyId,
      client_id: client_id,
      client_name: client_name, // Add client name (no null fallback to preserve actual values)
      title: title.trim(),
      description: description?.trim() || null,
      scheduled_date: scheduled_date,
      scheduled_time: scheduled_time || '09:00',
      focus_keyword: focus_keyword.trim(),
      extra_keywords: extra_keywords || [],
      extra_headings: extra_headings || [],
      article_type: article_type || 'informatief',
      language: language || 'nl',
      country: country || 'nl',
      website_url: website_url?.trim() || null,
      status: 'scheduled'
    }
    
    console.log('📅 Creating calendar event with data:', eventData)
    console.log('📅 Client name in request:', client_name)
    console.log('📅 Full body received:', body)
    
    const events = await supabaseRest<any[]>(
      'schedules',
      {
        method: 'POST',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        body: eventData
      },
    )

    const event = Array.isArray(events) ? events[0] : events
    
    console.log('📅 Calendar event created successfully:', event)
    
    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/calendar/events:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}