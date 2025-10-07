"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

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
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Get user's companies and memberships
          const { data: memberships } = await supabase
            .from('memberships')
            .select(`
              role,
              companies (
                id,
                name
              )
            `)
            .eq('user_id', session.user.id)

          if (memberships && memberships.length > 0) {
            const firstMembership = memberships[0]
            const user: User = {
              id: session.user.id,
              email: session.user.email!,
              companyId: firstMembership.companies.id,
              companyName: firstMembership.companies.name,
              role: firstMembership.role as "admin" | "user",
            }
            setUser(user)
            localStorage.setItem("seo-factory-user", JSON.stringify(user))
          }
        } else {
          // Check localStorage as fallback
          const savedUser = localStorage.getItem("seo-factory-user")
          if (savedUser) {
            setUser(JSON.parse(savedUser))
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        // Fallback to localStorage
        const savedUser = localStorage.getItem("seo-factory-user")
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Use Supabase Auth for real authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Get user's companies and memberships
      const { data: memberships } = await supabase
        .from('memberships')
        .select(`
          role,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', data.user.id)

      if (!memberships || memberships.length === 0) {
        throw new Error('No company membership found')
      }

      // Use first company for now (later add company switcher)
      const firstMembership = memberships[0]
      const user: User = {
        id: data.user.id,
        email: data.user.email!,
        companyId: firstMembership.companies.id,
        companyName: firstMembership.companies.name,
        role: firstMembership.role as "admin" | "user",
      }

      setUser(user)
      localStorage.setItem("seo-factory-user", JSON.stringify(user))
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, companyName: string) => {
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          domain: `${companyName.toLowerCase().replace(/\s+/g, '')}.com`, // Generate domain from company name
          created_by: authData.user.id,
        })
        .select()
        .single()

      if (companyError) throw companyError

      // Create membership (user becomes owner of the company)
      const { error: membershipError } = await supabase
        .from('memberships')
        .insert({
          user_id: authData.user.id,
          company_id: company.id,
          role: 'owner',
        })

      if (membershipError) throw membershipError

      const user: User = {
        id: authData.user.id,
        email: authData.user.email!,
        companyId: company.id,
        companyName: company.name,
        role: "admin", // Owner has admin rights
      }

      setUser(user)
      localStorage.setItem("seo-factory-user", JSON.stringify(user))
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
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
