"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export function EmailConfirm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Check if this is a Supabase auth callback
        const code = searchParams.get('code')
        const token = searchParams.get('token')
        const type = searchParams.get('type')

        console.log('Email confirm params:', { code, token, type })

        // Handle Supabase auth callback with code
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('Code exchange error:', error)
            setStatus('error')
            setMessage('Verificatie mislukt. De link is mogelijk verlopen of al gebruikt.')
            return
          }

          if (data.user) {
            setStatus('success')
            setMessage('Email succesvol geverifieerd! Je wordt doorgestuurd naar de dashboard.')
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push('/dashboard')
            }, 3000)
            return
          }
        }

        // Handle OTP verification
        if (token && type === 'signup') {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          })

          if (error) {
            console.error('OTP verification error:', error)
            setStatus('error')
            setMessage('Verificatie mislukt. De link is mogelijk verlopen of al gebruikt.')
            return
          }

          if (data.user) {
            setStatus('success')
            setMessage('Email succesvol geverifieerd! Je kunt nu inloggen.')
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              router.push('/auth/login')
            }, 3000)
            return
          }
        }

        // No valid parameters found
        setStatus('error')
        setMessage('Ongeldige verificatie link.')
      } catch (error) {
        console.error('Unexpected error:', error)
        setStatus('error')
        setMessage('Er is een onverwachte fout opgetreden.')
      }
    }

    confirmEmail()
  }, [searchParams, router])

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          {status === 'loading' && (
            <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle className="h-12 w-12 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="h-12 w-12 text-red-500" />
          )}
        </div>
        <CardTitle>
          {status === 'loading' && 'Email wordt geverifieerd...'}
          {status === 'success' && 'Email Geverifieerd!'}
          {status === 'error' && 'Verificatie Mislukt'}
        </CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === 'success' && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Je wordt automatisch doorgestuurd naar de login pagina...
            </p>
            <Button asChild>
              <Link href="/auth/login">
                Direct naar Login
              </Link>
            </Button>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-2">
            <Button asChild>
              <Link href="/auth/login">
                Terug naar Login
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/auth/register">
                Opnieuw Registreren
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
