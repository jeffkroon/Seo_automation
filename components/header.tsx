import Link from "next/link"
import { Sparkles, Zap } from "lucide-react"

export function Header() {
  return (
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                <Zap className="w-2.5 h-2.5 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold">SEO Automation</h1>
              <p className="text-sm text-muted-foreground">AI-Gestuurde SEO Content</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Generator
            </Link>
            <Link href="/schedules" className="hover:text-foreground transition-colors">
              Schedules
            </Link>

            <div className="flex items-center space-x-2 text-xs uppercase tracking-wide text-green-500/90">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI Engine Actief</span>
            </div>
          </nav>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 md:hidden text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Generator
            </Link>
            <Link href="/schedules" className="hover:text-foreground transition-colors">
              Schedules
            </Link>
          </div>
          <div className="flex items-center space-x-2 text-xs uppercase tracking-wide text-green-500/90">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>AI Engine Actief</span>
          </div>
        </div>
      </div>
    </header>
  )
}
