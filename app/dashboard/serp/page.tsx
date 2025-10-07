import { SerpHeader } from "@/components/serp/serp-header"
import { SerpSearch } from "@/components/serp/serp-search"
import { SerpResults } from "@/components/serp/serp-results"
import { SerpAnalytics } from "@/components/serp/serp-analytics"

export default function SerpPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <SerpHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <SerpSearch />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SerpResults />
            </div>
            <SerpAnalytics />
          </div>
        </div>
      </main>
    </div>
  )
}
