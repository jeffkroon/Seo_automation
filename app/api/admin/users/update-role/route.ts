import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

export async function PATCH(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const body = await req.json()
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is verplicht' }, { status: 400 })
    }

    const { userId, role } = body

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId en role zijn verplicht' }, { status: 400 })
    }

    // Validate role
    const validRoles = ['admin', 'user', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Ongeldige rol' }, { status: 400 })
    }

    // Update the membership role
    await supabaseRest(
      'memberships',
      {
        method: 'PATCH',
        headers: { 'x-company-id': companyId },
        searchParams: { 
          user_id: `eq.${userId}`,
          company_id: `eq.${companyId}`
        },
        body: { role },
        prefer: 'return=minimal'
      }
    )

    return NextResponse.json({ success: true, message: 'Rol succesvol aangepast' })
  } catch (error: any) {
    console.error('Error updating user role:', error)
    return NextResponse.json({ error: error?.message || 'Onbekende fout' }, { status: 500 })
  }
}

