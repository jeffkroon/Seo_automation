"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Bell, Settings, LogOut, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export function DashboardHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold text-slate-900">
              MarketingCompanion
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <Link href="/dashboard/keywords" className="text-sm text-slate-600 hover:text-slate-900">
                Keywords
              </Link>
              <Link href="/dashboard/rankings" className="text-sm text-slate-600 hover:text-slate-900">
                Rankings
              </Link>
              <Link href="/dashboard/serp" className="text-sm text-slate-600 hover:text-slate-900">
                SERP Analysis
              </Link>
              <Link href="/dashboard/content" className="text-sm text-slate-600 hover:text-slate-900">
                Content
              </Link>
              <Link href="/dashboard/scheduler" className="text-sm text-slate-600 hover:text-slate-900">
                Scheduler
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2">
              <Search className="h-4 w-4 text-slate-400" />
              <Input placeholder="Search..." className="w-64 h-8" />
            </div>
            <span className="text-sm text-slate-600 hidden md:block">{user?.companyName}</span>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
