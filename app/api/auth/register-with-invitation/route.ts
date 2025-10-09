import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { supabaseRest } from '@/lib/supabase-rest'

export async function POST(req: Request) {
  try {
    const { email, password, token } = await req.json()
    
    if (!email || !password || !token) {
      return NextResponse.json({ error: 'Email, password en token zijn verplicht' }, { status: 400 })
    }

    // First, verify the invitation token
    const invitations = await supabaseRest<any[]>(
      'invitations',
      { 
        searchParams: { 
          token: `eq.${token}`,
          email: `eq.${email}`,
          used_at: 'is.null'
        } 
      },
    )

    if (!invitations) throw new Error('Failed to fetch invitation')

    if (!invitations || invitations.length === 0) {
      return NextResponse.json({ error: 'Ongeldige uitnodiging' }, { status: 404 })
    }

    const invitation = invitations[0]

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Uitnodiging is verlopen' }, { status: 410 })
    }

    // Create user account with email verification
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        emailRedirectTo: `https://lionfish-app-es8ks.ondigitalocean.app/auth/callback`
      }
    })

    if (authError) throw authError

    if (!authData.user) {
      return NextResponse.json({ error: 'Kon gebruiker niet aanmaken' }, { status: 500 })
    }

    // Check if email verification is required
    if (!authData.user.email_confirmed_at) {
      return NextResponse.json({ 
        error: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Registratie succesvol! Check je email voor de verificatie link en klik erop voordat je kunt inloggen.'
      }, { status: 200 })
    }

    // Note: No need to create user record since we don't have a separate users table
    // The auth.user is sufficient for our schema

    // Create membership
    try {
      await supabaseRest(
        'memberships',
        {
          method: 'POST',
          body: {
            user_id: authData.user.id,
            company_id: invitation.company_id,
            role: invitation.role
          }
        }
      )
    } catch (membershipError) {
      console.error('Error creating membership:', membershipError)
      // This is critical, but we'll continue
    }

    // Mark invitation as used
    try {
      await supabaseRest(
        'invitations',
        {
          method: 'PATCH',
          searchParams: { id: `eq.${invitation.id}` },
          body: {
            used_at: new Date().toISOString()
          }
        }
      )
    } catch (updateError) {
      console.error('Error updating invitation:', updateError)
      // Non-critical error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account succesvol aangemaakt! Je bent nu lid van het bedrijf.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        company_id: invitation.company_id
      }
    })
  } catch (error: any) {
    console.error('Error in invitation registration:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
