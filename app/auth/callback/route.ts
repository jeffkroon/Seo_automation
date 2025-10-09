import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

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

  // Handle token-based verification (older Supabase flow)
  if (token && type === 'signup') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'signup'
    })

    if (!error && data.user) {
      // Redirect to dashboard after successful verification
      return NextResponse.redirect(`https://lionfish-app-es8ks.ondigitalocean.app${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`https://lionfish-app-es8ks.ondigitalocean.app/auth/auth-code-error`)
}
