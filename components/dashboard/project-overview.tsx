import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, MoreHorizontal } from "lucide-react"

const projects = [
  {
    name: "E-commerce Store",
    domain: "example-store.com",
    keywords: 234,
    avgRank: 8.2,
    status: "active",
    lastUpdate: "2 hours ago",
  },
  {
    name: "Tech Blog",
    domain: "techblog.example.com",
    keywords: 156,
    avgRank: 12.5,
    status: "active",
    lastUpdate: "1 day ago",
  },
  {
    name: "Local Business",
    domain: "localbiz.com",
    keywords: 89,
    avgRank: 6.8,
    status: "paused",
    lastUpdate: "3 days ago",
  },
]

export function ProjectOverview() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Projects</CardTitle>
          <CardDescription>Manage your SEO campaigns</CardDescription>
        </div>
        <Button size="sm">Add Project</Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.name}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-slate-900">{project.name}</h3>
                  <Badge variant={project.status === "active" ? "default" : "secondary"}>{project.status}</Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-slate-500">
                  <span className="flex items-center space-x-1">
                    <ExternalLink className="h-3 w-3" />
                    <span>{project.domain}</span>
                  </span>
                  <span>{project.keywords} keywords</span>
                  <span>Avg rank: {project.avgRank}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Updated {project.lastUpdate}</p>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
