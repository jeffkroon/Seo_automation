import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    const updates: Record<string, unknown> = {}
    if (body.active !== undefined) updates.active = Boolean(body.active)
    if (body.nextRunAt) updates.next_run_at = body.nextRunAt
    if (body.intervalSeconds) updates.interval_seconds = Number(body.intervalSeconds)
    if (body.extraKeywords) {
      updates.extra_keywords = Array.isArray(body.extraKeywords)
        ? body.extraKeywords
        : String(body.extraKeywords)
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
    }
    if (body.extraHeadings) {
      updates.extra_headings = Array.isArray(body.extraHeadings)
        ? body.extraHeadings
        : String(body.extraHeadings)
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Geen updates aangeleverd' }, { status: 400 })
    }

    await supabaseRest(
      'schedules',
      {
        method: 'PATCH',
        searchParams: { id: `eq.${params.id}` },
        body: updates,
        prefer: 'return=minimal',
      },
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error(`Failed to update schedule ${params.id}`, error)
    return NextResponse.json({ error: error?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await supabaseRest(
      'schedules',
      {
        method: 'DELETE',
        searchParams: { id: `eq.${params.id}` },
        prefer: 'return=minimal',
      },
    )

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error(`Failed to delete schedule ${params.id}`, error)
    return NextResponse.json({ error: error?.message ?? 'Onbekende fout' }, { status: 500 })
  }
}
