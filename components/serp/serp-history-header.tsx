import { Button } from "@/components/ui/button"
import { Download, Filter } from "lucide-react"
import Link from "next/link"

export function SerpHistoryHeader() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
              Dashboard
            </Link>
            <span className="text-slate-400">/</span>
            <Link href="/dashboard/serp" className="text-sm text-slate-600 hover:text-slate-900">
              SERP Analysis
            </Link>
            <span className="text-slate-400">/</span>
            <h1 className="text-lg font-semibold text-slate-900">History</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
