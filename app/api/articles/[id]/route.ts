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

    // Update the article
    const result = await supabaseRest<any>('generated_articles', {
      method: 'PATCH',
      searchParams: {
        id: `eq.${articleId}`,
        company_id: `eq.${companyId}`,
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
