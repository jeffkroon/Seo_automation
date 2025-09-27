"use client";

/**
 * HtmlSection component
 * ---------------------
 * Dit component is bedoeld om kant-en-klare HTML-fragments (zoals die uit je webhook komen)
 * netjes te renderen in je frontend.
 *
 * Gebruik:
 *   <HtmlSection html={payload.article} />
 *   <HtmlSection html={payload.faqs} />
 */

type Props = {
  html?: string | null;
  className?: string;
};

function sanitizeHtml(html: string): string {
  // Basic sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove onclick, onload, etc.
    .replace(/javascript:/gi, ''); // Remove javascript: URLs
}

export default function HtmlSection({ html, className }: Props) {
  if (!html) return null;

  // Basic sanitization
  const safe = sanitizeHtml(html);

  return (
    <div
      className={className ?? "prose prose-neutral max-w-none prose-h1:mt-0 prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-blockquote:border-primary"}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
