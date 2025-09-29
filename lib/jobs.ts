// lib/jobs.ts
import { randomUUID } from 'crypto'

type JobResult = {
  id: string
  article?: string
  faqs?: string
  metaTitle?: string
  metaDescription?: string
  generatedAt?: string
  sequence: number
  createdAt: string
}

type JobRecord = {
  status: 'queued' | 'receiving' | 'done' | 'error'
  results: JobResult[]
  createdAt: string
  updatedAt?: string
  completedAt?: string
  error?: string
  isComplete: boolean
  resultsVersion: number
}

const jobs = new Map<string, JobRecord>()

export function createJob(id: string) {
  const now = new Date().toISOString()
  jobs.set(id, {
    status: 'queued',
    results: [],
    createdAt: now,
    updatedAt: now,
    isComplete: false,
    resultsVersion: 0,
  })
}

type StoreJobResultOptions = {
  id?: string
  article?: string
  faqs?: string
  metaTitle?: string
  metaDescription?: string
  generatedAt?: string
  sequence?: number
  markComplete?: boolean
}

export function storeJobResult(jobId: string, options: StoreJobResultOptions) {
  const job = jobs.get(jobId)

  if (!job) {
    console.warn(`Job ${jobId} not found when trying to store results`)
    return
  }

  const now = new Date().toISOString()
  const sequence = options.sequence ?? job.results.length + 1
  const resultId = options.id ?? randomUUID()

  const result: JobResult = {
    id: resultId,
    article: options.article?.trim(),
    faqs: options.faqs?.trim(),
    metaTitle: options.metaTitle?.trim(),
    metaDescription: options.metaDescription?.trim(),
    generatedAt: options.generatedAt,
    sequence,
    createdAt: now,
  }

  job.results.push(result)
  job.resultsVersion += 1
  job.updatedAt = now

  if (options.markComplete) {
    job.status = 'done'
    job.isComplete = true
    job.completedAt = now
  } else {
    job.status = job.status === 'done' ? 'done' : 'receiving'
  }

  jobs.set(jobId, job)

  console.log(`Job ${jobId} updated`, {
    status: job.status,
    resultsCount: job.results.length,
    isComplete: job.isComplete,
  })
}

export function failJob(id: string, err: string) {
  const now = new Date().toISOString()
  const existing = jobs.get(id)
  if (existing) {
    existing.status = 'error'
    existing.error = err
    existing.updatedAt = now
    existing.completedAt = now
    existing.isComplete = true
    jobs.set(id, existing)
  } else {
    jobs.set(id, {
      status: 'error',
      error: err,
      results: [],
      createdAt: now,
      updatedAt: now,
      isComplete: true,
      resultsVersion: 0,
      completedAt: now,
    })
  }
}

export function getJob(id: string) {
  return jobs.get(id) || null
}
