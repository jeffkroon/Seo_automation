// app/api/articles/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articleId = params.id

    // Get user's company
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'User not found in any company' }, { status: 404 })
    }

    // Fetch the article
    const { data: article, error } = await supabase
      .from('generated_articles')
      .select('*')
      .eq('id', articleId)
      .eq('company_id', membership.company_id)
      .single()

    if (error) {
      console.error('Error fetching article:', error)
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Fetch article API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const articleId = params.id
    const body = await req.json()

    // Get user's company
    const { data: membership } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'User not found in any company' }, { status: 404 })
    }

    // Update the article
    const { data: article, error } = await supabase
      .from('generated_articles')
      .update({
        content_article: body.content_article,
        updated_at: new Date().toISOString(),
        generated_at: new Date().toISOString() // Also update generated_at to reset age
      })
      .eq('id', articleId)
      .eq('company_id', membership.company_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating article:', error)
      return NextResponse.json({ error: 'Failed to update article' }, { status: 500 })
    }

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Update article API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
