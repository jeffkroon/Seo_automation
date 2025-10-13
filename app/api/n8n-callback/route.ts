// app/api/n8n-callback/route.ts
import { NextResponse } from 'next/server';
import { storeJobResult, failJob } from '@/lib/jobs';

export async function POST(req: Request) {
  try {
    console.log('=== N8N CALLBACK RECEIVED ===');
    const secret = req.headers.get('x-callback-secret');
    if (process.env.CALLBACK_SECRET && secret !== process.env.CALLBACK_SECRET) {
      console.log('=== CALLBACK SECRET MISMATCH ===');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch (jsonError) {
      console.error('=== JSON PARSE ERROR ===', jsonError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    console.log('=== RAW CALLBACK BODY ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('=== END RAW BODY ===');
    
    // Handle different response formats
    const { jobId, status, html, generatedAt, error, message, error_code, output } = body;
    console.log('Parsed callback data:', { 
      jobId, 
      status, 
      htmlLength: html?.length, 
      outputLength: output?.length, 
      generatedAt, 
      error,
      message,
      error_code,
      allKeys: Object.keys(body)
    });
    
    if (!jobId) return NextResponse.json({ error: 'jobId ontbreekt' }, { status: 400 });

    // Handle webhook errors - support both 'error' and 'message' fields
    if (status === 'error' || error || (message && error_code)) {
      const errorMessage = error || message || 'Onbekende fout';
      const errorDetails = error_code ? `[${error_code}] ${errorMessage}` : errorMessage;
      console.error('❌ WEBHOOK ERROR - Job failed:', jobId, errorDetails);
      failJob(jobId, errorDetails);
      return NextResponse.json({ ok: true, status: 'error', error: errorDetails });
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
      try {
        storeJobResult(jobId, {
          article: entry.article,
          faqs: entry.faqs,
          metaTitle: entry.metaTitle,
          metaDescription: entry.metaDescription,
          generatedAt: entry.generatedAt,
          sequence: entry.sequence,
          markComplete: markComplete && isLastEntry,
        })
        console.log(`Successfully stored entry ${index + 1} for job ${jobId}`)
      } catch (storeError) {
        console.error(`Failed to store entry ${index + 1} for job ${jobId}:`, storeError)
        throw storeError
      }
    })

    console.log('Stored job results:', {
      jobId,
      entries: entries.length,
      markComplete,
    })
    
    const response = { ok: true };
    console.log('=== SENDING RESPONSE ===', response);
    return NextResponse.json(response);
  } catch (err: any) {
    console.error('=== CALLBACK ERROR ===', err);
    const errorResponse = { error: err?.message || 'Onbekende fout' };
    console.log('=== SENDING ERROR RESPONSE ===', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
