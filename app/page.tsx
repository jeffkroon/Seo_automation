import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BarChart3, Search, Target, Zap, Users, Clock } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SearchFactory</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
            Professional SEO Automation Platform
          </Badge>
          <h1 className="text-5xl font-bold text-slate-900 mb-6 text-balance">
            Automate Your SEO Workflow with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
              AI-Powered Insights
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-8 text-pretty max-w-2xl mx-auto">
            Scale your SEO operations with automated rank tracking, SERP analysis, content optimization, and
            comprehensive reporting. Built for agencies and professionals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need for SEO Success</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Comprehensive tools to monitor, analyze, and optimize your search engine performance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Rank Tracking</CardTitle>
                <CardDescription>
                  Monitor keyword positions across search engines with historical data and competitor analysis
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>SERP Analysis</CardTitle>
                <CardDescription>
                  Deep dive into search results with competitor insights and SERP feature detection
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Copywriter</CardTitle>
                <CardDescription>
                  AI-powered content creation and optimization with real-time SEO scoring
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Content Optimization</CardTitle>
                <CardDescription>
                  AI-powered content creation and optimization with real-time SEO scoring
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle>Automated Scheduling</CardTitle>
                <CardDescription>
                  Set up recurring tasks for rank checks, SERP analysis, and content audits
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>Multi-user access with role-based permissions and client reporting</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl font-bold text-slate-50 mb-4">Ready to Scale Your SEO Operations?</h2>
          <p className="text-slate-100 mb-8 text-lg">
            Join thousands of SEO professionals who trust SearchFactory to automate their workflows
          </p>
          <Link href="/auth/register">
            <Button size="lg" className="bg-white text-blue-700 hover:bg-slate-50 hover:text-blue-800 font-semibold">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-slate-900 text-slate-400">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
              <Search className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-semibold">SearchFactory</span>
          </div>
          <p>&copy; 2024 SearchFactory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}