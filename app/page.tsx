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

      const data = await response.json()
      
      // Ensure we have articles in the response
      if (!data.articles || !Array.isArray(data.articles)) {
        throw new Error('Invalid response format: articles array not found')
      }

      setArticles(data.articles)
      setHasGenerated(true)
    } catch (error) {
      console.error("Error generating articles:", error)
      
      // Fallback to mock data if webhook fails (for development/testing)
      if (process.env.NODE_ENV === 'development') {
        console.warn("Using mock data as fallback")
        const mockArticles: Article[] = [
          {
            id: "1",
            title: `${formData.focusKeyword} Guide for ${formData.company}`,
            html: `<h1>Complete ${formData.focusKeyword} Guide</h1><p>This comprehensive guide covers everything you need to know about <strong>${formData.focusKeyword}</strong> in ${formData.country}. Our expert team at ${formData.company} has compiled the most up-to-date information to help you succeed.</p><h2>Key Benefits</h2><ul><li>Improved search rankings</li><li>Better user engagement</li><li>Increased conversion rates</li></ul><p>Learn more at <a href="${formData.webpageLink}" target="_blank">${formData.webpageLink}</a></p>`,
          },
          {
            id: "2",
            title: `${formData.focusKeyword} Best Practices`,
            html: `<h1>Best Practices for ${formData.focusKeyword}</h1><p>Discover the most effective strategies for implementing <strong>${formData.focusKeyword}</strong> in your business. This article is specifically tailored for companies operating in ${formData.country}.</p><h2>Implementation Steps</h2><ol><li>Research your target audience</li><li>Optimize your content strategy</li><li>Monitor performance metrics</li></ol><blockquote>Success in ${formData.focusKeyword} requires consistent effort and strategic planning.</blockquote>`,
          },
          {
            id: "3",
            title: `Advanced ${formData.focusKeyword} Techniques`,
            html: `<h1>Advanced ${formData.focusKeyword} Techniques</h1><p>Take your <strong>${formData.focusKeyword}</strong> strategy to the next level with these advanced techniques. Perfect for businesses in ${formData.country} looking to gain a competitive edge.</p><h2>Advanced Strategies</h2><ul><li>Data-driven optimization</li><li>AI-powered content creation</li><li>Cross-platform integration</li></ul><p>Contact ${formData.company} for personalized consultation and implementation support.</p>`,
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
