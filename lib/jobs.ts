// lib/jobs.ts
type JobRecord = {
  status: 'queued' | 'done' | 'error';
  html?: string;
  articles?: string[]; // Store multiple articles
  generatedAt?: string;
  error?: string;
};

const jobs = new Map<string, JobRecord>();

export function createJob(id: string) { 
  jobs.set(id, { status: 'queued', articles: [] }); 
}

export function completeJob(id: string, html: string, t: string) { 
  const job = jobs.get(id);
  if (job) {
    // Add new article to the list
    const articles = job.articles || [];
    articles.push(html);
    
    // Combine all articles with <hr /> separator
    const combinedHtml = articles.join('\n<hr />\n');
    
    const updatedJob = { 
      status: 'done' as const, 
      html: combinedHtml,
      articles: articles,
      generatedAt: t 
    };
    
    jobs.set(id, updatedJob);
    console.log(`Job ${id} completed:`, { 
      status: updatedJob.status, 
      articlesCount: articles.length, 
      htmlLength: combinedHtml.length 
    });
  } else {
    console.warn(`Job ${id} not found when trying to complete`);
  }
}

export function failJob(id: string, err: string) { 
  jobs.set(id, { status: 'error', error: err }); 
}

export function getJob(id: string) { 
  return jobs.get(id) || null; 
}
