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
      // Call webhook to generate articles
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || '/api/generate-articles'
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          focusKeyword: formData.focusKeyword,
          country: formData.country,
          language: formData.language,
          webpageLink: formData.webpageLink,
          company: formData.company,
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
      
      // Fallback to mock data if webhook fails (for development/testing)
      if (process.env.NODE_ENV === 'development') {
        console.warn("Using mock data as fallback")
        const mockArticles: Article[] = [
          {
            id: "1",
            title: `${formData.focusKeyword} Gids voor ${formData.company}`,
            html: `<h1>Complete ${formData.focusKeyword} Gids</h1><p>Deze uitgebreide gids behandelt alles wat je moet weten over <strong>${formData.focusKeyword}</strong> in ${formData.country}. Ons expert team bij ${formData.company} heeft de meest actuele informatie samengesteld om je te helpen slagen.</p><h2>Belangrijkste Voordelen</h2><ul><li>Verbeterde zoekmachine rankings</li><li>Betere gebruikersbetrokkenheid</li><li>Verhoogde conversiepercentages</li></ul><p>Lees meer op <a href="${formData.webpageLink}" target="_blank">${formData.webpageLink}</a></p>`,
          },
          {
            id: "2",
            title: `${formData.focusKeyword} Beste Praktijken`,
            html: `<h1>Beste Praktijken voor ${formData.focusKeyword}</h1><p>Ontdek de meest effectieve strategieën voor het implementeren van <strong>${formData.focusKeyword}</strong> in je bedrijf. Dit artikel is specifiek afgestemd op bedrijven die opereren in ${formData.country}.</p><h2>Implementatie Stappen</h2><ol><li>Onderzoek je doelgroep</li><li>Optimaliseer je content strategie</li><li>Monitor prestatie-indicatoren</li></ol><blockquote>Succes in ${formData.focusKeyword} vereist consistente inspanning en strategische planning.</blockquote>`,
          },
          {
            id: "3",
            title: `Geavanceerde ${formData.focusKeyword} Technieken`,
            html: `<h1>Geavanceerde ${formData.focusKeyword} Technieken</h1><p>Breng je <strong>${formData.focusKeyword}</strong> strategie naar het volgende niveau met deze geavanceerde technieken. Perfect voor bedrijven in ${formData.country} die een concurrentievoordeel willen behalen.</p><h2>Geavanceerde Strategieën</h2><ul><li>Data-gedreven optimalisatie</li><li>AI-gestuurde content creatie</li><li>Cross-platform integratie</li></ul><p>Neem contact op met ${formData.company} voor persoonlijke consultatie en implementatie ondersteuning.</p>`,
          },
        ]
        setArticles(mockArticles)
        setHasGenerated(true)
      } else {
        // In production, show error to user
        alert('Er is een fout opgetreden bij het genereren van artikelen. Probeer het later opnieuw.')
      }
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
