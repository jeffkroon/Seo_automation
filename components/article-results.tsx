"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Copy, CheckCircle, ChevronDown, ChevronRight, Save, HelpCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import HtmlSection, { sanitizeHtml } from "@/components/HtmlSection"
import { cn } from "@/lib/utils"
import { createRoot } from "react-dom/client"
import { useClientContext } from "@/hooks/use-client-context"
import { apiClient } from "@/lib/api-client"

type SectionKind = "article" | "faq" | "meta"

interface ArticleSection {
  html: string
  title: string
  id: string
  kind: SectionKind
  sequence: number
}

interface ArticleResultsProps {
  articles: ArticleSection[]
  metadata?: {
    focusKeyword?: string
    country?: string
    language?: string
    articleType?: string
    additionalKeywords?: string[]
    additionalHeadings?: string[]
  }
}

export function ArticleResults({ articles, metadata }: ArticleResultsProps) {
  const { selectedClient } = useClientContext()
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set())

  useEffect(() => {
    setExpandedArticles(new Set())
  }, [articles])

  const pairCount = useMemo(() => {
    const sequences = new Set<number>()
    articles.forEach((section) => sequences.add(section.sequence))
    return sequences.size
  }, [articles])

  useEffect(() => {
    setExpandedArticles(new Set(articles.map((article) => article.id)))
  }, [articles])

  const extractTitle = (markdown: string): string => {
    const headingMatch = markdown.match(/^#\s+(.+)$/m)
    if (headingMatch) {
      return headingMatch[1].trim()
    }

    const htmlMatch = markdown.match(/<h1[^>]*>(.*?)<\/h1>/i)
    if (htmlMatch) {
      return htmlMatch[1].replace(/<[^>]*>/g, "").trim()
    }

    const firstLine = markdown.split("\n").find((line) => line.trim().length > 0)
    return firstLine ? firstLine.trim() : "Generated Article"
  }

  const transformMarkdown = (markdown: string): string => {
    let cleaned = markdown.replace(/^\s*DO NOT wrap in ```html```\s*/i, "").trim()

    const fenceMatch = cleaned.match(/^```(\w+)?\n([\s\S]*)\n```$/)
    if (fenceMatch) {
      const language = fenceMatch[1]?.toLowerCase()
      if (!language || ["markdown", "md", "html"].includes(language)) {
        cleaned = fenceMatch[2].trim()
      }
    }

    return cleaned
  }

  const createPreview = (markdown: string, maxLength = 220): string => {
    const text = markdown
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/[#*_`~>\-\[\]\(\)!]/g, "")
      .replace(/\s+/g, " ")
      .trim()

    if (text.length <= maxLength) return text
    return `${text.substring(0, maxLength).trim()}…`
  }

  const convertContentToHtml = async (content: string, containsHtml: boolean): Promise<string> => {
    if (containsHtml) {
      return sanitizeHtml(content)
    }

    const container = document.createElement("div")
    container.style.position = "absolute"
    container.style.left = "-9999px"
    document.body.appendChild(container)

    const root = createRoot(container)

    await new Promise<void>((resolve) => {
      root.render(
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      )
      requestAnimationFrame(() => resolve())
    })

    const html = container.innerHTML
    root.unmount()
    document.body.removeChild(container)
    return html
  }

  const copyToClipboard = async (content: string, id: string, containsHtml: boolean) => {
    try {
      const htmlString = await convertContentToHtml(content, containsHtml)
      await navigator.clipboard.writeText(htmlString)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const downloadArticle = async (content: string, title: string, containsHtml: boolean) => {
    const htmlString = await convertContentToHtml(content, containsHtml)
    const blob = new Blob([htmlString], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Group articles by sequence (article + FAQ together)
  const groupedArticles = useMemo(() => {
    const groups = new Map<number, { article?: ArticleSection; faq?: ArticleSection }>()
    
    articles.forEach(section => {
      const existing = groups.get(section.sequence) || {}
      if (section.kind === 'article') {
        existing.article = section
      } else if (section.kind === 'faq') {
        existing.faq = section
      }
      groups.set(section.sequence, existing)
    })
    
    return Array.from(groups.entries()).sort((a, b) => a[0] - b[0])
  }, [articles])

  const saveArticlePair = async (sequence: number, articleSection?: ArticleSection, faqSection?: ArticleSection) => {
    if (!selectedClient) {
      alert('Selecteer eerst een client om het artikel op te slaan')
      return
    }

    if (!articleSection && !faqSection) {
      alert('Geen content om op te slaan')
      return
    }

    try {
      setSavingId(`seq-${sequence}`)
      
      const articleContent = articleSection ? transformMarkdown(articleSection.html) : null
      const faqContent = faqSection ? transformMarkdown(faqSection.html) : null
      const title = articleSection?.title || faqSection?.title || 'Untitled'
      
      const response = await apiClient('/api/articles', {
        method: 'POST',
        body: JSON.stringify({
          client_id: selectedClient.id,
          focus_keyword: metadata?.focusKeyword || title,
          title: title,
          article: articleContent,
          faqs: faqContent,
          meta_title: title,
          country: metadata?.country,
          language: metadata?.language,
          article_type: metadata?.articleType,
          additional_keywords: metadata?.additionalKeywords || [],
          additional_headings: metadata?.additionalHeadings || [],
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSavedId(`seq-${sequence}`)
        setTimeout(() => setSavedId(null), 3000)
        alert(data.message || 'Artikel opgeslagen!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Fout bij opslaan')
      }
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Fout bij opslaan artikel')
    } finally {
      setSavingId(null)
    }
  }

  const markdownComponents = useMemo<Components>(() => ({
    h1: ({ node, className, ...props }) => (
      <h1
        {...props}
        className={cn("text-2xl font-bold mb-4 text-foreground", className)}
      />
    ),
    h2: ({ node, className, ...props }) => (
      <h2
        {...props}
        className={cn("text-xl font-semibold mb-3 mt-6 text-foreground", className)}
      />
    ),
    h3: ({ node, className, ...props }) => (
      <h3
        {...props}
        className={cn("text-lg font-semibold mb-2 mt-4 text-foreground", className)}
      />
    ),
    h4: ({ node, className, ...props }) => (
      <h4
        {...props}
        className={cn("text-base font-semibold mb-2 mt-4 text-foreground", className)}
      />
    ),
    p: ({ node, className, ...props }) => (
      <p
        {...props}
        className={cn("mb-4 leading-relaxed text-foreground", className)}
      />
    ),
    ul: ({ node, className, ...props }) => (
      <ul
        {...props}
        className={cn("mb-4 ml-6 list-disc space-y-2 text-foreground", className)}
      />
    ),
    ol: ({ node, className, ...props }) => (
      <ol
        {...props}
        className={cn("mb-4 ml-6 list-decimal space-y-2 text-foreground", className)}
      />
    ),
    li: ({ node, className, ...props }) => (
      <li
        {...props}
        className={cn("leading-relaxed text-foreground", className)}
      />
    ),
    blockquote: ({ node, className, ...props }) => (
      <blockquote
        {...props}
        className={cn(
          "border-l-4 border-primary/40 pl-4 italic text-muted-foreground mb-4",
          className,
        )}
      />
    ),
    strong: ({ node, className, ...props }) => (
      <strong
        {...props}
        className={cn("font-semibold text-foreground", className)}
      />
    ),
    em: ({ node, className, ...props }) => (
      <em
        {...props}
        className={cn("italic text-foreground", className)}
      />
    ),
    a: ({ node, className, ...props }) => (
      <a
        {...props}
        className={cn(
          "text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/80 hover:decoration-primary",
          className,
        )}
        target={props.target ?? "_blank"}
        rel={props.rel ?? "noopener noreferrer"}
      />
    ),
    code: ({ node, className, children, ...props }: any) => {
      const content = String(children).replace(/\n$/, "")
      const inline = !className?.includes('language-')
      if (inline) {
        return (
          <code
            {...props}
            className={cn("rounded bg-muted px-1.5 py-0.5 text-sm text-foreground", className)}
          >
            {content}
          </code>
        )
      }

      return (
        <pre className={cn("rounded-lg bg-muted px-4 py-3 text-sm text-foreground overflow-x-auto", className)}>
          <code {...props}>{content}</code>
        </pre>
      )
    },
  }), [])

  const toggleExpanded = (articleId: string) => {
    setExpandedArticles((prev) => {
      const next = new Set(prev)
      if (next.has(articleId)) {
        next.delete(articleId)
      } else {
        next.add(articleId)
      }
      return next
    })
  }


  return (
    <div className="space-y-6 fade-in-up">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-bold">Artikelen Succesvol Gegenereerd!</h2>
        </div>
        <p className="text-muted-foreground">
          Je AI-gestuurde content is klaar. {pairCount} artikel{pairCount !== 1 ? 'en' : ''} geoptimaliseerd voor SEO en afgestemd op jouw specificaties.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1">
        {groupedArticles.map(([sequence, { article, faq }]) => {
          const title = article?.title || faq?.title || 'Untitled'
          const markdownClass = cn(
            "prose prose-sm max-w-none dark:prose-invert",
            "prose-headings:text-foreground prose-headings:font-bold prose-headings:leading-tight",
            "prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0",
            "prose-h2:text-xl prose-h2:mb-3 prose-h2:mt-6",
            "prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-4",
            "prose-li:text-foreground prose-li:mb-1",
            "prose-ul:mb-4 prose-ul:pl-6",
            "prose-strong:text-foreground prose-strong:font-semibold",
            "prose-em:text-foreground",
            "prose-blockquote:text-muted-foreground prose-blockquote:border-primary",
            "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic"
          )

          // Prepare article content
          const articleMarkdown = article ? transformMarkdown(article.html) : null
          const articleContainsHtml = articleMarkdown ? /<\/?[a-z][\s\S]*>/i.test(articleMarkdown) : false
          const articlePreview = articleMarkdown ? createPreview(articleMarkdown) : null
          const articleExpanded = article ? expandedArticles.has(article.id) : false

          // Prepare FAQ content
          const faqMarkdown = faq ? transformMarkdown(faq.html) : null
          const faqContainsHtml = faqMarkdown ? /<\/?[a-z][\s\S]*>/i.test(faqMarkdown) : false
          const faqPreview = faqMarkdown ? createPreview(faqMarkdown) : null
          const faqExpanded = faq ? expandedArticles.has(faq.id) : false

          return (
            <Card
              key={`seq-${sequence}`}
              className="group hover:shadow-lg transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <Badge variant="secondary" className="text-xs">
                      Artikel {sequence}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg text-balance leading-tight">{title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Article + FAQ side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Article Section */}
                  {article && articleMarkdown && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Artikel
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleExpanded(article.id)}
                        >
                          {articleExpanded ? (
                            <><ChevronDown className="h-3 w-3 mr-1" /> Inklappen</>
                          ) : (
                            <><ChevronRight className="h-3 w-3 mr-1" /> Uitklappen</>
                          )}
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4 bg-background/50">
                        {articleExpanded ? (
                          articleContainsHtml ? (
                            <HtmlSection html={articleMarkdown} className={markdownClass} />
                          ) : (
                            <div className={markdownClass}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {articleMarkdown}
                              </ReactMarkdown>
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {articlePreview}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyToClipboard(articleMarkdown, article.id, articleContainsHtml)}
                        >
                          {copiedId === article.id ? (
                            <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3 mr-1" /> Copy</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => downloadArticle(articleMarkdown, `${title} - Article`, articleContainsHtml)}
                        >
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* FAQ Section */}
                  {faq && faqMarkdown && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          FAQ
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleExpanded(faq.id)}
                        >
                          {faqExpanded ? (
                            <><ChevronDown className="h-3 w-3 mr-1" /> Inklappen</>
                          ) : (
                            <><ChevronRight className="h-3 w-3 mr-1" /> Uitklappen</>
                          )}
                        </Button>
                      </div>

                      <div className="border rounded-lg p-4 bg-background/50">
                        {faqExpanded ? (
                          faqContainsHtml ? (
                            <HtmlSection html={faqMarkdown} className={markdownClass} />
                          ) : (
                            <div className={markdownClass}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                {faqMarkdown}
                              </ReactMarkdown>
                            </div>
                          )
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faqPreview}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyToClipboard(faqMarkdown, faq.id, faqContainsHtml)}
                        >
                          {copiedId === faq.id ? (
                            <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied!</>
                          ) : (
                            <><Copy className="w-3 h-3 mr-1" /> Copy</>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => downloadArticle(faqMarkdown, `${title} - FAQ`, faqContainsHtml)}
                        >
                          <Download className="w-3 h-3 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Single Save Button for both */}
                <div className="pt-4 border-t">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full"
                    onClick={() => saveArticlePair(sequence, article, faq)}
                    disabled={savingId === `seq-${sequence}` || !selectedClient}
                  >
                    {savingId === `seq-${sequence}` ? (
                      <>
                        <Save className="w-4 h-4 mr-2 animate-pulse" />
                        Opslaan...
                      </>
                    ) : savedId === `seq-${sequence}` ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                        Opgeslagen!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {selectedClient ? `Opslaan voor ${selectedClient.naam}` : 'Selecteer client'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
