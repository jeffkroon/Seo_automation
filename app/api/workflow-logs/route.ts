// app/api/workflow-logs/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const supabase = createClient();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const workflowType = url.searchParams.get('workflowType');
    
    let query = supabase
      .from('workflow_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (workflowType) {
      query = query.eq('workflow_type', workflowType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Failed to fetch workflow logs:', error);
      return NextResponse.json({ error: 'Failed to fetch workflow logs' }, { status: 500 });
    }
    
    return NextResponse.json({ data });
    
  } catch (err: any) {
    console.error('=== WORKFLOW LOGS ERROR ===', err);
    return NextResponse.json({ error: err?.message || 'Onbekende fout' }, { status: 500 });
  }
}
