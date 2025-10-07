import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'
import { supabase } from '@/lib/supabase'

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
          company_id: `eq.${companyId}`
        } 
      },
    )

    // Return memberships with user IDs - frontend will fetch user details separately
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

    // Instead of adding existing users directly, redirect to invitation system
    return NextResponse.json({ 
      error: 'Gebruik het invitation systeem om nieuwe gebruikers toe te voegen. Ga naar "Nieuwe Gebruiker Uitnodigen" sectie.',
      redirect_to_invitation: true
    }, { status: 400 })
  } catch (error: any) {
    console.error('Error in user management:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const body = await req.json()
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is verplicht' }, { status: 400 })
    }

    // Delete membership (this removes the user from the company)
    try {
      await supabaseRest(
        'memberships',
        {
          method: 'DELETE',
          headers: { 'x-company-id': companyId },
          searchParams: {
            user_id: `eq.${userId}`,
            company_id: `eq.${companyId}`
          }
        }
      )
    } catch (membershipError) {
      console.error('Error deleting membership:', membershipError)
      return NextResponse.json({ error: 'Database error deleting user membership' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User succesvol verwijderd uit het bedrijf.' 
    })
  } catch (error: any) {
    console.error('Error removing user from company:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}
