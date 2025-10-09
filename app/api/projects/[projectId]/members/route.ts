import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

// GET - Fetch members of a project
export async function GET(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is required' }, { status: 400 })
    }

    const members = await supabaseRest<any[]>(
      'project_members',
      {
        headers: { 'x-company-id': companyId },
        searchParams: {
          project_id: `eq.${params.projectId}`,
          order: 'added_at.desc'
        }
      }
    )

    return NextResponse.json({ members: members || [] })
  } catch (error: any) {
    console.error('Error fetching project members:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Add a member to a project
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Headers required' }, { status: 400 })
    }

    const { member_id, role } = await req.json()

    if (!member_id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const memberData = {
      project_id: params.projectId,
      member_id,
      role: role || 'member'
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/project_members`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(memberData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error adding member:', errorText)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }

    const member = await response.json()

    return NextResponse.json({
      member: Array.isArray(member) ? member[0] : member,
      message: 'Member toegevoegd!'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding member:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remove a member from a project
export async function DELETE(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'Headers required' }, { status: 400 })
    }

    const { member_id } = await req.json()

    if (!member_id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/project_members?project_id=eq.${params.projectId}&member_id=eq.${member_id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error removing member:', errorText)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Member verwijderd' })
  } catch (error: any) {
    console.error('Error removing member:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

