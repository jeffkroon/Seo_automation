"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  companyId: string
  companyName: string
  role: "owner" | "admin" | "user" | "viewer"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, companyName: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const PENDING_COMPANY_STORAGE_KEY = "seo-factory-pending-company"

type PendingCompany = {
  name: string
  domain: string
}

const generateCompanyDomain = (companyName: string) => {
  const sanitized = companyName.toLowerCase().replace(/[^a-z0-9]/g, "")
  return sanitized.length > 0 ? `${sanitized}.com` : "company.com"
}

const getPendingCompanyFromStorage = (): PendingCompany | null => {
  if (typeof window === "undefined") return null

  try {
    const raw = window.localStorage.getItem(PENDING_COMPANY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingCompany
    if (!parsed?.name) return null
    return parsed
  } catch (error) {
    console.error("Failed to parse pending company from storage:", error)
    return null
  }
}

const setPendingCompanyInStorage = (pending: PendingCompany) => {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(PENDING_COMPANY_STORAGE_KEY, JSON.stringify(pending))
  } catch (error) {
    console.warn("Unable to persist pending company information:", error)
  }
}

const clearPendingCompanyInStorage = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(PENDING_COMPANY_STORAGE_KEY)
}

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

      // Check if email is confirmed
      if (!data.user.email_confirmed_at) {
        throw new Error('EMAIL_NOT_CONFIRMED')
      }

      // Get user's companies and memberships
      let { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          role,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', data.user.id)

      if (membershipsError) {
        throw membershipsError
      }

      if (!memberships || memberships.length === 0) {
        const pendingCompany =
          data.user.user_metadata?.pending_company_name
            ? {
                name: String(data.user.user_metadata.pending_company_name),
                domain:
                  String(data.user.user_metadata.pending_company_domain ?? "") ||
                  generateCompanyDomain(String(data.user.user_metadata.pending_company_name)),
              }
            : getPendingCompanyFromStorage()

        if (!pendingCompany?.name) {
          throw new Error('No company membership found')
        }

        const { data: company, error: companyError } = await supabase
          .from('companies')
          .insert({
            name: pendingCompany.name,
            domain: pendingCompany.domain,
            created_by: data.user.id,
          })
          .select()
          .single()

        if (companyError) {
          console.error('Company creation error:', companyError)
          throw new Error('Kon geen bedrijf aanmaken voor deze gebruiker')
        }

        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: data.user.id,
            company_id: company.id,
            role: 'owner',
          })

        if (membershipError) {
          console.error('Membership creation error:', membershipError)
          throw new Error('Kon geen membership aanmaken voor deze gebruiker')
        }

        clearPendingCompanyInStorage()

        const refetched = await supabase
          .from('memberships')
          .select(`
            role,
            companies (
              id,
              name
            )
          `)
          .eq('user_id', data.user.id)

        if (refetched.error) {
          console.error('Membership lookup error after creation:', refetched.error)
          throw new Error('Kon membership gegevens niet ophalen')
        }

        memberships = refetched.data ?? []

        if (!memberships.length) {
          throw new Error('No company membership found')
        }
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
      // Register user with Supabase Auth - REQUIRE email verification
      const normalizedEmail = email.trim().toLowerCase()
      const normalizedCompanyName = companyName.trim()
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/auth/callback`
      const generatedDomain = generateCompanyDomain(normalizedCompanyName)

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo.startsWith('http') ? redirectTo : undefined,
          data: {
            pending_company_name: normalizedCompanyName,
            pending_company_domain: generatedDomain,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      setPendingCompanyInStorage({
        name: normalizedCompanyName,
        domain: generatedDomain,
      })

      if (!authData.session) {
        throw new Error('EMAIL_VERIFICATION_REQUIRED')
      }

      await login(normalizedEmail, password)
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
