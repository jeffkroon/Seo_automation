// app/api/workflow-status/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    
    // Create service role client for bypassing RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
      } else {
        console.log('✅ Successfully logged workflow status to database');
      }
    }

    // Update schedule status to completed if this is a successful execution
    if (workflowType === 'schedule_execution' && status === 'completed' && scheduleIds?.length > 0) {
      console.log('🔄 Updating schedule status to completed for:', scheduleIds);
      
      const { error: scheduleUpdateError } = await supabase
        .from('schedules')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', scheduleIds);

      if (scheduleUpdateError) {
        console.error('Failed to update schedule status:', scheduleUpdateError);
      } else {
        console.log('✅ Successfully updated schedule status to completed');
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
