// app/api/schedule-callback/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    console.log('=== SCHEDULE CALLBACK RECEIVED ===');
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
    
    console.log('=== RAW SCHEDULE CALLBACK BODY ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('=== END RAW BODY ===');
    
    const { scheduleId, status, article, faqs, error, message, error_code } = body;
    
    if (!scheduleId) {
      console.error('❌ No scheduleId found in callback body:', body);
      return NextResponse.json({ error: 'scheduleId ontbreekt in callback' }, { status: 400 });
    }

    const supabase = createClient();

    // Handle webhook errors
    if (status === 'error' || error || (message && error_code)) {
      const errorMessage = error || message || 'Onbekende fout';
      const errorDetails = error_code ? `[${error_code}] ${errorMessage}` : errorMessage;
      
      console.error('❌ SCHEDULE WEBHOOK ERROR - Schedule failed:', scheduleId, errorDetails);
      
      // Mark schedule as failed
      const { error: updateError } = await supabase.rpc('mark_schedule_completed', {
        p_schedule_id: scheduleId,
        p_generation_error: errorDetails
      });

      if (updateError) {
        console.error('Failed to mark schedule as failed:', updateError);
      }

      return NextResponse.json({ ok: true, status: 'error', error: errorDetails });
    }

    // Handle successful generation
    if (status === 'done' || status === 'completed') {
      console.log('✅ SCHEDULE COMPLETED - Schedule:', scheduleId);
      
      // Save the generated article to generated_articles table
      let generatedArticleId = null;
      
      if (article || faqs) {
        // Get schedule details to create article
        const { data: schedule, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', scheduleId)
          .single();

        if (scheduleError) {
          console.error('Failed to fetch schedule details:', scheduleError);
        } else if (schedule) {
          // Create article record
          const { data: articleData, error: articleError } = await supabase
            .from('generated_articles')
            .insert({
              company_id: schedule.company_id,
              member_id: schedule.created_by || null,
              client_id: schedule.client_id,
              focus_keyword: schedule.focus_keyword,
              title: schedule.title || schedule.focus_keyword,
              country: schedule.country,
              language: schedule.language,
              article_type: schedule.article_type,
              additional_keywords: schedule.extra_keywords || [],
              additional_headings: schedule.extra_headings || [],
              content_article: article,
              content_faq: faqs,
              generated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (articleError) {
            console.error('Failed to create article record:', articleError);
          } else {
            generatedArticleId = articleData?.id;
            console.log('✅ Article saved with ID:', generatedArticleId);
          }
        }
      }

      // Mark schedule as completed
      const { error: updateError } = await supabase.rpc('mark_schedule_completed', {
        p_schedule_id: scheduleId,
        p_generated_article_id: generatedArticleId
      });

      if (updateError) {
        console.error('Failed to mark schedule as completed:', updateError);
        return NextResponse.json({ error: 'Failed to update schedule status' }, { status: 500 });
      }

      console.log('✅ Schedule marked as completed:', scheduleId);
      return NextResponse.json({ ok: true, status: 'completed' });
    }

    // Handle other statuses (generating, etc.)
    console.log('📝 Schedule status update:', scheduleId, status);
    return NextResponse.json({ ok: true, status: 'processing' });

  } catch (err: any) {
    console.error('=== SCHEDULE CALLBACK ERROR ===', err);
    const errorResponse = { error: err?.message || 'Onbekende fout' };
    console.log('=== SENDING ERROR RESPONSE ===', errorResponse);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
