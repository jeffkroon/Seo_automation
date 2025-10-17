// app/api/workflow-status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    console.log('=== WORKFLOW STATUS UPDATE RECEIVED ===');
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
    
    console.log('=== WORKFLOW STATUS BODY ===');
    console.log(JSON.stringify(body, null, 2));
    
    const { 
      workflowType, // 'schedule_processor' | 'schedule_execution' | 'schedule_completion'
      status, // 'started' | 'processing' | 'completed' | 'error'
      scheduleIds, // array van UUIDs
      message,
      error,
      stats // { found: number, processed: number, failed: number }
    } = body;
    
    const supabase = createClient();

    // Log de status update
    console.log(`📊 Workflow Status: ${workflowType} - ${status}`, {
      scheduleIds,
      message,
      stats
    });

    // Optioneel: sla status update op in database voor historie
    if (stats) {
      const { error: logError } = await supabase
        .from('workflow_logs')
        .insert({
          workflow_type: workflowType,
          status: status,
          schedule_ids: scheduleIds,
          message: message,
          error: error,
          stats: stats,
          created_at: new Date().toISOString()
        });

      if (logError) {
        console.error('Failed to log workflow status:', logError);
      }
    }

    // Voor real-time updates naar frontend (als je WebSockets hebt)
    // Hier zou je een WebSocket broadcast kunnen doen
    
    return NextResponse.json({ 
      ok: true, 
      received: true,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    console.error('=== WORKFLOW STATUS ERROR ===', err);
    return NextResponse.json({ error: err?.message || 'Onbekende fout' }, { status: 500 });
  }
}
