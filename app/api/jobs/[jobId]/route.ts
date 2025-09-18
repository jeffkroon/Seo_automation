// app/api/jobs/[jobId]/route.ts
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export async function GET(_req: Request, ctx: { params: { jobId: string } }) {
  const jobId = ctx.params.jobId;
  const job = getJob(jobId);
  console.log(`Status check for job ${jobId}:`, job);
  
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}
