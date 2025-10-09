import { NextResponse } from 'next/server'
import { supabaseRest } from '@/lib/supabase-rest'

// GET - Fetch all projects for the user's company
export async function GET(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    
    if (!companyId) {
      return NextResponse.json({ error: 'X-Company-Id header is required' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const clientId = searchParams.get('client_id')

    const searchParamsObj: Record<string, string> = {
      company_id: `eq.${companyId}`,
      order: 'created_at.desc'
    }

    if (clientId) {
      searchParamsObj.client_id = `eq.${clientId}`
    }

    const projects = await supabaseRest<any[]>(
      'projects',
      {
        headers: { 'x-company-id': companyId },
        searchParams: searchParamsObj
      }
    )

    return NextResponse.json({ projects: projects || [] })
  } catch (error: any) {
    console.error('Error in GET /api/projects:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new project
export async function POST(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'X-Company-Id and X-User-Id headers are required' }, { status: 400 })
    }

    const { name, description, client_id } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    const projectData = {
      company_id: companyId,
      client_id: client_id || null,
      name: name.trim(),
      description: description?.trim() || null,
      created_by: userId,
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(projectData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error creating project:', errorText)
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
    }

    const project = await response.json()

    return NextResponse.json({
      project: Array.isArray(project) ? project[0] : project,
      message: 'Project aangemaakt!'
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update a project
export async function PATCH(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'X-Company-Id and X-User-Id headers are required' }, { status: 400 })
    }

    const { id, name, description, client_id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (client_id !== undefined) updateData.client_id = client_id || null
    updateData.updated_at = new Date().toISOString()

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}&company_id=eq.${companyId}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error updating project:', errorText)
      return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
    }

    const project = await response.json()

    return NextResponse.json({
      project: Array.isArray(project) ? project[0] : project,
      message: 'Project bijgewerkt!'
    })
  } catch (error: any) {
    console.error('Error in PATCH /api/projects:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete a project
export async function DELETE(req: Request) {
  try {
    const companyId = req.headers.get('x-company-id')
    const userId = req.headers.get('x-user-id')
    
    if (!companyId || !userId) {
      return NextResponse.json({ error: 'X-Company-Id and X-User-Id headers are required' }, { status: 400 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Delete project (cascade will handle members and articles)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}&company_id=eq.${companyId}&created_by=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error deleting project:', errorText)
      return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Project verwijderd' })
  } catch (error: any) {
    console.error('Error in DELETE /api/projects:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

