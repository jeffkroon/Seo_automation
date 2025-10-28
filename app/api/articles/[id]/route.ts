// app/api/articles/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const articleId = params.id

    // Fetch the article
    const article = await supabaseRest<any>('generated_articles', {
      method: 'GET',
      searchParams: {
        id: `eq.${articleId}`,
        company_id: `eq.${companyId}`,
        select: '*',
      },
    })

    if (!article || (Array.isArray(article) && article.length === 0)) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(Array.isArray(article) ? article[0] : article)
  } catch (error) {
    console.error('Fetch article API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const articleId = params.id
    const body = await req.json()

    console.log('🔍 PATCH article:', { articleId, companyId })

    // First, fetch the article to verify it belongs to the company
    const article = await supabaseRest<any[]>('generated_articles', {
      method: 'GET',
      headers: { 'x-company-id': companyId },
      searchParams: {
        id: `eq.${articleId}`,
        select: '*',
      },
    })

    const articleData = Array.isArray(article) ? article[0] : article

    console.log('📄 Fetched article:', { articleData, isArray: Array.isArray(article) })

    if (!articleData) {
      console.error('❌ Article not found')
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (articleData.company_id !== companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update the article
    const result = await supabaseRest<any>('generated_articles', {
      method: 'PATCH',
      headers: { 'x-company-id': companyId },
      searchParams: {
        id: `eq.${articleId}`,
        select: '*',
      },
      body: {
        content_article: body.content_article,
        updated_at: new Date().toISOString(),
        generated_at: new Date().toISOString() // Also update generated_at to reset age
      },
    })

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(Array.isArray(result) ? result[0] : result)
  } catch (error) {
    console.error('Update article API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
