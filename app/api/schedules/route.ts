import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET() {
  try {
    const schedules = await supabaseRest<any[]>(
      'schedules',
      { searchParams: { order: 'created_at.desc' } },
    )

    const enriched = await Promise.all(
      schedules.map(async (schedule) => {
        try {
          const articles = await supabaseRest<any[]>(
            'schedule_articles',
            {
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

    if (!body.companyId) {
      return NextResponse.json({ error: 'companyId is verplicht' }, { status: 400 })
    }
    if (!body.focusKeyword) {
      return NextResponse.json({ error: 'focusKeyword is verplicht' }, { status: 400 })
    }
    if (!body.language || !body.country) {
      return NextResponse.json({ error: 'language en country zijn verplicht' }, { status: 400 })
    }

    const schedule = {
      company_id: body.companyId,
      focus_keyword: body.focusKeyword,
      extra_keywords: Array.isArray(body.extraKeywords) ? body.extraKeywords : body.extraKeywords?.split(',').map((v: string) => v.trim()).filter(Boolean) ?? [],
      language: body.language,
      country: body.country,
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
