import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    if (!rawBody) {
      return NextResponse.json({ error: 'Lege body ontvangen' }, { status: 400 })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch (err) {
      console.error('Kon body niet parsen als JSON:', rawBody)
      return NextResponse.json({ error: 'Body is geen geldige JSON' }, { status: 400 })
    }

    const scheduleId = payload.scheduleId ?? payload.id
    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId ontbreekt' }, { status: 400 })
    }

    const generatedAt = payload.generatedAt ?? new Date().toISOString()

    // Get schedule to find client_id, then get sitemap_url from client
    const scheduleResponse = await supabaseRest(
      'schedules',
      {
        searchParams: { id: `eq.${scheduleId}` },
        prefer: 'return=representation',
      },
    )
    
    const schedules = Array.isArray(scheduleResponse) ? scheduleResponse : [scheduleResponse]
    const schedule = schedules?.[0]
    
    // Get sitemap_url from client
    let sitemapUrl = null
    if (schedule?.client_id) {
      try {
        const companyId = req.headers.get('x-company-id') || schedule.company_id
        if (companyId) {
          const clients = await supabaseRest<any[]>(
            'clients',
            {
              headers: { 'x-company-id': companyId },
              searchParams: {
                id: `eq.${schedule.client_id}`,
                company_id: `eq.${companyId}`
              }
            },
          )
          const client = Array.isArray(clients) ? clients[0] : clients
          sitemapUrl = client?.sitemap_url || null
        }
      } catch (error) {
        console.error('Error fetching client sitemap_url:', error)
      }
    }

    await supabaseRest(
      'schedule_articles',
      {
        method: 'POST',
        body: {
          schedule_id: scheduleId,
          keyword: payload.keyword,
          article: payload.article,
          faqs: payload.faqs,
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          sitemap_url: sitemapUrl,
          generated_at: generatedAt,
        },
        prefer: 'return=minimal',
      },
    )

    await supabaseRest(
      'schedules',
      {
        method: 'PATCH',
        searchParams: { id: `eq.${scheduleId}` },
        body: {
          updated_at: new Date().toISOString(),
        },
        prefer: 'return=minimal',
      },
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Failed to record schedule article', error)
    return NextResponse.json({ error: error?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}
