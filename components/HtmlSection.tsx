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

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type Props = {
  html?: string | null;
  className?: string;
};

const DEFAULT_CLASSNAME = "prose prose-neutral max-w-none prose-h1:mt-0 prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-a:text-primary prose-blockquote:text-muted-foreground prose-blockquote:border-primary";

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

const hasHtmlTags = /<\/?[a-z][\s\S]*>/i;

export default function HtmlSection({ html, className }: Props) {
  if (!html) return null;

  // Basic sanitization
  const safe = sanitizeHtml(html);
  const wrapperClass = className ?? DEFAULT_CLASSNAME;

  if (!hasHtmlTags.test(safe)) {
    return (
      <div className={wrapperClass}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ node, className: linkClass, ...props }) => (
              <a
                {...props}
                target={props.target ?? "_blank"}
                rel={props.rel ?? "noopener noreferrer"}
                className={cn(
                  "text-primary underline decoration-primary/50 underline-offset-2 hover:text-primary/80 hover:decoration-primary",
                  linkClass,
                )}
              />
            ),
          }}
        >
          {safe}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div
      className={wrapperClass}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
