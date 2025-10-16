// app/api/calendar/events/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client_id from query params
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    
    if (!clientId) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
    }

    // Get user's company
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'User not found in any company' }, { status: 404 })
    }

    // Build query for schedules (calendar events)
    let query = supabase
      .from('schedules')
      .select(`
        id,
        title,
        description,
        scheduled_date,
        scheduled_time,
        status,
        focus_keyword,
        extra_keywords,
        extra_headings,
        article_type,
        language,
        country,
        website_url,
        generated_article_id,
        generation_error,
        created_at
      `)
      .eq('company_id', membership.company_id)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching calendar events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Calendar events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      title,
      description,
      scheduled_date,
      scheduled_time,
      focus_keyword,
      extra_keywords = [],
      extra_headings = [],
      article_type,
      language,
      country,
      website_url,
      client_id,
      company_id
    } = body

    // Validate required fields
    if (!title || !focus_keyword || !scheduled_date || !client_id || !company_id) {
      return NextResponse.json({ 
        error: 'title, focus_keyword, scheduled_date, client_id, and company_id are required' 
      }, { status: 400 })
    }

    // Get user's company to verify access
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create calendar event (schedule)
    const { data: event, error } = await supabase
      .from('schedules')
      .insert({
        company_id,
        client_id,
        title,
        description,
        scheduled_date,
        scheduled_time: scheduled_time || '09:00:00',
        status: 'scheduled',
        focus_keyword,
        extra_keywords: Array.isArray(extra_keywords) ? extra_keywords : [],
        extra_headings: Array.isArray(extra_headings) ? extra_headings : [],
        article_type: article_type || 'informatief',
        language: language || 'nl',
        country: country || 'nl',
        website_url,
        // Set next_run_at to the scheduled date/time
        next_run_at: new Date(`${scheduled_date}T${scheduled_time || '09:00:00'}`).toISOString(),
        active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating calendar event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Create calendar event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
