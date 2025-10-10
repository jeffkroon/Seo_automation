import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const url = new URL(req.url)
    const clientId = url.searchParams.get('client_id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Build search params
    const searchParams: Record<string, string> = {
      order: 'created_at.desc'
    }
    
    // Filter by client_id if provided
    if (clientId) {
      searchParams.client_id = `eq.${clientId}`
    }

    const schedules = await supabaseRest<any[]>(
      'schedules',
      { 
        headers: { 'x-company-id': companyId },
        searchParams
      },
    )

    const enriched = await Promise.all(
      schedules.map(async (schedule) => {
        try {
          const articles = await supabaseRest<any[]>(
            'schedule_articles',
            {
              headers: { 'x-company-id': companyId },
              searchParams: {
                schedule_id: `eq.${schedule.id}`,
                order: 'generated_at.desc',
                limit: 1,
              },
            },
          )

          return {
            ...schedule,
            latestArticle: articles?.[0] ?? null,
          }
        } catch (err) {
          console.error(`Failed to load latest article for schedule ${schedule.id}`, err)
          return {
            ...schedule,
            latestArticle: null,
          }
        }
      }),
    )

    return NextResponse.json({ data: enriched })
  } catch (error: any) {
    console.error('Failed to fetch schedules', error)
    return NextResponse.json({ error: error?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const companyId = req.headers.get('x-company-id')

    if (!body.companyId) {
      return NextResponse.json({ error: 'companyId is verplicht' }, { status: 400 })
    }

    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }
    if (!body.clientId) {
      return NextResponse.json({ error: 'clientId is verplicht' }, { status: 400 })
    }
    if (!body.focusKeyword) {
      return NextResponse.json({ error: 'focusKeyword is verplicht' }, { status: 400 })
    }
    if (!body.language || !body.country) {
      return NextResponse.json({ error: 'language en country zijn verplicht' }, { status: 400 })
    }

    const allowedLanguages = ['nl', 'en']
    const allowedCountries = ['nl', 'en', 'us']
    const language = String(body.language).toLowerCase()
    const country = String(body.country).toLowerCase()

    if (!allowedLanguages.includes(language)) {
      return NextResponse.json({ error: 'language moet "nl" of "en" zijn' }, { status: 400 })
    }
    if (!allowedCountries.includes(country)) {
      return NextResponse.json({ error: 'country moet een geldige waarde zijn (nl, en, us)' }, { status: 400 })
    }

    const schedule = {
      company_id: body.companyId,
      client_id: body.clientId,
      focus_keyword: body.focusKeyword,
      extra_keywords: Array.isArray(body.extraKeywords) ? body.extraKeywords : body.extraKeywords?.split(',').map((v: string) => v.trim()).filter(Boolean) ?? [],
      extra_headings: Array.isArray(body.extraHeadings) ? body.extraHeadings : body.extraHeadings?.split(',').map((v: string) => v.trim()).filter(Boolean) ?? [],
      language,
      country,
      company_name: body.companyName,
      website_url: body.websiteUrl,
      article_type: body.articleType,
      interval_seconds: Math.max(Number(body.intervalSeconds) || 86400, 300),
      days_of_week: Array.isArray(body.daysOfWeek) ? body.daysOfWeek : undefined,
      time_window: body.timeWindow ?? null,
      active: body.active !== undefined ? Boolean(body.active) : true,
      next_run_at: body.nextRunAt ?? new Date().toISOString(),
    }

    const created = await supabaseRest<any[]>(
      'schedules',
      {
        method: 'POST',
        headers: { 'x-company-id': companyId },
        body: schedule,
        prefer: 'return=representation',
      },
    )

    return NextResponse.json({ data: created?.[0] ?? null })
  } catch (error: any) {
    console.error('Failed to create schedule', error)
    return NextResponse.json({ error: error?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}
