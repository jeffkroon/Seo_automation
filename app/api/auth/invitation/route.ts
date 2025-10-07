import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    
    if (!token) {
      return NextResponse.json({ error: 'Token is verplicht' }, { status: 400 })
    }

    // Get invitation by token
    const invitations = await supabaseRest<any[]>(
      'invitations',
      { 
        searchParams: { 
          token: `eq.${token}`,
          used_at: 'is.null'
        } 
      },
    )

    if (!invitations) throw new Error('Failed to fetch invitation')

    if (!invitations || invitations.length === 0) {
      return NextResponse.json({ error: 'Ongeldige of verlopen uitnodiging' }, { status: 404 })
    }

    const invitation = invitations[0]

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Uitnodiging is verlopen' }, { status: 410 })
    }

    // Get company name
    const companies = await supabaseRest<any[]>(
      'companies',
      { 
        searchParams: { id: `eq.${invitation.company_id}` } 
      },
    )

    const company = companies?.[0]

    return NextResponse.json({ 
      invitation: {
        ...invitation,
        company_name: company?.name || 'Unknown Company'
      }
    })
  } catch (error: any) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
