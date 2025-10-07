"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  id: string
  email: string
  companyId: string
  companyName: string
  role: "admin" | "user"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, companyName: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem("seo-factory-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Mock authentication - replace with real auth later
    const mockUser: User = {
      id: "1",
      email,
      companyId: "company-1",
      companyName: "Demo Company",
      role: "admin",
    }

    setUser(mockUser)
    localStorage.setItem("seo-factory-user", JSON.stringify(mockUser))
  }

  const register = async (email: string, password: string, companyName: string) => {
    // Mock registration - replace with real auth later
    const mockUser: User = {
      id: "1",
      email,
      companyId: "company-1",
      companyName,
      role: "admin",
    }

    setUser(mockUser)
    localStorage.setItem("seo-factory-user", JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("seo-factory-user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
