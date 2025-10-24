"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [invitationData, setInvitationData] = useState<any>(null)
  const [isInvited, setIsInvited] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Check for invitation token on mount
  useEffect(() => {
    if (token) {
      fetchInvitationData()
    }
  }, [token])

  const fetchInvitationData = async () => {
    try {
      const response = await fetch(`/api/auth/invitation?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setInvitationData(data.invitation)
        setIsInvited(true)
        setEmail(data.invitation.email)
        setCompanyName(data.invitation.company_name)
      }
    } catch (error) {
      console.error("Error fetching invitation:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords don't match")
      return
    }

    setIsLoading(true)
    try {
      if (isInvited && token) {
        // Use invitation-based registration
        await registerWithInvitation(email, password, token)
      } else {
        // Regular registration
        await register(email, password, companyName)
      }
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Registration failed:", error)
      if (error.message === "EMAIL_VERIFICATION_REQUIRED") {
        alert("Registratie succesvol! Check je email voor de verificatie link en klik erop voordat je kunt inloggen.")
        router.push("/auth/login")
      } else {
        alert("Registratie mislukt: " + (error.message || "Onbekende fout"))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const registerWithInvitation = async (email: string, password: string, token: string) => {
    const response = await fetch('/api/auth/register-with-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, token })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Registration failed')
    }
    
    const data = await response.json()
    
    // Check if email verification is required
    if (data.error === 'EMAIL_VERIFICATION_REQUIRED') {
      throw new Error('EMAIL_VERIFICATION_REQUIRED')
    }
    
    return data
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isInvited ? "Complete Your Invitation" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {isInvited 
            ? `You've been invited to join ${invitationData?.company_name}` 
            : "Start your free trial today"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isInvited && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <p className="text-sm text-orange-700">
              <strong>Invitation Details:</strong><br />
              Email: {invitationData?.email}<br />
              Company: {invitationData?.company_name}<br />
              Role: {invitationData?.role === 'admin' ? 'Admin' : 'User'}
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isInvited && (
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                type="text"
                placeholder="Your Company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly={isInvited}
              className={isInvited ? "bg-gray-50" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-orange-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
