// app/api/claim-due-reddit-requests/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // Check callback secret for security
    const secret = req.headers.get('x-callback-secret')
    if (process.env.CALLBACK_SECRET && secret !== process.env.CALLBACK_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { limit = 25, company_id = null } = body

    // Create service role client for bypassing RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const currentTime = new Date().toISOString()
    console.log('🔍 Claiming due Reddit requests:', { limit, company_id, currentTime })

    // First, let's check what's in the table for debugging
    const { data: allRequests, error: allError } = await supabase
      .from('reddit_search_requests')
      .select('id, status, scheduled_date, scheduled_time, company_id')
      .limit(5)

    console.log('📊 Sample Reddit requests:', allRequests)
    console.log('⏰ Time comparison:', {
      currentTime,
      sampleScheduledDate: allRequests?.[0]?.scheduled_date,
      sampleScheduledTime: allRequests?.[0]?.scheduled_time,
      isDue: allRequests?.[0]?.scheduled_date && allRequests?.[0]?.scheduled_time ? 
        new Date(allRequests[0].scheduled_date + ' ' + allRequests[0].scheduled_time) <= new Date() : 'N/A'
    })

    // Get due Reddit requests
    let query = supabase
      .from('reddit_search_requests')
      .select(`
        id,
        company_id,
        created_by,
        search_type,
        keyword,
        max_results,
        date_range,
        search_status,
        scheduled_date,
        scheduled_time,
        status,
        title,
        description,
        created_at,
        updated_at
      `)
      .in('status', ['scheduled', 'generating'])
      .lte('scheduled_date', new Date().toISOString().split('T')[0])
      .lte('scheduled_time', new Date().toTimeString().split(' ')[0])
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time', { ascending: true })
      .limit(limit)

    // Add company filter if provided
    if (company_id) {
      query = query.eq('company_id', company_id)
    }

    const { data: redditRequests, error } = await query

    if (error) {
      console.error('Error fetching due Reddit requests:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!redditRequests || redditRequests.length === 0) {
      console.log('📭 No due Reddit requests found')
      return NextResponse.json([])
    }

    // Update status to 'generating' for the found requests
    const requestIds = redditRequests.map(r => r.id)
    
    const { error: updateError } = await supabase
      .from('reddit_search_requests')
      .update({
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .in('id', requestIds)

    if (updateError) {
      console.error('Error updating Reddit requests status:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    console.log(`✅ Claimed ${redditRequests.length} Reddit requests for processing`)

    // Return each request as a separate item for n8n
    return NextResponse.json(redditRequests)

  } catch (error: any) {
    console.error('Claim due Reddit requests API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
