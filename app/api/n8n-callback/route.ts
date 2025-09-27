// app/api/n8n-callback/route.ts
import { NextResponse } from 'next/server';
import { completeJob, failJob } from '@/lib/jobs';

export async function POST(req: Request) {
  try {
    console.log('=== N8N CALLBACK RECEIVED ===');
    const secret = req.headers.get('x-callback-secret');
    if (process.env.CALLBACK_SECRET && secret !== process.env.CALLBACK_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    console.log('=== RAW CALLBACK BODY ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('=== END RAW BODY ===');
    
    // Handle different response formats
    const { jobId, status, html, generatedAt, error, output } = body;
    console.log('Parsed callback data:', { 
      jobId, 
      status, 
      htmlLength: html?.length, 
      outputLength: output?.length, 
      generatedAt, 
      error,
      allKeys: Object.keys(body)
    });
    
    if (!jobId) return NextResponse.json({ error: 'jobId ontbreekt' }, { status: 400 });

    if (status === 'error' || error) {
      console.log('Job failed:', jobId, error);
      failJob(jobId, error || 'Onbekende fout');
      return NextResponse.json({ ok: true });
    }

    // Combine article and FAQs with separator
    let content = '';
    
    if (body.article) {
      content = body.article;
      console.log('Article content length:', content.length);
    }
    
    if (body.faqs) {
      if (content) {
        content += '\n<hr />\n'; // Separator between article and FAQs
      }
      content += body.faqs;
      console.log('FAQ content added, total length:', content.length);
    }
    
    if (!content) {
      console.warn(`No content found for job ${jobId}. Available fields:`, Object.keys(body));
      content = JSON.stringify(body); // Fallback to raw data
    }
    
    console.log('Completing job:', jobId, 'Final content length:', content?.length);
    console.log('Content preview (first 300 chars):', content.substring(0, 300));
    completeJob(jobId, content, generatedAt || new Date().toISOString());
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Callback error:', err);
    return NextResponse.json(
      { error: err?.message || 'Onbekende fout' },
      { status: 500 }
    );
  }
}
