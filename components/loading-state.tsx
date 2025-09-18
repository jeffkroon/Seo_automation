import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Brain, FileText, Sparkles } from "lucide-react"

export function LoadingState() {
  return (
    <div className="space-y-6 fade-in-up">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="relative">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="absolute inset-0 w-8 h-8 border-2 border-primary/20 rounded-full animate-pulse"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-primary">AI Engine Processing</h3>
              <p className="text-sm text-muted-foreground">Analyzing your parameters and generating content...</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="absolute inset-0 shimmer"></div>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                {i === 1 && <Brain className="w-5 h-5 text-primary" />}
                {i === 2 && <FileText className="w-5 h-5 text-primary" />}
                {i === 3 && <Sparkles className="w-5 h-5 text-primary" />}
                <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-4/5 animate-pulse"></div>
                <div className="h-3 bg-muted rounded w-3/5 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
