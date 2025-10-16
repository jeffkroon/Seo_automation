// app/api/reddit-events/route.ts
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

    // Build query for reddit requests (calendar events)
    let query = supabase
      .from('reddit_search_requests')
      .select(`
        id,
        title,
        description,
        scheduled_date,
        scheduled_time,
        status,
        search_type,
        keyword,
        max_results,
        date_range,
        generation_error,
        created_at
      `)
      .eq('company_id', membership.company_id)
      .eq('client_id', clientId)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })

    const { data: events, error } = await query

    if (error) {
      console.error('Error fetching reddit events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('Reddit events API error:', error)
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
      search_type,
      keyword,
      max_results,
      date_range,
      client_id,
      company_id
    } = body

    // Validate required fields
    if (!title || !scheduled_date || !client_id || !company_id) {
      return NextResponse.json({ 
        error: 'title, scheduled_date, client_id, and company_id are required' 
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

    // Create reddit event (reddit_search_request)
    const { data: event, error } = await supabase
      .from('reddit_search_requests')
      .insert({
        company_id,
        client_id,
        title,
        description,
        scheduled_date,
        scheduled_time: scheduled_time || '09:00:00',
        status: 'scheduled',
        search_type: search_type || 'posts',
        keyword,
        max_results: max_results || 25,
        date_range: date_range || 'week',
        // Set next_run_at to the scheduled date/time
        next_run_at: new Date(`${scheduled_date}T${scheduled_time || '09:00:00'}`).toISOString(),
        active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating reddit event:', error)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Create reddit event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
