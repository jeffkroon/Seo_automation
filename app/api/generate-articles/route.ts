// app/api/generate-articles/route.ts
import { NextResponse } from 'next/server';
import { createJob } from '@/lib/jobs';
import { supabaseRest } from '@/lib/supabase-rest';

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

    // Get sitemap_url from client if client_id is provided
    let sitemapUrl = ''
    if (payload['Client ID']) {
      try {
        // Use Supabase directly to get client (same approach as other routes)
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('sitemap_url, naam')
          .eq('id', payload['Client ID'])
          .single()
        
        if (clientError) {
          console.error('❌ Error fetching client:', clientError)
        } else if (clientData) {
          sitemapUrl = clientData.sitemap_url || ''
          console.log('📍 Retrieved sitemap_url from client:', clientData.naam, '->', sitemapUrl || '(geen)')
        } else {
          console.log('⚠️ Client not found for ID:', payload['Client ID'])
        }
      } catch (error) {
        console.error('❌ Error fetching client sitemap_url:', error)
      }
    } else {
      console.log('ℹ️ No Client ID in payload, skipping sitemap_url lookup')
    }

    // Add sitemap_url to payload if found
    const enrichedPayload = {
      ...payload,
      'Sitemap URL': sitemapUrl
    }
    console.log('📤 Sending to webhook with sitemap_url:', sitemapUrl || '(geen)')
    console.log('📋 Full enriched payload being sent:', JSON.stringify(enrichedPayload, null, 2))

    const r = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrichedPayload),
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
          error: data.message || 'Too many users at the moment, please try again later.',
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
