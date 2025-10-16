// app/api/reddit-events/[id]/route.ts
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
      search_type,
      keyword,
      max_results,
      date_range
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

    // Update reddit event
    const { data: event, error } = await supabase
      .from('reddit_search_requests')
      .update({
        title,
        description,
        scheduled_date,
        scheduled_time,
        search_type,
        keyword,
        max_results,
        date_range,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)
      .eq('company_id', membership.company_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reddit event:', error)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Update reddit event API error:', error)
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

    // Delete reddit event
    const { error } = await supabase
      .from('reddit_search_requests')
      .delete()
      .eq('id', eventId)
      .eq('company_id', membership.company_id)

    if (error) {
      console.error('Error deleting reddit event:', error)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete reddit event API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
