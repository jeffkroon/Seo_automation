// app/api/schedule-templates/route.ts
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

    // Build query for schedule templates
    let query = supabase
      .from('schedule_templates')
      .select(`
        id,
        title,
        description,
        focus_keyword,
        extra_keywords,
        extra_headings,
        article_type,
        language,
        country,
        website_url,
        created_at
      `)
      .eq('company_id', membership.company_id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching schedule templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Schedule templates API error:', error)
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
    if (!title || !focus_keyword || !client_id || !company_id) {
      return NextResponse.json({ 
        error: 'title, focus_keyword, client_id, and company_id are required' 
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

    // Create schedule template
    const { data: template, error } = await supabase
      .from('schedule_templates')
      .insert({
        company_id,
        client_id,
        title,
        description,
        focus_keyword,
        extra_keywords: Array.isArray(extra_keywords) ? extra_keywords : [],
        extra_headings: Array.isArray(extra_headings) ? extra_headings : [],
        article_type: article_type || 'informatief',
        language: language || 'nl',
        country: country || 'nl',
        website_url,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Create schedule template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
