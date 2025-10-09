import { NextResponse } from 'next/server'
import { createSupabaseRouteClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const searchParams = requestUrl.searchParams
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const email = searchParams.get('email')
  const next = searchParams.get('next') ?? '/dashboard'

  const redirectPath = typeof next === 'string' && next.startsWith('/') ? next : '/dashboard'
  const redirectUrl = new URL(redirectPath, requestUrl.origin)
  const supabase = createSupabaseRouteClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(redirectUrl)
  }

  if (token && type === 'signup' && email) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token,
        type: 'signup',
        email,
      })

      if (!error && (data?.user || data?.session)) {
        return NextResponse.redirect(redirectUrl)
      }
    } catch (error) {
      console.error('Token verification error:', error)
    }
  }

  return NextResponse.redirect(new URL('/auth/auth-code-error', requestUrl.origin))
}
