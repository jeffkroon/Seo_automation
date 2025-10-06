"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { ContentGenerationForm } from "@/components/content-generation-form"
import { ArticleResults } from "@/components/article-results"
import { Header } from "@/components/header"
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

export default function HomePage() {
  const searchParams = useSearchParams()
  const [articles, setArticles] = useState<ArticleSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatusState | null>(null)
  const [initialFormData, setInitialFormData] = useState<{
    focusKeyword: string
    country: string
    language: string
    webpageLink: string
    company: string
    additionalKeywords: string
    additionalHeadings: string
    articleType: string
  } | null>(null)

  // Read URL parameters and set initial form data
  useEffect(() => {
    const params = {
      focusKeyword: searchParams.get('Focus Keyword') || '',
      country: searchParams.get('Country') || '',
      language: searchParams.get('taal') || '',
      webpageLink: searchParams.get('Link webpagina') || '',
      company: searchParams.get('bedrijf') || '',
      additionalKeywords: searchParams.get('Aanvullende Zoekwoorden') || '',
      additionalHeadings: searchParams.get('Aanvullende Headings') || '',
      articleType: searchParams.get('Soort Artikel') || '',
    }
    
    // Only set if at least one parameter is provided
    if (Object.values(params).some(value => value !== '')) {
      setInitialFormData(params)
    }
  }, [searchParams])

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
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { jobId } = await response.json()
      
      if (!jobId) {
        throw new Error('Geen jobId ontvangen')
      }

      // Start polling for results
      await pollForResults(jobId)
      
    } catch (error) {
      console.error("Error generating articles:", error)
      
      let errorMessage = 'Er is een fout opgetreden bij het genereren van artikelen.'
      
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = 'Kan geen verbinding maken met de webhook. Controleer je internetverbinding en webhook URL.'
        } else if (error.message.includes('HTTP error')) {
          errorMessage = `Webhook error: ${error.message}. Controleer je n8n workflow.`
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-balance bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              SEO Automation Platform
            </h1>
            <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto">
              Automatiseer je SEO strategie met AI-gestuurde content generatie. Genereer geoptimaliseerde artikelen 
              die je zoekmachine rankings verbeteren.
            </p>
          </div>

          <ContentGenerationForm 
            onGenerate={handleGenerate} 
            isLoading={isLoading} 
            initialData={initialFormData}
          />

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
      </main>
    </div>
  )
}
