"use client"

import { useState } from "react"
import { ContentGenerationForm } from "@/components/content-generation-form"
import { ArticleResults } from "@/components/article-results"
import { LoadingState } from "@/components/loading-state"

type SectionKind = 'article' | 'faq' | 'meta'

interface ArticleSection {
  id: string
  html: string
  title: string
  kind: SectionKind
  sequence: number
}

interface JobStatusState {
  status: string
  completedPairs: number
  isComplete: boolean
  totalPairsHint?: number
  lastUpdatedAt?: string
}

export default function KeywordsPage() {
  const [articles, setArticles] = useState<ArticleSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatusState | null>(null)

  const handleGenerate = async (formData: {
    focusKeyword: string
    country: string
    language: string
    webpageLink: string
    company: string
    additionalKeywords?: string
    additionalHeadings?: string
    articleType?: string
  }) => {
    setIsLoading(true)
    setHasGenerated(false)
    setArticles([])
    setJobStatus({ status: 'Workflow gestart', completedPairs: 0, isComplete: false })

    try {
      // Start the workflow and get jobId
      const response = await fetch('/api/generate-articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "Focus Keyword": formData.focusKeyword,
          "Country": formData.country,
          "taal": formData.language,
          "Link webpagina": formData.webpageLink,
          "bedrijf": formData.company,
          "Aanvullende Zoekwoorden": formData.additionalKeywords || "",
          "Aanvullende Headings": formData.additionalHeadings || "",
          "Soort Artikel": formData.articleType || "",
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()
      
      if (!responseData.jobId) {
        throw new Error(responseData.error || 'Geen jobId ontvangen')
      }

      // Start polling for results
      await pollForResults(responseData.jobId)
      
    } catch (error) {
      console.error("Error generating articles:", error)
      
      let errorMessage = 'Er is een fout opgetreden bij het genereren van artikelen.'
      
      if (error instanceof Error) {
        if (error.message.includes('too many users')) {
          errorMessage = 'De service is momenteel overbelast. Probeer het over een paar minuten opnieuw.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Kan geen verbinding maken met de webhook. Controleer je internetverbinding en webhook URL.'
        } else if (error.message.includes('HTTP error')) {
          errorMessage = `Webhook error: ${error.message}. Controleer je n8n workflow.`
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
      setIsLoading(false)
    }
  }

  const pollForResults = async (jobId: string) => {
    let lastVersion = -1
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }

        const job = await response.json()
        console.log(`Polling job ${jobId}:`, job)

        if (job.status === 'error') {
          throw new Error(job.error || 'Workflow error')
        }

        const sequences = new Set<number>()
        if (Array.isArray(job.results)) {
          job.results.forEach((result: any, index: number) => {
            const sequence = result?.sequence ?? index + 1
            sequences.add(sequence)
          })
        }

        setJobStatus({
          status: job.status,
          completedPairs: sequences.size,
          isComplete: Boolean(job.isComplete),
          totalPairsHint: job.totalPairs ?? job.expectedResults,
          lastUpdatedAt: job.updatedAt,
        })

        if (typeof job.resultsVersion === 'number' && job.resultsVersion !== lastVersion) {
          lastVersion = job.resultsVersion

          const sections: ArticleSection[] = (job.results || []).flatMap((result: any, index: number) => {
            const sequence = result?.sequence ?? index + 1
            const baseId = result?.id ?? `${jobId}-${sequence}`
            const entries: ArticleSection[] = []

            if (result?.article) {
              entries.push({
                id: `${baseId}-article`,
                html: String(result.article).trim(),
                title: result.metaTitle?.trim() || `Artikel ${sequence}`,
                kind: 'article',
                sequence,
              })
            }

            if (result?.faqs) {
              entries.push({
                id: `${baseId}-faq`,
                html: String(result.faqs).trim(),
                title: `Veelgestelde Vragen ${sequence}`,
                kind: 'faq',
                sequence,
              })
            }

            return entries
          }).sort((a: ArticleSection, b: ArticleSection) => {
            if (a.sequence !== b.sequence) return a.sequence - b.sequence
            const kindWeight = { article: 0, faq: 1, meta: 2 } as const
            return kindWeight[a.kind] - kindWeight[b.kind]
          })

          if (sections.length > 0) {
            setArticles(sections)
            setHasGenerated(true)
          }
        }

        if (job.isComplete) {
          setIsLoading(false)
          setJobStatus((prev) => prev ? { ...prev, isComplete: true, status: job.status } : {
            status: job.status,
            completedPairs: sequences.size,
            isComplete: true,
          })
          isPolling = false
          return
        }

        console.log(`Polling attempt for job ${jobId}, status: ${job.status}`)
        setTimeout(poll, 3000)
        
      } catch (error) {
        console.error("Error polling for results:", error)
        alert(`Error: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
        setIsLoading(false)
        setJobStatus((prev) => prev ? { ...prev, status: 'error', isComplete: true } : { status: 'error', completedPairs: 0, isComplete: true })
        isPolling = false
      }
    }

    // Start polling
    poll()
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Copywriter</h1>
        <p className="text-muted-foreground max-w-2xl">
          Generate SEO-optimized articles with AI-driven content creation.
        </p>
      </div>

      <ContentGenerationForm onGenerate={handleGenerate} isLoading={isLoading} />

      {isLoading && (
        <LoadingState
          status={jobStatus?.status}
          completedPairs={jobStatus?.completedPairs}
          totalPairsHint={jobStatus?.totalPairsHint}
          isComplete={jobStatus?.isComplete}
          lastUpdatedAt={jobStatus?.lastUpdatedAt}
        />
      )}

      {hasGenerated && articles.length > 0 && <ArticleResults articles={articles} />}
    </div>
  )
}