"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createRoot } from "react-dom/client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, RefreshCw, ChevronDown, ChevronRight, Trash2, MessageSquare, Download, Copy, CheckCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import HtmlSection, { sanitizeHtml } from "@/components/HtmlSection"
import { cn } from "@/lib/utils"

interface ScheduleCardProps {
  schedule: any
  onRefresh?: () => void
}

function formatPreview(markdown?: string, length = 220) {
  if (!markdown) return ''
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`~>\-\[\]\(\)!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= length) return text
  return `${text.slice(0, length).trim()}…`
}

function transformMarkdown(markdown?: string): string {
  if (!markdown) return ''
  let cleaned = markdown.replace(/^\s*DO NOT wrap in ```html```\s*/i, '').trim()
  const fenceMatch = cleaned.match(/^```(\w+)?\n([\s\S]*)\n```$/)
  if (fenceMatch) {
    const language = fenceMatch[1]?.toLowerCase()
    if (!language || ["markdown", "md", "html"].includes(language)) {
      cleaned = fenceMatch[2].trim()
    }
  }
  return cleaned
}

export function ScheduleCard({ schedule, onRefresh }: ScheduleCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [articleExpanded, setArticleExpanded] = useState(false)
  const [faqExpanded, setFaqExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

 const latest = schedule.latestArticle ?? null
  const articlePreview = latest?.article ? formatPreview(latest.article) : null
  const faqPreview = latest?.faqs ? formatPreview(latest.faqs) : null
  const intervalHours = schedule.interval_seconds
    ? Math.max(schedule.interval_seconds / 3600, 0.1)
    : null
  const lastRun = schedule.last_run_at || latest?.generated_at
  const preparedMarkdown = transformMarkdown(latest?.article)
  const preparedFaqMarkdown = transformMarkdown(latest?.faqs)
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(preparedMarkdown)
  const faqContainsHtml = /<\/?[a-z][\s\S]*>/i.test(preparedFaqMarkdown)
  const extraKeywords: string[] = Array.isArray(schedule.extra_keywords)
    ? schedule.extra_keywords
    : typeof schedule.extra_keywords === 'string'
      ? schedule.extra_keywords.split(',').map((k: string) => k.trim()).filter(Boolean)
      : []
  
  const extraHeadings: string[] = Array.isArray(schedule.extra_headings)
    ? schedule.extra_headings.filter(Boolean)
    : typeof schedule.extra_headings === 'string'
      ? schedule.extra_headings
          .replace(/^\[|\]$/g, '') // Remove outer brackets
          .split(/",\s*"/) // Split on ", " pattern
          .map((h: string) => h.replace(/^"|"$/g, '').trim()) // Remove quotes and trim
          .filter(Boolean)
      : []

  const markdownClass = useMemo(
    () => cn(
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
    ),
    [],
  )

  const markdownComponents = useMemo(() => ({
    h1: ({ node, className, ...props }: any) => (
      <h1
        {...props}
        className={cn("text-2xl font-bold mb-4 text-foreground", className)}
      />
    ),
    h2: ({ node, className, ...props }: any) => (
      <h2
        {...props}
        className={cn("text-xl font-semibold mb-3 mt-6 text-foreground", className)}
      />
    ),
    h3: ({ node, className, ...props }: any) => (
      <h3
        {...props}
        className={cn("text-lg font-semibold mb-2 mt-4 text-foreground", className)}
      />
    ),
    h4: ({ node, className, ...props }: any) => (
      <h4
        {...props}
        className={cn("text-base font-semibold mb-2 mt-4 text-foreground", className)}
      />
    ),
    p: ({ node, className, ...props }: any) => (
      <p
        {...props}
        className={cn("mb-4 leading-relaxed text-foreground", className)}
      />
    ),
    ul: ({ node, className, ...props }: any) => (
      <ul
        {...props}
        className={cn("mb-4 ml-6 list-disc space-y-2 text-foreground", className)}
      />
    ),
    ol: ({ node, className, ...props }: any) => (
      <ol
        {...props}
        className={cn("mb-4 ml-6 list-decimal space-y-2 text-foreground", className)}
      />
    ),
    li: ({ node, className, ...props }: any) => (
      <li
        {...props}
        className={cn("leading-relaxed text-foreground", className)}
      />
    ),
    blockquote: ({ node, className, ...props }: any) => (
      <blockquote
        {...props}
        className={cn(
          "border-l-4 border-primary/40 pl-4 italic text-muted-foreground mb-4",
          className,
        )}
      />
    ),
    strong: ({ node, className, ...props }: any) => (
      <strong
        {...props}
        className={cn("font-semibold text-foreground", className)}
      />
    ),
    em: ({ node, className, ...props }: any) => (
      <em
        {...props}
        className={cn("italic text-foreground", className)}
      />
    ),
    a: ({ node, className, ...props }: any) => (
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
    code: ({ node, inline, className, children, ...props }: any) => {
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

  async function toggleActive(value: boolean) {
    await fetch(`/api/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: value }),
    })

    if (onRefresh) {
      onRefresh()
    } else {
      startTransition(() => router.refresh())
    }
  }

  async function handleDelete() {
    if (!window.confirm('Weet je zeker dat je dit schedule wilt verwijderen?')) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' })
      if (!res.ok) {
        console.error('Failed to delete schedule', await res.text())
        return
      }
      if (onRefresh) {
        onRefresh()
      } else {
        startTransition(() => router.refresh())
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="border border-primary/10 bg-[#f5f0ff]">
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="capitalize">
              {schedule.active ? 'actief' : 'inactief'}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {schedule.id}
          </span>
        </div>
        <CardTitle className="text-xl">
          {schedule.focus_keyword || schedule.keyword || 'Onbekend keyword'}
        </CardTitle>
        <dl className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <dt className="font-medium text-foreground">Interval</dt>
            <dd>{intervalHours ? `${intervalHours.toFixed(1)} uur` : '–'}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Land / taal</dt>
            <dd>{schedule.country ?? '–'} · {schedule.language ?? '–'}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Laatste run</dt>
            <dd>{lastRun ? new Date(lastRun).toLocaleString() : '–'}</dd>
          </div>
        </dl>
        {extraKeywords.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Extra zoekwoorden:</span>
            {extraKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-muted px-2 py-1">
                {keyword}
              </span>
            ))}
          </div>
        )}
        {extraHeadings.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Extra headings:</span>
            {extraHeadings.map((heading, index) => (
              <span key={index} className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">
                {heading}
              </span>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch id={`active-${schedule.id}`} checked={!!schedule.active} onCheckedChange={toggleActive} disabled={isPending} />
            <label htmlFor={`active-${schedule.id}`}>Schedule actief</label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                const params = new URLSearchParams({ focusKeyword: schedule.focus_keyword || schedule.keyword || '' })
                router.push(`/?${params.toString()}`)
              }}
            >
              <RefreshCw className="h-4 w-4" /> Nieuwe run
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-2"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" /> Verwijderen
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Laatste artikel</h3>
          {!preparedMarkdown ? (
            <p className="text-sm text-muted-foreground">Nog geen artikel ontvangen.</p>
          ) : (
            <div className="space-y-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium flex items-center gap-1"
                onClick={() => setArticleExpanded((prev) => !prev)}
              >
                {articleExpanded ? (
                  <>
                    <ChevronDown className="h-4 w-4" /> Inklappen
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4" /> Uitklappen
                  </>
                )}
              </Button>
              {articleExpanded ? (
                <div className="space-y-4">
                  <div className={markdownClass}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {preparedMarkdown}
                    </ReactMarkdown>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 justify-start bg-transparent"
                      onClick={() => copyToClipboard(preparedMarkdown, `${schedule.id}-article`, containsHtml)}
                    >
                      {copiedId === `${schedule.id}-article` ? (
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
                      className="flex-1 justify-start bg-transparent"
                      onClick={() => downloadArticle(preparedMarkdown, `Artikel ${schedule.focus_keyword || schedule.keyword || 'Onbekend'}`, containsHtml)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Downloaden
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-muted-foreground">{articlePreview}</p>
              )}
            </div>
          )}
        </div>

        {preparedFaqMarkdown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Veelgestelde vragen
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium flex items-center gap-1"
                onClick={() => setFaqExpanded((prev) => !prev)}
              >
                {faqExpanded ? (
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
            {faqExpanded ? (
              <div className="space-y-4">
                {faqContainsHtml ? (
                  <HtmlSection html={preparedFaqMarkdown} className={markdownClass} />
                ) : (
                  <div className={markdownClass}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {preparedFaqMarkdown}
                    </ReactMarkdown>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-start bg-transparent"
                    onClick={() => copyToClipboard(preparedFaqMarkdown, `${schedule.id}-faq`, faqContainsHtml)}
                  >
                    {copiedId === `${schedule.id}-faq` ? (
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
                    className="flex-1 justify-start bg-transparent"
                    onClick={() => downloadArticle(preparedFaqMarkdown, `FAQ ${schedule.focus_keyword || schedule.keyword || 'Onbekend'}`, faqContainsHtml)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Downloaden
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">{faqPreview}</p>
            )}
          </div>
        )}

        {(latest?.meta_title || latest?.meta_description) && (
          <div className="space-y-2 border-t pt-3">
            <h3 className="text-sm font-semibold text-muted-foreground">SEO meta</h3>
            {latest?.meta_title && (
              <p className="text-sm text-foreground">
                <span className="font-medium">Titel:</span> {latest.meta_title}
              </p>
            )}
            {latest?.meta_description && (
              <p className="text-sm text-foreground">
                <span className="font-medium">Beschrijving:</span> {latest.meta_description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
