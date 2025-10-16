// app/api/calendar/events/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
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
      website_url
    } = body

    // Get user's company
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'User not found in any company' }, { status: 404 })
    }

    // Update calendar event
    const { data: event, error } = await supabase
      .from('schedules')
      .update({
        title,
        description,
        scheduled_date,
        scheduled_time: scheduled_time || '09:00:00',
        focus_keyword,
        extra_keywords: Array.isArray(extra_keywords) ? extra_keywords : [],
        extra_headings: Array.isArray(extra_headings) ? extra_headings : [],
        article_type: article_type || 'informatief',
        language: language || 'nl',
        country: country || 'nl',
        website_url,
        // Update next_run_at to the new scheduled date/time
        next_run_at: scheduled_date ? new Date(`${scheduled_date}T${scheduled_time || '09:00:00'}`).toISOString() : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('company_id', membership.company_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating calendar event:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update calendar event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Get user's company
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'User not found in any company' }, { status: 404 })
    }

    // Delete calendar event
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', eventId)
      .eq('company_id', membership.company_id)

    if (error) {
      console.error('Error deleting calendar event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete calendar event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
