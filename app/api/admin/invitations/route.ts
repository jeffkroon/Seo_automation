import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'
import { randomBytes } from 'crypto'

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Get all invitations for this company
    const invitations = await supabaseRest<any[]>(
      'invitations',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          order: 'created_at.desc'
        } 
      },
    )

    return NextResponse.json({ invitations })
  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const body = await req.json()
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const { email, role = 'user' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is verplicht' }, { status: 400 })
    }

    // Check if user already exists
    const { data: authUsers } = await supabaseRest<any[]>(
      'auth.users',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { email: `eq.${email}` }
      },
    )

    if (authUsers && authUsers.length > 0) {
      return NextResponse.json({ 
        error: 'User met dit email adres bestaat al. Gebruik de "Gebruikers" pagina om ze toe te voegen.' 
      }, { status: 409 })
    }

    // Check if invitation already exists
    const { data: existingInvitations } = await supabaseRest<any[]>(
      'invitations',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          email: `eq.${email}`,
          company_id: `eq.${companyId}`,
          used_at: 'is.null'
        }
      },
    )

    if (existingInvitations && existingInvitations.length > 0) {
      return NextResponse.json({ 
        error: 'Er is al een uitnodiging verstuurd naar dit email adres.' 
      }, { status: 409 })
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')

    // Create invitation
    const invitation = await supabaseRest(
      'invitations',
      {
        method: 'POST',
        headers: { 'x-company-id': companyId },
        body: {
          email: email.toLowerCase(),
          company_id: companyId,
          invited_by: req.headers.get('x-user-id') || 'unknown',
          role: role,
          token: token
        }
      }
    )

    // TODO: Send email here (using your email service)
    // For now, we'll return the invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const invitationLink = `${baseUrl}/auth/register?token=${token}`

    return NextResponse.json({ 
      success: true, 
      message: 'Uitnodiging succesvol aangemaakt.',
      invitation: {
        ...invitation,
        invitation_link: invitationLink
      }
    })
  } catch (error: any) {
    console.error('Error creating invitation:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
