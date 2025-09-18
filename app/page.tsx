"use client"

import { useState } from "react"
import { ContentGenerationForm } from "@/components/content-generation-form"
import { ArticleResults } from "@/components/article-results"
import { Header } from "@/components/header"
import { LoadingState } from "@/components/loading-state"

interface Article {
  html: string
  title?: string
  id: string
}

interface WebhookResponse {
  output: string
}

// Function to extract title from markdown content
function extractTitleFromContent(content: string): string {
  // Look for markdown heading (# Title)
  const titleMatch = content.match(/^#\s*(.+)$/m)
  if (titleMatch) {
    return titleMatch[1].trim()
  }
  
  // Look for HTML h1 tag
  const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i)
  if (h1Match) {
    return h1Match[1].replace(/<[^>]*>/g, '').trim()
  }
  
  // Fallback to first line or default
  const firstLine = content.split('\n')[0].trim()
  return firstLine.length > 0 ? firstLine.substring(0, 50) + '...' : 'Artikel'
}

export default function HomePage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const handleGenerate = async (formData: {
    focusKeyword: string
    country: string
    language: string
    webpageLink: string
    company: string
  }) => {
    setIsLoading(true)
    setHasGenerated(false)

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
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }

        const job = await response.json()
        
        if (job.status === 'done' && job.html) {
          // Convert HTML to articles (assuming it contains multiple articles separated by <hr />)
          const articleHtmls = job.html.split('<hr />').filter((html: string) => html.trim())
          
          const convertedArticles: Article[] = articleHtmls.map((html: string, index: number) => ({
            id: `article-${index + 1}`,
            html: html.trim(),
            title: extractTitleFromContent(html)
          }))

          setArticles(convertedArticles)
          setHasGenerated(true)
          setIsLoading(false)
          return
        }
        
        if (job.status === 'error') {
          throw new Error(job.error || 'Workflow error')
        }

        // Still processing, continue polling (no timeout)
        console.log(`Polling attempt for job ${jobId}, status: ${job.status}`)
        
        // Poll again in 5 seconds
        setTimeout(poll, 5000)
        
      } catch (error) {
        console.error("Error polling for results:", error)
        alert(`Error: ${error instanceof Error ? error.message : 'Onbekende fout'}`)
        setIsLoading(false)
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

          <ContentGenerationForm onGenerate={handleGenerate} isLoading={isLoading} />

          {isLoading && <LoadingState />}

          {hasGenerated && articles.length > 0 && <ArticleResults articles={articles} />}
        </div>
      </main>
    </div>
  )
}
