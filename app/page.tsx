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
      // Call our API route which handles the webhook call server-side
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

      const data: WebhookResponse[] = await response.json()
      
      // Ensure we have articles in the response
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format: expected array of articles')
      }

      // Convert webhook response to Article format
      const convertedArticles: Article[] = data.map((item, index) => ({
        id: `article-${index + 1}`,
        html: item.output,
        title: extractTitleFromContent(item.output)
      }))

      setArticles(convertedArticles)
      setHasGenerated(true)
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
    } finally {
      setIsLoading(false)
    }
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
