import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create admin client with service role key
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, action } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is verplicht' }, { status: 400 })
    }

    if (action === 'verify') {
      // Manually verify the user's email
      const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      )

      if (error) {
        console.error('Error verifying user:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'User email succesvol geverifieerd!',
        user: data.user
      })
    } else if (action === 'resend') {
      // Get user email first
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
      
      if (userError || !userData.user) {
        console.error('Error fetching user:', userError)
        return NextResponse.json({ error: 'User niet gevonden' }, { status: 404 })
      }

      // Generate a new email confirmation link
      const { data, error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'signup',
        email: userData.user.email!,
      })

      if (error) {
        console.error('Error generating verification link:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Verificatie link gegenereerd!',
        verification_link: data.properties?.action_link,
        email: userData.user.email
      })
    } else {
      return NextResponse.json({ error: 'Ongeldige actie. Gebruik "verify" of "resend"' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error in verify-user:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'

