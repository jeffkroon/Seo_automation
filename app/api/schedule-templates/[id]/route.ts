// app/api/schedule-templates/[id]/route.ts
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

    const templateId = params.id
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

    // Update schedule template
    const { data: template, error } = await supabase
      .from('schedule_templates')
      .update({
        title,
        description,
        focus_keyword,
        extra_keywords: Array.isArray(extra_keywords) ? extra_keywords : [],
        extra_headings: Array.isArray(extra_headings) ? extra_headings : [],
        article_type: article_type || 'informatief',
        language: language || 'nl',
        country: country || 'nl',
        website_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('company_id', membership.company_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule template:', error)
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Update schedule template API error:', error)
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

    const templateId = params.id

    // Get user's company
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'User not found in any company' }, { status: 404 })
    }

    // Delete schedule template
    const { error } = await supabase
      .from('schedule_templates')
      .delete()
      .eq('id', templateId)
      .eq('company_id', membership.company_id)

    if (error) {
      console.error('Error deleting schedule template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete schedule template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
