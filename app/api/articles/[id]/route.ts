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
  console.log('=== PATCH /api/articles/[id] CALLED ===')
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const articleId = params.id
    const body = await req.json()

    console.log('🔍 Updating article:', { articleId, companyId })

    // Update the article - Supabase RLS will handle company_id security
    const result = await supabaseRest<any[]>('generated_articles', {
      method: 'PATCH',
      headers: { 'x-company-id': companyId },
      searchParams: {
        id: `eq.${articleId}`,
        select: '*',
      },
      prefer: 'return=representation',
      body: {
        ...(body.content_article !== undefined && { content_article: body.content_article }),
        ...(body.content_faq !== undefined && { content_faq: body.content_faq }),
        updated_at: new Date().toISOString(),
        generated_at: new Date().toISOString()
      },
    })

    console.log('📝 Update result:', result)

    if (!result || (Array.isArray(result) && result.length === 0)) {
      console.error('❌ Article not found or not updated')
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    const updatedArticle = Array.isArray(result) ? result[0] : result
    
    console.log('✅ Article updated successfully:', { id: updatedArticle.id, updated_at: updatedArticle.updated_at })
    return NextResponse.json(updatedArticle)
  } catch (error) {
    console.error('❌ Update article error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
