import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { RankingChart } from "@/components/dashboard/ranking-chart"
import { KeywordPerformance } from "@/components/dashboard/keyword-performance"
import { ProjectOverview } from "@/components/dashboard/project-overview"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Monitor your SEO performance and track key metrics across all projects.</p>
      </div>

      <DashboardStats />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RankingChart />
        <KeywordPerformance />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ProjectOverview />
        </div>
        <RecentActivity />
      </div>
    </div>
  )
}
