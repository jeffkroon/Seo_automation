// app/api/articles/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('company_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }

    const body = await req.json()
    const { 
      client_id,
      focus_keyword,
      title,
      article,
      faqs,
      meta_title,
      meta_description,
      country,
      language,
      article_type,
      additional_keywords,
      additional_headings,
      job_id
    } = body

    if (!client_id) {
      return NextResponse.json({ error: 'Client ID is verplicht' }, { status: 400 })
    }

    if (!focus_keyword || !focus_keyword.trim()) {
      return NextResponse.json({ error: 'Focus keyword is verplicht' }, { status: 400 })
    }

    // Verify client belongs to user's company
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, naam')
      .eq('id', client_id)
      .eq('company_id', membership.company_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client niet gevonden of geen toegang' }, { status: 404 })
    }

    // Save article
    const { data: savedArticle, error: insertError } = await supabase
      .from('generated_articles')
      .insert({
        company_id: membership.company_id,
        member_id: user.id,
        client_id: client_id,
        focus_keyword: focus_keyword.trim(),
        title: title?.trim() || null,
        article: article?.trim() || null,
        faqs: faqs?.trim() || null,
        meta_title: meta_title?.trim() || null,
        meta_description: meta_description?.trim() || null,
        country: country?.trim() || null,
        language: language?.trim() || null,
        article_type: article_type?.trim() || null,
        additional_keywords: additional_keywords || [],
        additional_headings: additional_headings || [],
        job_id: job_id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving article:', insertError)
      return NextResponse.json({ error: 'Failed to save article' }, { status: 500 })
    }

    return NextResponse.json({ 
      article: savedArticle,
      message: `Artikel opgeslagen voor ${client.naam}` 
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's company
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('company_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    // Build query
    let query = supabase
      .from('generated_articles')
      .select('*')
      .eq('company_id', membership.company_id)
      .order('created_at', { ascending: false })

    // Filter by client if provided
    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data: articles, error: articlesError } = await query

    if (articlesError) {
      console.error('Error fetching articles:', articlesError)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    return NextResponse.json({ articles: articles || [] })
  } catch (error: any) {
    console.error('Error in GET /api/articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

