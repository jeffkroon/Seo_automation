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
    additionalKeywords?: string
    articleType?: string
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
          "Aanvullende Zoekwoorden": formData.additionalKeywords || "",
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
    const poll = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        
        if (!response.ok) {
          throw new Error(`Status check failed: ${response.status}`)
        }

        const job = await response.json()
        console.log(`Polling job ${jobId}:`, job)
        
        if (job.status === 'done') {
          console.log(`Job ${jobId} completed, raw data:`, job)
          
          // Check if we have the new n8n structure with article and faqs fields
          if (job.articles && job.articles.length > 0) {
            console.log(`Processing ${job.articles.length} articles from job ${jobId}`);
            
            const processedArticles: Article[] = [];
            
            // Process each article in the array
            for (let i = 0; i < job.articles.length; i++) {
              const articleContent = job.articles[i];
              
              // Parse the new structure - the content is now the full webhook body
              let parsedArticle;
              try {
                parsedArticle = typeof articleContent === 'string' ? JSON.parse(articleContent) : articleContent;
              } catch (e) {
                console.error(`Failed to parse article ${i}:`, e);
                continue; // Skip this article and continue with others
              }
              
              console.log(`Parsed article ${i} structure:`, {
                hasArticle: !!parsedArticle.article,
                hasFaqs: !!parsedArticle.faqs,
                articleType: typeof parsedArticle.article,
                faqsType: typeof parsedArticle.faqs
              });
              
              if (parsedArticle.article) {
                // Extract title from HTML head or content
                let title = `Generated Article ${i + 1}`;
                const titleMatch = parsedArticle.article.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) {
                  title = titleMatch[1].trim();
                } else {
                  title = extractTitleFromContent(parsedArticle.article);
                }
                
                // Use raw article content directly - no filtering
                console.log(`Using raw article content for article ${i}, length: ${parsedArticle.article.length}`);
                
                // Create separate articles for content and FAQs
                const articles: Article[] = [];
                
                // 1. Main article - raw HTML content
                const mainArticle: Article = {
                  id: `article-${jobId}-${i}`,
                  html: parsedArticle.article,
                  title: title
                };
                articles.push(mainArticle);
                
                // 2. FAQ article (if available) - raw HTML content
                if (parsedArticle.faqs && typeof parsedArticle.faqs === 'string') {
                  console.log(`Using raw FAQ content for article ${i}, length: ${parsedArticle.faqs.length}`);
                  
                  // Extract title from FAQ HTML
                  let faqTitle = `FAQs - ${title}`;
                  const faqTitleMatch = parsedArticle.faqs.match(/<title>(.*?)<\/title>/i);
                  if (faqTitleMatch) {
                    faqTitle = faqTitleMatch[1].trim();
                  }
                  
                  // Use raw FAQ HTML content directly
                  const faqArticle: Article = {
                    id: `faqs-${jobId}-${i}`,
                    html: parsedArticle.faqs,
                    title: faqTitle
                  };
                  articles.push(faqArticle);
                  console.log(`Created FAQ article with title: ${faqTitle}`);
                } else if (parsedArticle.faqs && Array.isArray(parsedArticle.faqs)) {
                  // Handle array format
                  let faqContent = '<h2>Veelgestelde Vragen</h2>\n';
                  parsedArticle.faqs.forEach((faq: any) => {
                    faqContent += `\n<h3>${faq.q || faq.question}</h3>\n<p>${faq.a_brief || faq.answer}</p>\n`;
                  });
                  
                  const faqArticle: Article = {
                    id: `faqs-${jobId}-${i}`,
                    html: faqContent,
                    title: `FAQs - ${title}`
                  };
                  articles.push(faqArticle);
                }
                
                // Add all articles to the processed list
                processedArticles.push(...articles);
                
                console.log(`Created ${articles.length} articles for item ${i}:`, {
                  mainArticle: articles[0]?.title,
                  faqArticle: articles[1]?.title,
                  totalArticles: processedArticles.length
                });
              }
            }
            
            if (processedArticles.length > 0) {
              setArticles(processedArticles)
              setHasGenerated(true)
              setIsLoading(false)
              return
            }
          }
          
          // Fallback: show raw data if parsing fails
          const rawDataArticle: Article = {
            id: `raw-data-${jobId}`,
            html: `<pre>${JSON.stringify(job, null, 2)}</pre>`,
            title: `Raw Data - Job ${jobId}`
          }

          setArticles([rawDataArticle])
          setHasGenerated(true)
          setIsLoading(false)
          return
        }
        
        if (job.status === 'error') {
          throw new Error(job.error || 'Workflow error')
        }

        // Still processing, continue polling (no timeout)
        console.log(`Polling attempt for job ${jobId}, status: ${job.status}`)
        
        // Poll again in 3 seconds (reduced from 5 seconds for faster response)
        setTimeout(poll, 3000)
        
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
