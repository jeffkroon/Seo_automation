"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Building2, ChevronDown } from "lucide-react"

interface Company {
  id: string
  name: string
  role: string
}

export function CompanySwitcher() {
  const { user, login } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load user's companies when component mounts
    loadUserCompanies()
  }, [])

  const loadUserCompanies = async () => {
    if (!user?.id) return

    try {
      // For now, just use the current user's company
      // Later we can implement multi-company support
      if (user.companyId && user.companyName) {
        setCompanies([{
          id: user.companyId,
          name: user.companyName,
          role: user.role
        }])
      }
    } catch (error) {
      console.error('Failed to load companies:', error)
    }
  }

  const handleCompanyChange = async (companyId: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      // Update localStorage with new company
      const updatedUser = { ...user, companyId }
      localStorage.setItem("seo-factory-user", JSON.stringify(updatedUser))
      
      // Reload the page to update all components with new company context
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch company:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex items-center space-x-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select 
        value={user.companyId} 
        onValueChange={handleCompanyChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select company" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company) => (
            <SelectItem key={company.id} value={company.id}>
              <div className="flex flex-col">
                <span className="font-medium">{company.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {company.role}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
