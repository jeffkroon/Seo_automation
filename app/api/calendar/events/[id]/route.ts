// app/api/calendar/events/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const eventId = ctx.params.id
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
      website_url 
    } = body

    if (!title || !focus_keyword) {
      return NextResponse.json({ error: 'Title en focus_keyword zijn verplicht' }, { status: 400 })
    }

    // Update calendar event (schedule)
    const events = await supabaseRest<any[]>(
      'schedules',
      {
        method: 'PATCH',
        headers: { 
          'x-company-id': companyId,
          'Prefer': 'return=representation'
        },
        searchParams: {
          id: `eq.${eventId}`,
          company_id: `eq.${companyId}`
        },
        body: {
          title: title.trim(),
          description: description?.trim() || null,
          scheduled_date: scheduled_date,
          scheduled_time: scheduled_time,
          focus_keyword: focus_keyword.trim(),
          extra_keywords: extra_keywords || [],
          extra_headings: JSON.stringify(extra_headings || []),
          article_type: article_type || 'informatief',
          language: language || 'nl',
          country: country || 'nl',
          website_url: website_url?.trim() || null,
          updated_at: new Date().toISOString()
        }
      },
    )

    const event = Array.isArray(events) ? events[0] : events

    return NextResponse.json({ event })
  } catch (error: any) {
    console.error('Error in PATCH /api/calendar/events/[id]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, ctx: { params: { id: string } }) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    const userRole = req.headers.get('x-user-role')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const eventId = ctx.params.id

    // Delete calendar event (schedule)
    await supabaseRest(
      'schedules',
      {
        method: 'DELETE',
        headers: { 'x-company-id': companyId },
        searchParams: {
          id: `eq.${eventId}`,
          company_id: `eq.${companyId}`
        }
      },
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/calendar/events/[id]:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}