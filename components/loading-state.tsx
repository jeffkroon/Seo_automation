import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Brain, FileText, Sparkles, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  status?: string
  completedPairs?: number
  totalPairsHint?: number
  isComplete?: boolean
  lastUpdatedAt?: string
}

export function LoadingState({
  status,
  completedPairs,
  totalPairsHint,
  isComplete,
  lastUpdatedAt,
}: LoadingStateProps) {
  const progressText = (() => {
    if (typeof completedPairs === "number" && completedPairs > 0) {
      if (typeof totalPairsHint === "number" && totalPairsHint > 0) {
        return `${completedPairs}/${totalPairsHint} contentblokken verwerkt`
      }
      return `${completedPairs} contentblok${completedPairs === 1 ? "" : "ken"} ontvangen`
    }
    return "Content generatie gestart"
  })()

  const statusText = status || (isComplete ? "Workflow afgerond" : "Workflow actief")

  const timestampText = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString()
    : undefined

  return (
    <div className="space-y-6 fade-in-up">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                {isComplete ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                ) : (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <div className="absolute inset-0 w-8 h-8 border-2 border-primary/20 rounded-full animate-pulse" />
                  </>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">{statusText}</h3>
                <p className="text-sm text-muted-foreground">{progressText}</p>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-right">
              <div>Live status van de AI workflow</div>
              {timestampText && <div>Laatste update: {timestampText}</div>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className={cn("relative overflow-hidden", isComplete && "opacity-70") }>
            {!isComplete && <div className="absolute inset-0 shimmer"></div>}
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center space-x-2">
                {i === 1 && <Brain className="w-5 h-5 text-primary" />}
                {i === 2 && <FileText className="w-5 h-5 text-primary" />}
                {i === 3 && <Sparkles className="w-5 h-5 text-primary" />}
                <div className={cn(
                  "h-4 bg-muted rounded w-32",
                  isComplete ? "" : "animate-pulse",
                )}></div>
              </div>
              <div className="space-y-2">
                <div className={cn("h-3 bg-muted rounded w-full", isComplete ? "" : "animate-pulse")}></div>
                <div className={cn("h-3 bg-muted rounded w-4/5", isComplete ? "" : "animate-pulse")}></div>
                <div className={cn("h-3 bg-muted rounded w-3/5", isComplete ? "" : "animate-pulse")}></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
