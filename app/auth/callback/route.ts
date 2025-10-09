import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('=== CALLBACK ROUTE CALLED ===')
  console.log('Request URL:', request.url)
  
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const email = searchParams.get('email')
  const next = searchParams.get('next') ?? '/dashboard'
  
  console.log('URL params:', { code: code?.substring(0, 10) + '...', token: token?.substring(0, 10) + '...', type, email, next })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Handle code-based verification (newer Supabase flow)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to dashboard after successful auth
      return NextResponse.redirect(`https://lionfish-app-es8ks.ondigitalocean.app${next}`)
    }
  }

  // Handle token-based verification (Supabase email verification flow)
  if (token && type === 'signup' && email) {
    try {
      console.log('Attempting token verification for:', { token: token.substring(0, 10) + '...', type, email })
      
      // Use verifyOtp for email verification tokens
      const { data, error } = await supabase.auth.verifyOtp({
        token: token,
        type: 'signup',
        email: email
      })
      
      console.log('Token verification result:', { 
        success: !error, 
        error: error?.message,
        hasUser: !!data?.user,
        userId: data?.user?.id 
      })
      
      if (!error && data.user) {
        console.log('Token verification successful, redirecting to dashboard')
        // Redirect to dashboard after successful verification
        return NextResponse.redirect(`https://lionfish-app-es8ks.ondigitalocean.app${next}`)
      } else {
        console.log('Token verification failed:', error?.message)
      }
    } catch (error) {
      console.error('Token verification error:', error)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`https://lionfish-app-es8ks.ondigitalocean.app/auth/auth-code-error`)
}
