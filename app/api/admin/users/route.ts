import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    // Get all memberships for this company
    const memberships = await supabaseRest<any[]>(
      'memberships',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          company_id: `eq.${companyId}`,
          select: '*,users(email,id)'
        } 
      },
    )

    return NextResponse.json({ memberships })
  } catch (error: any) {
    console.error('Error fetching company members:', error)
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

    // First, check if user exists in auth.users
    const { data: authUsers } = await supabaseRest<any[]>(
      'auth.users',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { email: `eq.${email}` }
      },
    )

    if (!authUsers || authUsers.length === 0) {
      return NextResponse.json({ 
        error: 'User met dit email adres bestaat niet. Ze moeten zich eerst registreren.' 
      }, { status: 404 })
    }

    const user = authUsers[0]

    // Check if user is already a member
    const { data: existingMembership } = await supabaseRest<any[]>(
      'memberships',
      { 
        headers: { 'x-company-id': companyId },
        searchParams: { 
          user_id: `eq.${user.id}`,
          company_id: `eq.${companyId}`
        }
      },
    )

    if (existingMembership && existingMembership.length > 0) {
      return NextResponse.json({ 
        error: 'User is al lid van dit bedrijf.' 
      }, { status: 409 })
    }

    // Add user to company
    const membership = await supabaseRest(
      'memberships',
      {
        method: 'POST',
        headers: { 'x-company-id': companyId },
        body: {
          user_id: user.id,
          company_id: companyId,
          role: role
        }
      }
    )

    return NextResponse.json({ 
      success: true, 
      message: 'User succesvol toegevoegd aan het bedrijf.',
      membership 
    })
  } catch (error: any) {
    console.error('Error adding user to company:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
