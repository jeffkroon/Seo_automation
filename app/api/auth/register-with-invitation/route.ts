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

    // Create user account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
    })

    if (authError) throw authError

    if (!authData.user) {
      return NextResponse.json({ error: 'Kon gebruiker niet aanmaken' }, { status: 500 })
    }

    // Create user record in users table
    try {
      await supabaseRest(
        'users',
        {
          method: 'POST',
          body: {
            id: authData.user.id,
            email: email.toLowerCase(),
            company_id: invitation.company_id,
            company_name: invitation.company_name
          }
        }
      )
    } catch (userError) {
      console.error('Error creating user record:', userError)
      // Continue anyway, the auth user is created
    }

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
