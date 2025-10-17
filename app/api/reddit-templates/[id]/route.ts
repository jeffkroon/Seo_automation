// app/api/reddit-templates/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Delete reddit template
    const { error } = await supabase
      .from('reddit_templates')
      .delete()
      .eq('id', templateId)
      .eq('company_id', membership.company_id)

    if (error) {
      console.error('Error deleting reddit template:', error)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete reddit template API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
