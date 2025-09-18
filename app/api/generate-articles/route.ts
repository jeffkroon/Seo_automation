// app/api/generate-articles/route.ts
import { NextResponse } from 'next/server';
import { createJob } from '@/lib/jobs';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    const r = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const rawData = await r.json(); // [{ jobId, status: 'queued' }]
    
    // n8n geeft een array terug, pak het eerste element
    const data = Array.isArray(rawData) ? rawData[0] : rawData;
    
    if (!data?.jobId) {
      console.error('Invalid response from n8n:', rawData);
      return NextResponse.json(
        { error: 'Geen jobId ontvangen van n8n ACK.' },
        { status: 500 }
      );
    }

    createJob(data.jobId);
    return NextResponse.json(
      { jobId: data.jobId, status: 'queued' },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Onbekende fout' },
      { status: 500 }
    );
  }
}
