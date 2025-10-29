// app/api/rewrite-article/route.ts
import { NextResponse } from 'next/server'
import { createJob } from '@/lib/jobs'
import { supabaseRest } from '@/lib/supabase-rest'

export const dynamic = 'force-dynamic'

const REWRITE_WEBHOOK_URL = 'https://dunion.app.n8n.cloud/webhook/4aa92885-8d23-4667-9827-c2db20944256'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    console.log('Rewrite payload:', payload)
    console.log('Rewrite webhook URL:', REWRITE_WEBHOOK_URL)

    if (!payload.article && !payload.faq) {
      return NextResponse.json(
        { error: 'Minimaal artikel of FAQ is verplicht' },
        { status: 400 }
      )
    }

    if (!payload.keyword) {
      return NextResponse.json(
        { error: 'Keyword is verplicht' },
        { status: 400 }
      )
    }

    // Get sitemap_url from client
    let sitemapUrl = payload.sitemap_url || ''
    if (!sitemapUrl && payload.client_id) {
      try {
        const companyId = req.headers.get('x-company-id')
        if (companyId) {
          console.log('🔍 Fetching sitemap_url for client:', payload.client_id)
          const clients = await supabaseRest<any[]>(
            'clients',
            {
              headers: { 'x-company-id': companyId },
              searchParams: {
                id: `eq.${payload.client_id}`,
                company_id: `eq.${companyId}`
              }
            },
          )
          const client = Array.isArray(clients) ? clients[0] : clients
          sitemapUrl = client?.sitemap_url || ''
          console.log('📍 Retrieved sitemap_url from client:', sitemapUrl || '(geen)')
        }
      } catch (error) {
        console.error('Error fetching client sitemap_url:', error)
      }
    }

    // Generate jobId and create job
    const jobId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    createJob(jobId)

    // Prepare n8n payload with callback URL
    const n8nPayload = {
      article: payload.article,
      faq: payload.faq,
      keyword: payload.keyword,
      article_type: payload.article_type || 'informatief',
      sitemap_url: sitemapUrl,
      callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/n8n-callback`,
      jobId: jobId
    }

    console.log('📤 Sending to rewrite webhook with sitemap_url:', sitemapUrl || '(geen)')

    const r = await fetch(REWRITE_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    })

    if (!r.ok) {
      const errorText = await r.text()
      console.error('Error from rewrite webhook:', errorText)
      return NextResponse.json(
        { error: 'Fout bij herschrijven van artikel' },
        { status: r.status }
      )
    }

    const data = await r.json()
    console.log('Rewrite response from n8n:', data)
    
    return NextResponse.json({ 
      success: true,
      jobId: jobId,
      data 
    })
  } catch (error: any) {
    console.error('Error in rewrite-article:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

