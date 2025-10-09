"use client"

import { useState } from "react"
import { BatchContentForm } from "@/components/batch-content-form"
import { ArticleResults } from "@/components/article-results"
import { LoadingState } from "@/components/loading-state"

type SectionKind = "article" | "faq" | "meta"

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

interface ContentPiece {
  id: string
  focusKeyword: string
  country: string
  language: string
  webpageLink: string
  company: string
  additionalKeywords: string[]
  additionalHeadings: string[]
  articleType: string
}

export default function KeywordsPage() {
  const [articles, setArticles] = useState<ArticleSection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [jobStatus, setJobStatus] = useState<JobStatusState | null>(null)
  const [loadingPieceIds, setLoadingPieceIds] = useState<Set<string>>(new Set())

  const handleGenerateSingle = async (contentPiece: ContentPiece) => {
    // Mark this piece as loading
    setLoadingPieceIds(prev => new Set(prev).add(contentPiece.id))
    
    try {
      const response = await fetch("/api/generate-articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "Focus Keyword": contentPiece.focusKeyword,
          Country: contentPiece.country,
          taal: contentPiece.language,
          "Link webpagina": contentPiece.webpageLink,
          bedrijf: contentPiece.company,
          "Aanvullende Zoekwoorden": contentPiece.additionalKeywords.join(", "),
          "Aanvullende Headings": contentPiece.additionalHeadings.join(", "),
          "Soort Artikel": contentPiece.articleType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const responseData = await response.json()

      if (!responseData.jobId) {
        throw new Error(responseData.error || "Geen jobId ontvangen")
      }

      // Poll for this single job
      setHasGenerated(true)
      await pollForAllResults([responseData.jobId])
    } catch (error) {
      console.error("Error generating article:", error)

      let errorMessage = "Er is een fout opgetreden bij het genereren van het artikel."

      if (error instanceof Error) {
        if (error.message.includes("too many users")) {
          errorMessage = "De service is momenteel overbelast. Probeer het over een paar minuten opnieuw."
        } else if (error.message.includes("fetch")) {
          errorMessage = "Kan geen verbinding maken met de webhook. Controleer je internetverbinding en webhook URL."
        } else if (error.message.includes("HTTP error")) {
          errorMessage = `Webhook error: ${error.message}. Controleer je n8n workflow.`
        } else {
          errorMessage = error.message
        }
      }

      alert(errorMessage)
    } finally {
      // Remove from loading
      setLoadingPieceIds(prev => {
        const next = new Set(prev)
        next.delete(contentPiece.id)
        return next
      })
    }
  }

  const handleGenerate = async (contentPieces: ContentPiece[]) => {
    setIsLoading(true)
    setHasGenerated(false)
    setArticles([])
    setJobStatus({
      status: "Workflow gestart",
      completedPairs: 0,
      isComplete: false,
      totalPairsHint: contentPieces.length,
    })

    try {
      // Process each content piece sequentially
      // In production, you might want to batch these or process in parallel
      const allJobIds: string[] = []

      for (let i = 0; i < contentPieces.length; i++) {
        const piece = contentPieces[i]

        setJobStatus((prev) =>
          prev
            ? {
                ...prev,
                status: `Verwerken content ${i + 1} van ${contentPieces.length}`,
              }
            : {
                status: `Verwerken content ${i + 1} van ${contentPieces.length}`,
                completedPairs: i,
                isComplete: false,
                totalPairsHint: contentPieces.length,
              },
        )

        const response = await fetch("/api/generate-articles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "Focus Keyword": piece.focusKeyword,
            Country: piece.country,
            taal: piece.language,
            "Link webpagina": piece.webpageLink,
            bedrijf: piece.company,
            "Aanvullende Zoekwoorden": piece.additionalKeywords.join(", "),
            "Aanvullende Headings": piece.additionalHeadings.join(", "),
            "Soort Artikel": piece.articleType,
            sequence: i + 1, // Add sequence to track which piece this is
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const responseData = await response.json()

        if (!responseData.jobId) {
          throw new Error(responseData.error || "Geen jobId ontvangen")
        }

        allJobIds.push(responseData.jobId)
      }

      // Poll for all results
      await pollForAllResults(allJobIds)
    } catch (error) {
      console.error("Error generating articles:", error)

      let errorMessage = "Er is een fout opgetreden bij het genereren van artikelen."

      if (error instanceof Error) {
        if (error.message.includes("too many users")) {
          errorMessage = "De service is momenteel overbelast. Probeer het over een paar minuten opnieuw."
        } else if (error.message.includes("fetch")) {
          errorMessage = "Kan geen verbinding maken met de webhook. Controleer je internetverbinding en webhook URL."
        } else if (error.message.includes("HTTP error")) {
          errorMessage = `Webhook error: ${error.message}. Controleer je n8n workflow.`
        } else {
          errorMessage = error.message
        }
      }

      alert(errorMessage)
      setIsLoading(false)
    }
  }

  const pollForAllResults = async (jobIds: string[]) => {
    const lastVersions = new Map<string, number>()
    jobIds.forEach((id) => lastVersions.set(id, -1))

    let isPolling = true
    const completedJobs = new Set<string>()

    const poll = async () => {
      if (!isPolling) return

      try {
        // Poll all jobs in parallel
        const results = await Promise.all(jobIds.map((jobId) => fetch(`/api/jobs/${jobId}`).then((res) => res.json())))

        let totalCompleted = 0
        const allSections: ArticleSection[] = []

        results.forEach((job, index) => {
          const jobId = jobIds[index]

          if (job.status === "error") {
            throw new Error(job.error || "Workflow error")
          }

          if (job.isComplete) {
            completedJobs.add(jobId)
            totalCompleted++
          }

          const lastVersion = lastVersions.get(jobId) ?? -1

          if (typeof job.resultsVersion === "number" && job.resultsVersion !== lastVersion) {
            lastVersions.set(jobId, job.resultsVersion)

            const sections: ArticleSection[] = (job.results || []).flatMap((result: any, resultIndex: number) => {
              const sequence = result?.sequence ?? index + 1
              const baseId = result?.id ?? `${jobId}-${sequence}`
              const entries: ArticleSection[] = []

              if (result?.article) {
                entries.push({
                  id: `${baseId}-article`,
                  html: String(result.article).trim(),
                  title: result.metaTitle?.trim() || `Artikel ${sequence}`,
                  kind: "article",
                  sequence,
                })
              }

              if (result?.faqs) {
                entries.push({
                  id: `${baseId}-faq`,
                  html: String(result.faqs).trim(),
                  title: `Veelgestelde Vragen ${sequence}`,
                  kind: "faq",
                  sequence,
                })
              }

              return entries
            })

            allSections.push(...sections)
          }
        })

        setJobStatus({
          status: completedJobs.size === jobIds.length ? "Alle content gegenereerd" : "Content genereren",
          completedPairs: completedJobs.size,
          isComplete: completedJobs.size === jobIds.length,
          totalPairsHint: jobIds.length,
          lastUpdatedAt: new Date().toISOString(),
        })

        if (allSections.length > 0) {
          const sortedSections = allSections.sort((a, b) => {
            if (a.sequence !== b.sequence) return a.sequence - b.sequence
            const kindWeight = { article: 0, faq: 1, meta: 2 } as const
            return kindWeight[a.kind] - kindWeight[b.kind]
          })

          setArticles(sortedSections)
          setHasGenerated(true)
        }

        if (completedJobs.size === jobIds.length) {
          setIsLoading(false)
          isPolling = false
          return
        }

        setTimeout(poll, 3000)
      } catch (error) {
        console.error("Error polling for results:", error)
        alert(`Error: ${error instanceof Error ? error.message : "Onbekende fout"}`)
        setIsLoading(false)
        setJobStatus((prev) =>
          prev
            ? { ...prev, status: "error", isComplete: true }
            : {
                status: "error",
                completedPairs: 0,
                isComplete: true,
              },
        )
        isPolling = false
      }
    }

    poll()
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Copywriter</h1>
        <p className="text-muted-foreground max-w-2xl">
          Genereer meerdere SEO-geoptimaliseerde artikelen met AI-gestuurde contentcreatie.
        </p>
      </div>

      <BatchContentForm 
        onGenerate={handleGenerate} 
        onGenerateSingle={handleGenerateSingle}
        isLoading={isLoading} 
        loadingPieceIds={loadingPieceIds}
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
  )
}
