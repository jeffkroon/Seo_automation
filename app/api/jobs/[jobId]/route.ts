// app/api/jobs/[jobId]/route.ts
import { NextResponse } from 'next/server';
import { getJob } from '@/lib/jobs';

export async function GET(_req: Request, ctx: { params: { jobId: string } }) {
  const job = getJob(ctx.params.jobId);
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(job);
}
