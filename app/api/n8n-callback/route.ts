// app/api/n8n-callback/route.ts
import { NextResponse } from 'next/server';
import { completeJob, failJob } from '@/lib/jobs';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get('x-callback-secret');
    if (process.env.CALLBACK_SECRET && secret !== process.env.CALLBACK_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { jobId, status, html, generatedAt, error } = await req.json();
    if (!jobId) return NextResponse.json({ error: 'jobId ontbreekt' }, { status: 400 });

    if (status === 'error' || error) {
      failJob(jobId, error || 'Onbekende fout');
      return NextResponse.json({ ok: true });
    }

    completeJob(jobId, html || '', generatedAt || new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Onbekende fout' },
      { status: 500 }
    );
  }
}
