import { NextResponse } from 'next/server'
import { getScheduleArticle, getScheduleArticles } from '@/lib/schedules'

export async function GET(_req: Request) {
  const all = getScheduleArticles()
  return NextResponse.json({ data: all })
}
