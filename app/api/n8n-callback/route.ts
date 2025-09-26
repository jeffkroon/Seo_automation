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

    // The n8n webhook sends the full article object in the body
    // We need to store the entire body as the content
    const content = JSON.stringify(body);
    console.log('Completing job:', jobId, 'Content length:', content?.length);
    console.log('Content preview:', content?.substring(0, 200) + '...');
    console.log('Body keys:', Object.keys(body));
    console.log('Article field exists:', !!body.article);
    console.log('Article length:', body.article?.length);
    console.log('Full body structure:', {
      jobId: body.jobId,
      status: body.status,
      hasArticle: !!body.article,
      hasFaqs: !!body.faqs,
      hasMeta: !!body.meta,
      generatedAt: body.generatedAt
    });
    
    if (!content || content.trim() === '') {
      console.warn(`No content found for job ${jobId}. Available fields:`, Object.keys(body));
    }
    
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
