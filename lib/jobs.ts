// lib/jobs.ts
type JobRecord = {
  status: 'queued' | 'done' | 'error';
  html?: string;
  generatedAt?: string;
  error?: string;
};

const jobs = new Map<string, JobRecord>();

export function createJob(id: string) { 
  jobs.set(id, { status: 'queued' }); 
}

export function completeJob(id: string, html: string, t: string) { 
  jobs.set(id, { status: 'done', html, generatedAt: t }); 
}

export function failJob(id: string, err: string) { 
  jobs.set(id, { status: 'error', error: err }); 
}

export function getJob(id: string) { 
  return jobs.get(id) || null; 
}
