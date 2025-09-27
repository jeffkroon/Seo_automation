"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Copy, CheckCircle } from "lucide-react"
import { useState } from "react"

interface Article {
  html: string
  title?: string
  id: string
}

interface ArticleResultsProps {
  articles: Article[]
}

export function ArticleResults({ articles }: ArticleResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const extractTitle = (html: string): string => {
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i)
    return titleMatch ? titleMatch[1].replace(/<[^>]*>/g, "") : "Generated Article"
  }

  const extractPreview = (html: string): string => {
    const textContent = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return textContent.length > 150 ? textContent.substring(0, 150) + "..." : textContent
  }

  const copyToClipboard = async (html: string, id: string) => {
    try {
      await navigator.clipboard.writeText(html)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const downloadArticle = (html: string, title: string) => {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }


  return (
    <div className="space-y-6 fade-in-up">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold">Artikelen Succesvol Gegenereerd!</h2>
        </div>
        <p className="text-muted-foreground">
          Je AI-gestuurde content is klaar. {articles.length} artikel{articles.length !== 1 ? 'en' : ''} geoptimaliseerd voor SEO en afgestemd op jouw specificaties.
        </p>
      </div>

      <div className={`grid gap-6 ${
        articles.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
        articles.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
        'grid-cols-1 lg:grid-cols-3'
      }`}>
        {articles.map((article, index) => {
          const title = article.title || extractTitle(article.html)
          const preview = extractPreview(article.html)

          return (
            <Card
              key={article.id}
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      Artikel {index + 1}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg text-balance leading-tight">{title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Always show full HTML content */}
                <div className="max-w-none">
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-blockquote:border-primary"
                    dangerouslySetInnerHTML={{ __html: article.html }}
                  />
                </div>

                <div className="pt-2 space-y-2">

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => copyToClipboard(article.html, article.id)}
                  >
                    {copiedId === article.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Kopieer HTML
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => downloadArticle(article.html, title)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Downloaden
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Klaar voor integratie?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Vervang de mock data in de form handler met je echte webhook endpoint om echte content te genereren.
          </p>
          <Badge variant="outline" className="text-xs">
            Webhook Integratie Klaar
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}
