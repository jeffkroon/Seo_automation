"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Copy, CheckCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import ReactMarkdown from "react-markdown"
import type { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import HtmlSection, { sanitizeHtml } from "@/components/HtmlSection"
import { cn } from "@/lib/utils"
import { createRoot } from "react-dom/client"

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
}

export function ArticleResults({ articles }: ArticleResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)
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
    code: ({ node, inline, className, children, ...props }) => {
      const content = String(children).replace(/\n$/, "")
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

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {articles.map((article) => {
          const preparedMarkdown = transformMarkdown(article.html)
          const title = article.title || extractTitle(preparedMarkdown)
          const containsHtml = /<\/?[a-z][\s\S]*>/i.test(preparedMarkdown)
          const previewText = createPreview(preparedMarkdown)
          const isExpanded = expandedArticles.has(article.id)
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
          const badgeLabel = article.kind === 'faq'
            ? `FAQ ${article.sequence}`
            : article.kind === 'meta'
              ? `Meta ${article.sequence}`
              : `Artikel ${article.sequence}`

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
                      {badgeLabel}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-lg text-balance leading-tight flex-1">{title}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-medium flex items-center gap-1"
                    onClick={() => toggleExpanded(article.id)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronDown className="h-4 w-4" /> Inklappen
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" /> Uitklappen
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {isExpanded ? (
                  containsHtml ? (
                    <HtmlSection html={preparedMarkdown} className={markdownClass} />
                  ) : (
                    <div className={markdownClass}>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {preparedMarkdown}
                      </ReactMarkdown>
                    </div>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {previewText}
                  </p>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start bg-transparent"
                    onClick={() => copyToClipboard(preparedMarkdown, article.id, containsHtml)}
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
                    onClick={() => downloadArticle(preparedMarkdown, title, containsHtml)}
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
