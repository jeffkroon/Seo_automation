"use client"

import { useState, useEffect } from "react"
import { BatchContentForm } from "@/components/batch-content-form"
import { ArticleResults } from "@/components/article-results"
import { LoadingState } from "@/components/loading-state"
import { useClientContext } from "@/hooks/use-client-context"

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
  title?: string
  focusKeyword: string
  country: string
  language: string
  webpageLink: string
  company: string
  additionalKeywords: string[]
  additionalHeadings: string[]
  articleType: string
  generatedArticles?: ArticleSection[]
}

export default function KeywordsPage() {
  const { selectedClient } = useClientContext()
  const createEmptyPiece = (): ContentPiece => ({
    id: Math.random().toString(36).substr(2, 9),
    title: "",
    focusKeyword: "",
    country: "",
    language: "",
    webpageLink: "",
    company: "",
    additionalKeywords: [],
    additionalHeadings: [],
    articleType: "",
    generatedArticles: []
  })
  
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([createEmptyPiece()])
  const [loadingPieceIds, setLoadingPieceIds] = useState<Set<string>>(new Set())
  const [jobToPieceMap, setJobToPieceMap] = useState<Map<string, string>>(new Map())

  // Load active jobs from localStorage on mount
  useEffect(() => {
    const savedJobs = localStorage.getItem('activeJobs')
    if (savedJobs) {
      try {
        const jobs = JSON.parse(savedJobs) as Array<{ jobId: string; pieceId: string; pieceData?: ContentPiece }>
        
        if (jobs.length > 0) {
          console.log('Hervatten van actieve jobs:', jobs)
          
          // Restore loading state
          const pieceIds = new Set(jobs.map(j => j.pieceId))
          setLoadingPieceIds(pieceIds)
          
          // Restore job mapping
          const mapping = new Map(jobs.map(j => [j.jobId, j.pieceId]))
          setJobToPieceMap(mapping)
          
          // Create/restore content pieces with the saved data
          setContentPieces(prev => {
            // If we only have one empty piece, replace it with pieces from jobs
            if (prev.length === 1 && !prev[0].focusKeyword) {
              return jobs.map(({ pieceId, pieceData }) => {
                if (pieceData) {
                  // Restore the full piece data including generated articles!
                  return {
                    ...pieceData,
                    generatedArticles: pieceData.generatedArticles || []  // Keep existing articles
                  }
                }
                // Fallback: create empty piece with saved ID
                return {
                  ...createEmptyPiece(),
                  id: pieceId
                }
              })
            }
            return prev
          })
          
          // Resume polling for each job
          jobs.forEach(({ jobId, pieceId }) => {
            pollForResults(jobId, pieceId)
          })
        }
      } catch (error) {
        console.error('Error loading active jobs:', error)
      }
    }
  }, [])

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
          "Client ID": selectedClient?.id,
          "Client Naam": selectedClient?.naam,
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

      // Map jobId to pieceId so we can update the right piece
      setJobToPieceMap(prev => new Map(prev).set(responseData.jobId, contentPiece.id))

      // Save active job to localStorage
      saveActiveJob(responseData.jobId, contentPiece.id)

      // Poll for this single job
      await pollForResults(responseData.jobId, contentPiece.id)
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
      setLoadingPieceIds(prev => {
        const next = new Set(prev)
        next.delete(contentPiece.id)
        return next
      })
    }
  }

  const saveActiveJob = (jobId: string, pieceId: string) => {
    const savedJobs = localStorage.getItem('activeJobs')
    let jobs = []
    
    if (savedJobs) {
      try {
        jobs = JSON.parse(savedJobs)
      } catch (e) {
        jobs = []
      }
    }
    
    // Find the piece data
    const piece = contentPieces.find(p => p.id === pieceId)
    
    // Add new job if not already there
    if (!jobs.find((j: any) => j.jobId === jobId)) {
      jobs.push({ 
        jobId, 
        pieceId,
        pieceData: piece  // Save the full piece data!
      })
      localStorage.setItem('activeJobs', JSON.stringify(jobs))
    }
  }

  const removeActiveJob = (jobId: string) => {
    const savedJobs = localStorage.getItem('activeJobs')
    if (!savedJobs) return
    
    try {
      const jobs = JSON.parse(savedJobs)
      const filtered = jobs.filter((j: any) => j.jobId !== jobId)
      localStorage.setItem('activeJobs', JSON.stringify(filtered))
    } catch (e) {
      console.error('Error removing active job:', e)
    }
  }

  const pollForResults = async (jobId: string, pieceId: string) => {
    let lastVersion = -1
    let isPolling = true

    const poll = async () => {
      if (!isPolling) return

      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        
        if (!response.ok) {
          // Job not found (404) - stop polling gracefully
          if (response.status === 404) {
            console.log(`Job ${jobId} not found - stopping polling`)
            removeActiveJob(jobId)
            setLoadingPieceIds(prev => {
              const next = new Set(prev)
              next.delete(pieceId)
              return next
            })
            isPolling = false
            return
          }
          throw new Error(`Status check failed: ${response.status}`)
        }

        const job = await response.json()
        console.log(`🔄 Polling job ${jobId}:`, {
          status: job.status,
          isComplete: job.isComplete,
          error: job.error,
          resultsCount: job.results?.length || 0,
          resultsVersion: job.resultsVersion
        })

        // Stop polling ONLY if webhook returned an error
        if (job.status === "error") {
          console.error(`❌ Job ${jobId} failed:`, job.error)
          removeActiveJob(jobId)
          setLoadingPieceIds(prev => {
            const next = new Set(prev)
            next.delete(pieceId)
            return next
          })
          isPolling = false
          
          // Show error to user
          alert(`❌ Content generatie mislukt:\n\n${job.error || "Onbekende fout van de workflow"}`)
          return
        }

        // Only process if we have new results (version changed AND we have results)
        if (typeof job.resultsVersion === "number" && 
            job.resultsVersion !== lastVersion && 
            job.results && 
            job.results.length > 0) {
          lastVersion = job.resultsVersion
          console.log(`📥 Processing ${job.results.length} results for version ${job.resultsVersion}`)

          const sections: ArticleSection[] = (job.results || []).flatMap((result: any, index: number) => {
            const sequence = result?.sequence ?? 1
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

          if (sections.length > 0) {
            // Update the specific piece with its generated articles
            setContentPieces(prev => prev.map(piece => {
              if (piece.id === pieceId) {
                const existingArticles = piece.generatedArticles || []
                const existingIds = new Set(existingArticles.map(a => a.id))
                const newSections = sections.filter(s => !existingIds.has(s.id))
                
                // Use the content piece title for articles
                const updatedSections = newSections.map(section => ({
                  ...section,
                  title: piece.title || section.title
                }))
                
                console.log(`📝 Added ${updatedSections.length} articles to "${piece.title || piece.focusKeyword}"`)
                
                return {
                  ...piece,
                  generatedArticles: [...existingArticles, ...updatedSections].sort((a, b) => {
                    const kindWeight = { article: 0, faq: 1, meta: 2 } as const
                    return kindWeight[a.kind] - kindWeight[b.kind]
                  })
                }
              }
              return piece
            }))
          }
        }

        if (job.isComplete) {
          console.log(`✅ Job ${jobId} complete`)
          removeActiveJob(jobId)
          setLoadingPieceIds(prev => {
            const next = new Set(prev)
            next.delete(pieceId)
            return next
          })
          isPolling = false
          return
        }

        setTimeout(poll, 3000)
        
      } catch (error) {
        console.error("Error polling for results:", error)
        alert(`Error: ${error instanceof Error ? error.message : "Onbekende fout"}`)
        removeActiveJob(jobId)
        setLoadingPieceIds(prev => {
          const next = new Set(prev)
          next.delete(pieceId)
          return next
        })
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
          Genereer SEO-geoptimaliseerde artikelen met AI-gestuurde contentcreatie.
        </p>
      </div>

      <div className="space-y-6">
        {contentPieces.map((piece, index) => (
          <div key={piece.id} className="space-y-4">
            <BatchContentForm 
              onGenerateSingle={handleGenerateSingle}
              isLoading={false} 
              loadingPieceIds={loadingPieceIds}
              contentPieces={[piece]}
              onUpdatePieces={(updatedPieces) => {
                setContentPieces(prev => {
                  const newPieces = [...prev]
                  newPieces[index] = updatedPieces[0]
                  return newPieces
                })
              }}
            />
            
            {/* Show loading state for this piece */}
            {loadingPieceIds.has(piece.id) && (
              <LoadingState
                status={`Artikel genereren voor "${piece.title || piece.focusKeyword}"...`}
                completedPairs={0}
                totalPairsHint={1}
                isComplete={false}
              />
            )}
            
            {/* Show generated articles under this piece */}
            {piece.generatedArticles && piece.generatedArticles.length > 0 && (
              <ArticleResults 
                articles={piece.generatedArticles}
                metadata={{
                  focusKeyword: piece.focusKeyword,
                  country: piece.country,
                  language: piece.language,
                  articleType: piece.articleType,
                  additionalKeywords: piece.additionalKeywords,
                  additionalHeadings: piece.additionalHeadings,
                }}
              />
            )}
          </div>
        ))}
        
        {/* Add new content piece button */}
        {contentPieces.length > 0 && contentPieces[contentPieces.length - 1].focusKeyword && (
          <div className="pt-4">
            <button
              onClick={() => setContentPieces(prev => [...prev, createEmptyPiece()])}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              + Add another content piece
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
