"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Star, TrendingUp, Eye } from "lucide-react"

const mockResults = [
  {
    position: 1,
    title: "Complete Guide to SEO Automation Tools in 2024",
    url: "https://example.com/seo-automation-guide",
    domain: "example.com",
    snippet:
      "Discover the best SEO automation tools to streamline your workflow. From keyword research to rank tracking, learn how to automate your SEO processes effectively.",
    features: ["Featured Snippet"],
    metrics: {
      estimatedTraffic: "12.5K",
      domainAuthority: 78,
      backlinks: "2.3K",
    },
  },
  {
    position: 2,
    title: "Top 10 SEO Automation Software Solutions",
    url: "https://competitor.com/seo-tools",
    domain: "competitor.com",
    snippet:
      "Compare the leading SEO automation platforms. Features, pricing, and reviews of the most popular tools for agencies and businesses.",
    features: ["Video", "Images"],
    metrics: {
      estimatedTraffic: "8.7K",
      domainAuthority: 65,
      backlinks: "1.8K",
    },
  },
  {
    position: 3,
    title: "SEO Automation: Benefits and Best Practices",
    url: "https://blog.seotools.com/automation",
    domain: "seotools.com",
    snippet:
      "Learn how SEO automation can save time and improve results. Best practices for implementing automated SEO workflows in your marketing strategy.",
    features: ["FAQ"],
    metrics: {
      estimatedTraffic: "6.2K",
      domainAuthority: 72,
      backlinks: "945",
    },
  },
  {
    position: 4,
    title: "Free vs Paid SEO Automation Tools Comparison",
    url: "https://marketing.example.org/seo-comparison",
    domain: "marketing.example.org",
    snippet:
      "Detailed comparison of free and paid SEO automation tools. Which option is right for your business? Features, limitations, and recommendations.",
    features: ["Table", "Reviews"],
    metrics: {
      estimatedTraffic: "4.1K",
      domainAuthority: 58,
      backlinks: "672",
    },
  },
]

export function SerpResults() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Search Results</span>
          <Badge variant="secondary">4 results analyzed</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockResults.map((result) => (
            <div key={result.position} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                    {result.position}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 hover:text-orange-600 cursor-pointer">{result.title}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-sm text-green-600">{result.domain}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">{result.snippet}</p>

              {result.features.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Features:</span>
                  {result.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Eye className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">Traffic</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{result.metrics.estimatedTraffic}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Star className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">DA</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{result.metrics.domainAuthority}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-500">Backlinks</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">{result.metrics.backlinks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
