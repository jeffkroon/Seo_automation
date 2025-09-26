// app/api/jobs/[jobId]/route.ts
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export async function GET(_req: Request, ctx: { params: { jobId: string } }) {
  const jobId = ctx.params.jobId;
  const job = getJob(jobId);
  console.log(`Status check for job ${jobId}:`, job ? {
    status: job.status,
    hasHtml: !!job.html,
    htmlLength: job.html?.length,
    articlesCount: job.articles?.length,
    generatedAt: job.generatedAt
  } : 'Job not found');
  
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}
