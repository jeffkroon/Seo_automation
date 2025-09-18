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

          <div className="hidden md:flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>AI Engine Actief</span>
            </div>
            <div>SEO Platform</div>
          </div>
        </div>
      </div>
    </header>
  )
}
