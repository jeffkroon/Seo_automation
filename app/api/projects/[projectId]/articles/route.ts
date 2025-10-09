import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

// GET - Fetch articles in a project
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is required' }, { status: 400 })
    }

    const projectArticles = await supabaseRest<any[]>(
      'project_articles',
      {
        headers: { 'x-company-id': companyId },
        searchParams: {
          project_id: `eq.${params.projectId}`,
          order: 'added_at.desc'
        }
      }
    )

    return NextResponse.json({ articles: projectArticles || [] })
  } catch (error: any) {
    console.error('Error fetching project articles:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Add an article to a project
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Headers required' }, { status: 400 })
    }

    const { article_id } = await req.json()

    if (!article_id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    const articleData = {
      project_id: params.projectId,
      article_id,
      added_by: userId
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/project_articles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(articleData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error adding article:', errorText)
      return NextResponse.json({ error: 'Failed to add article' }, { status: 500 })
    }

    const article = await response.json()

    return NextResponse.json({
      article: Array.isArray(article) ? article[0] : article,
      message: 'Artikel toegevoegd!'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding article:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove an article from a project
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Headers required' }, { status: 400 })
    }

    const { article_id } = await req.json()

    if (!article_id) {
      return NextResponse.json({ error: 'Article ID is required' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/project_articles?project_id=eq.${params.projectId}&article_id=eq.${article_id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error removing article:', errorText)
      return NextResponse.json({ error: 'Failed to remove article' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Artikel verwijderd' })
  } catch (error: any) {
    console.error('Error removing article:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

