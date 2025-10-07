// app/api/generate-articles/route.ts
import { NextResponse } from 'next/server';
import { createJob } from '@/lib/jobs';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log('Payload:', payload);
    console.log('N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL);

    if (!process.env.N8N_WEBHOOK_URL) {
      console.error('N8N_WEBHOOK_URL is not set!');
      return NextResponse.json(
        { error: 'N8N_WEBHOOK_URL is not configured' },
        { status: 500 }
      );
    }

    const r = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const rawData = await r.json();
    console.log('Raw response from n8n:', rawData);
    
    // n8n geeft { data: { jobId: "=123", status: "queued" } } terug
    let data;
    if (rawData.data) {
      // Response heeft data wrapper
      data = rawData.data;
    } else if (Array.isArray(rawData)) {
      // Response is array
      data = rawData[0];
    } else {
      // Response is direct object
      data = rawData;
    }
    
    // Check if response contains an error
    if (data.status === 'error') {
      console.error('n8n returned error:', data);
      return NextResponse.json(
        { 
          error: data.message || 'Service tijdelijk niet beschikbaar. Probeer het later opnieuw.',
          error_code: data.error_code || 'SERVICE_UNAVAILABLE'
        },
        { status: 503 }
      );
    }

    // Clean jobId (remove = prefix if present)
    if (data.jobId && data.jobId.startsWith('=')) {
      data.jobId = data.jobId.substring(1);
    }
    
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
