import { NextResponse } from 'next/server'
import { upsertScheduleArticle } from '@/lib/schedules'

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    const scheduleId = payload.scheduleId ?? payload.id
    if (!scheduleId) {
      return NextResponse.json({ error: 'scheduleId ontbreekt' }, { status: 400 })
    }

    const keyword = payload.keyword ?? payload.focusKeyword ?? ''
    const interval = payload.interval ?? payload.frequency
    const status = payload.status ?? 'completed'
    const generatedAt = payload.generatedAt ?? new Date().toISOString()

    upsertScheduleArticle({
      scheduleId,
      keyword,
      interval,
      status,
      article: payload.article ?? payload.content ?? payload.html,
      faqs: payload.faqs ?? payload.faq,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      generatedAt,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Failed to record schedule article', error)
    return NextResponse.json({ error: error?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}
