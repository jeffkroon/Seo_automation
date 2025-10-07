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

    // Get user details from auth.users (since we don't have a separate users table)
    const enrichedMemberships = await Promise.all(
      memberships.map(async (membership) => {
        try {
          // Get user details from auth.users
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(membership.user_id)
          
          if (authUser && authUser.user) {
            return {
              ...membership,
              users: {
                id: authUser.user.id,
                email: authUser.user.email
              }
            }
          }
          
          // Fallback: return membership without user details
          return {
            ...membership,
            users: { id: membership.user_id, email: 'Unknown User' }
          }
        } catch (error) {
          console.error('Error fetching user details:', error)
          return {
            ...membership,
            users: { id: membership.user_id, email: 'Unknown User' }
          }
        }
      })
    )

    return NextResponse.json({ memberships: enrichedMemberships })
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
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      return NextResponse.json({ 
        error: 'Fout bij ophalen gebruikers: ' + authError.message 
      }, { status: 500 })
    }

    const user = authUsers.users.find(u => u.email === email.toLowerCase())

    if (!user) {
      return NextResponse.json({ 
        error: 'User met dit email adres bestaat niet. Ze moeten zich eerst registreren.' 
      }, { status: 404 })
    }

    // Check if user is already a member
    const existingMembership = await supabaseRest<any[]>(
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
