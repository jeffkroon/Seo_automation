// app/api/n8n-callback/route.ts
import { NextResponse } from 'next/server';
import { storeJobResult, failJob } from '@/lib/jobs';

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

    const entries: Array<{ article?: string; faqs?: string; metaTitle?: string; metaDescription?: string; generatedAt?: string; sequence?: number }> = []

    if (Array.isArray(body.results)) {
      body.results.forEach((result: any, index: number) => {
        entries.push({
          article: result.article ?? result.content ?? result.markdown,
          faqs: result.faqs ?? result.faq ?? result.faqMarkdown,
          metaTitle: result.metaTitle ?? result.meta_title,
          metaDescription: result.metaDescription ?? result.meta_description,
          generatedAt: result.generatedAt ?? generatedAt,
          sequence: typeof result.sequence === 'number' ? result.sequence : index + 1,
        })
      })
    } else {
      entries.push({
        article: body.article,
        faqs: body.faqs,
        metaTitle: body.metaTitle ?? body.meta_title,
        metaDescription: body.metaDescription ?? body.meta_description,
        generatedAt: generatedAt || new Date().toISOString(),
      })
    }

    const markComplete =
      body.isFinal !== undefined
        ? Boolean(body.isFinal)
        : body.hasMore !== undefined
          ? body.hasMore === false
          : status === 'done'

    entries.forEach((entry, index) => {
      if (!entry.article && !entry.faqs) {
        console.warn(`Skipping empty entry for job ${jobId}`)
        return
      }
      const isLastEntry = index === entries.length - 1
      storeJobResult(jobId, {
        article: entry.article,
        faqs: entry.faqs,
        metaTitle: entry.metaTitle,
        metaDescription: entry.metaDescription,
        generatedAt: entry.generatedAt,
        sequence: entry.sequence,
        markComplete: markComplete && isLastEntry,
      })
    })

    console.log('Stored job results:', {
      jobId,
      entries: entries.length,
      markComplete,
    })
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Callback error:', err);
    return NextResponse.json(
      { error: err?.message || 'Onbekende fout' },
      { status: 500 }
    );
  }
}
